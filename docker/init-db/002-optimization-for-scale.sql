-- Pygmalion / C.R.I.S.T.A.L.L.
-- Оптимизация БД для нагрузки 1000 O.K. × 20 000 транзакций/сутки
-- Canon v0.3.2

-- ===========================================
-- ЧАСТЬ 1: Расширения
-- ===========================================

-- pg_stat_statements для мониторинга медленных запросов
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- timescaledb для partitioning по времени (опционально)
-- CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- ===========================================
-- ЧАСТЬ 2: Оптимизация существующих таблиц
-- ===========================================

-- Добавляем покрывающие индексы для ro.DAG
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_ro_dag_covering
ON transactions (parent_ids, created_at DESC, transaction_type)
WHERE transaction_type = 'transfer';

-- Частичный индекс для активных транзакций (не сгоревших)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_active_unburned
ON transactions (to_participant_id, created_at DESC)
WHERE expires_at > CURRENT_TIMESTAMP AND transaction_type IN ('emission', 'transfer');

-- Индекс для быстрого поиска по участнику и типу
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_participant_type
ON transactions (from_participant_id, transaction_type)
WHERE from_participant_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_to_participant_type
ON transactions (to_participant_id, transaction_type)
WHERE to_participant_id IS NOT NULL;

-- ===========================================
-- ЧАСТЬ 3: Partitioning таблиц (по времени)
-- ===========================================

-- Создаём новую таблицу с partitioning
CREATE TABLE IF NOT EXISTS transactions_partitioned (
    LIKE transactions INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Функция для создания партиций
CREATE OR REPLACE FUNCTION create_monthly_partition(
    table_name TEXT,
    partition_date DATE
) RETURNS TEXT AS $$
DECLARE
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    partition_name := table_name || '_' || to_char(partition_date, 'YYYY_MM');
    start_date := date_trunc('month', partition_date);
    end_date := start_date + INTERVAL '1 month';
    
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %s PARTITION OF %s
         FOR VALUES FROM (%L) TO (%L)',
        partition_name,
        table_name,
        start_date,
        end_date
    );
    
    RETURN partition_name;
END;
$$ LANGUAGE plpgsql;

-- Создаём партиции на 6 месяцев вперёд
DO $$
DECLARE
    i INTEGER;
    partition_date DATE;
BEGIN
    FOR i IN 0..5 LOOP
        partition_date := (CURRENT_DATE + (i || ' months')::INTERVAL)::DATE;
        PERFORM create_monthly_partition('transactions_partitioned', partition_date);
    END LOOP;
END $$;

-- ===========================================
-- ЧАСТЬ 4: Оптимизация для 1000 O.K.
-- ===========================================

-- Индекс для быстрого поиска активных O.K.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_participants_active_ok
ON participants (is_active, created_at DESC)
WHERE is_active = true;

-- Индекс для репутационного веса
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_participants_reputation_desc
ON participants (reputation_weight DESC);

-- Индекс для доменов активности
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_participants_domains
ON participants USING GIN (
    jsonb_build_object(
        'knowledge', domain_knowledge,
        'care', domain_care,
        'creativity', domain_creativity,
        'wisdom', domain_wisdom,
        'trust', domain_trust,
        'participation', domain_participation
    )
);

-- ===========================================
-- ЧАСТЬ 5: Оптимизация Kons (циклы жизни)
-- ===========================================

-- Индекс для активных конов
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kons_active_unexpired
ON kons (participant_id, expires_at DESC)
WHERE status = 'active' AND expires_at > CURRENT_TIMESTAMP;

-- Индекс для即将 сгорающих конов
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kons_expiring_soon
ON kons (expires_at ASC)
WHERE status = 'active' AND expires_at < (CURRENT_TIMESTAMP + INTERVAL '4 hours');

-- ===========================================
-- ЧАСТЬ 6: Материализованные представления
-- ===========================================

-- Агрегированная статистика по участникам (обновляется раз в 5 минут)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_participant_stats AS
SELECT
    p.id,
    p.name,
    p.reputation_weight,
    COUNT(DISTINCT t.id) as total_transactions,
    SUM(CASE WHEN t.transaction_type = 'emission' THEN t.amount ELSE 0 END) as total_emitted,
    SUM(CASE WHEN t.transaction_type = 'transfer' THEN t.amount ELSE 0 END) as total_transferred,
    SUM(CASE WHEN t.transaction_type = 'burn' THEN t.amount ELSE 0 END) as total_burned,
    MAX(t.created_at) as last_activity
FROM participants p
LEFT JOIN transactions t ON t.from_participant_id = p.id OR t.to_participant_id = p.id
GROUP BY p.id, p.name, p.reputation_weight;

-- Индексы для материализованного представления
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_participant_stats_id ON mv_participant_stats (id);
CREATE INDEX IF NOT EXISTS idx_mv_participant_stats_reputation ON mv_participant_stats (reputation_weight DESC);
CREATE INDEX IF NOT EXISTS idx_mv_participant_stats_last_activity ON mv_participant_stats (last_activity DESC);

-- Функция для обновления материализованного представления
CREATE OR REPLACE FUNCTION refresh_mv_participant_stats() RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_participant_stats;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- ЧАСТЬ 7: Функции для бизнес-метрик
-- ===========================================

-- Счётчик активных O.K.
CREATE OR REPLACE FUNCTION get_active_ok_count() RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM participants 
        WHERE is_active = true
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Счётчик транзакций за период
CREATE OR REPLACE FUNCTION get_transactions_count(
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '24 hours',
    end_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM transactions
        WHERE created_at BETWEEN start_time AND end_time
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Счётчик сгоревших У.Е.
CREATE OR REPLACE FUNCTION get_burned_ue_count(
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '24 hours',
    end_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(amount), 0)
        FROM transactions
        WHERE transaction_type = 'burn'
        AND created_at BETWEEN start_time AND end_time
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- ro.DAG валидация (проверка ссылок на родительские транзакции)
CREATE OR REPLACE FUNCTION validate_rodag_transaction(
    p_parent_ids UUID[],
    p_from_participant_id UUID,
    p_amount INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    parent_count INTEGER;
    valid_parents INTEGER;
BEGIN
    -- Если нет родителей, валидация не нужна
    IF p_parent_ids IS NULL OR array_length(p_parent_ids, 1) = 0 THEN
        RETURN TRUE;
    END IF;

    -- Проверяем существование родительских транзакций
    SELECT COUNT(*), COUNT(*) FILTER (
        WHERE to_participant_id = p_from_participant_id
        AND amount = p_amount
        AND expires_at > CURRENT_TIMESTAMP
    )
    INTO parent_count, valid_parents
    FROM transactions
    WHERE id = ANY(p_parent_ids);

    -- Для ro.DAG нужно хотя бы 2-3 подтверждения
    RETURN valid_parents >= LEAST(array_length(p_parent_ids, 1), 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- ===========================================
-- ЧАСТЬ 8: Конфигурация autovacuum
-- ===========================================

-- Настройка autovacuum для таблицы transactions
ALTER TABLE transactions SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02,
    autovacuum_vacuum_threshold = 50,
    autovacuum_analyze_threshold = 50
);

-- Настройка autovacuum для таблицы participants
ALTER TABLE participants SET (
    autovacuum_vacuum_scale_factor = 0.02,
    autovacuum_analyze_scale_factor = 0.01
);

-- ===========================================
-- ЧАСТЬ 9: Экспорт метрик для Prometheus
-- ===========================================

-- View для экспорта метрик активных O.K.
CREATE OR REPLACE VIEW v_prometheus_active_ok AS
SELECT
    1 as active_ok_count,
    COUNT(*) FILTER (WHERE is_active = true) as ok_active,
    COUNT(*) FILTER (WHERE is_active = false) as ok_inactive
FROM participants;

-- View для экспорта метрик транзакций
CREATE OR REPLACE VIEW v_prometheus_transactions AS
SELECT
    transaction_type,
    COUNT(*) as total_count,
    EXTRACT(EPOCH FROM (NOW() - MIN(created_at))) as seconds_since_first
FROM transactions
GROUP BY transaction_type;

-- View для экспорта метрик сгорания
CREATE OR REPLACE VIEW v_prometheus_burn AS
SELECT
    COUNT(*) FILTER (
        WHERE created_at > NOW() - INTERVAL '24 hours'
    ) as burned_last_24h,
    COUNT(*) FILTER (
        WHERE created_at > NOW() - INTERVAL '1 hour'
    ) as burned_last_hour,
    SUM(amount) FILTER (
        WHERE created_at > NOW() - INTERVAL '24 hours'
    ) as ue_burned_last_24h
FROM transactions
WHERE transaction_type = 'burn';

-- ===========================================
-- ЧАСТЬ 10: Комментарии
-- ===========================================

COMMENT ON FUNCTION create_monthly_partition(TEXT, DATE) 
IS 'Создаёт месячную партицию для таблицы';

COMMENT ON FUNCTION validate_rodag_transaction(UUID[], UUID, INTEGER) 
IS 'Валидация ro.DAG транзакции (минимум 2-3 подтверждения)';

COMMENT ON MATERIALIZED VIEW mv_participant_stats 
IS 'Агрегированная статистика участников (обновлять каждые 5 мин)';

COMMENT ON FUNCTION refresh_mv_participant_stats() 
IS 'Обновляет материализованное представление CONCURRENTLY';
