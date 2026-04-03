-- Pygmalion v0.3.2
-- Экспорт бизнес-метрик для Prometheus
-- Canon v1.0 · 1000 O.K. × 20 000 транзакций/сутки

-- ===========================================
-- Функции для экспорта метрик
-- ===========================================

-- Счётчик активных O.K.
CREATE OR REPLACE FUNCTION prometheus_active_ok_count() RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM participants WHERE is_active = true);
END;
$$ LANGUAGE plpgsql STABLE;

-- Счётчик транзакций за последние 24 часа
CREATE OR REPLACE FUNCTION prometheus_transactions_24h() RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM transactions 
        WHERE created_at > NOW() - INTERVAL '24 hours'
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Счётчик транзакций в секунду (среднее за 5 минут)
CREATE OR REPLACE FUNCTION prometheus_transactions_per_second() RETURNS REAL AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::REAL / 300.0
        FROM transactions 
        WHERE created_at > NOW() - INTERVAL '5 minutes'
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Сгоревшие У.Е. за 24 часа
CREATE OR REPLACE FUNCTION prometheus_ue_burned_24h() RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(amount), 0)
        FROM transactions 
        WHERE transaction_type = 'burn'
        AND created_at > NOW() - INTERVAL '24 hours'
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- ro.DAG успешные валидации
CREATE OR REPLACE FUNCTION prometheus_rodag_validation_success() RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM transactions 
        WHERE validated = true
        AND validated_at > NOW() - INTERVAL '1 hour'
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- ro.DAG неудачные валидации
CREATE OR REPLACE FUNCTION prometheus_rodag_validation_failures() RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM transactions 
        WHERE validated = false
        AND created_at > NOW() - INTERVAL '1 hour'
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Среднее время ответа БД (p95)
CREATE OR REPLACE FUNCTION prometheus_db_response_time_p95() RETURNS REAL AS $$
BEGIN
    RETURN (
        SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY total_exec_time / calls)
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Среднее время ответа БД (p99)
CREATE OR REPLACE FUNCTION prometheus_db_response_time_p99() RETURNS REAL AS $$
BEGIN
    RETURN (
        SELECT percentile_cont(0.99) WITHIN GROUP (ORDER BY total_exec_time / calls)
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Количество подключений к БД
CREATE OR REPLACE FUNCTION prometheus_db_connections() RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active');
END;
$$ LANGUAGE plpgsql STABLE;

-- Максимальное количество подключений
CREATE OR REPLACE FUNCTION prometheus_db_max_connections() RETURNS INTEGER AS $$
BEGIN
    RETURN (SHOW max_connections)::INTEGER;
END;
$$ LANGUAGE plpgsql STABLE;

-- Использование памяти PostgreSQL
CREATE OR REPLACE FUNCTION prometheus_db_memory_usage_bytes() RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT SUM(pg_database_size(datname))
        FROM pg_database
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Активные коны (циклы жизни)
CREATE OR REPLACE FUNCTION prometheus_active_kons_count() RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM kons 
        WHERE status = 'active' 
        AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Коны即将 сгорающие (менее 4 часов)
CREATE OR REPLACE FUNCTION prometheus_expiring_kons_count() RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM kons 
        WHERE status = 'active' 
        AND expires_at < NOW() + INTERVAL '4 hours'
        AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Репутационный вес (средний по активным участникам)
CREATE OR REPLACE FUNCTION prometheus_avg_reputation_weight() RETURNS REAL AS $$
BEGIN
    RETURN (
        SELECT AVG(reputation_weight)
        FROM participants
        WHERE is_active = true
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Топ участников по репутации
CREATE OR REPLACE VIEW v_top_participants_by_reputation AS
SELECT 
    id,
    name,
    reputation_weight,
    given_total,
    received_total,
    burned_total
FROM participants
WHERE is_active = true
ORDER BY reputation_weight DESC
LIMIT 10;

-- Статистика транзакций по типам
CREATE OR REPLACE VIEW v_transaction_stats_by_type AS
SELECT 
    transaction_type,
    COUNT(*) as total_count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount,
    MIN(created_at) as first_transaction,
    MAX(created_at) as last_transaction
FROM transactions
GROUP BY transaction_type;

-- Статистика по доменам активности
CREATE OR REPLACE VIEW v_domain_stats AS
SELECT 
    domain,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    COUNT(DISTINCT from_participant_id) as unique_senders,
    COUNT(DISTINCT to_participant_id) as unique_receivers
FROM transactions
WHERE domain IS NOT NULL
GROUP BY domain;

-- ===========================================
-- View для Prometheus Exporter
-- ===========================================

-- Основная метрика: Активные O.K.
CREATE OR REPLACE VIEW prometheus_metrics_ok AS
SELECT 
    'pygmalion_active_ok_count' as metric_name,
    prometheus_active_ok_count() as metric_value,
    'number' as metric_type,
    'Active Open Keys count' as description;

-- Метрика: Транзакции за 24 часа
CREATE OR REPLACE VIEW prometheus_metrics_transactions AS
SELECT 
    'pygmalion_transactions_24h' as metric_name,
    prometheus_transactions_24h() as metric_value,
    'counter' as metric_type,
    'Total transactions in last 24 hours' as description;

-- Метрика: Сгоревшие У.Е.
CREATE OR REPLACE VIEW prometheus_metrics_burn AS
SELECT 
    'pygmalion_ue_burned_24h' as metric_name,
    prometheus_ue_burned_24h() as metric_value,
    'counter' as metric_type,
    'Burned UE in last 24 hours' as description;

-- Метрика: ro.DAG валидации (успех)
CREATE OR REPLACE VIEW prometheus_metrics_rodag_success AS
SELECT 
    'pygmalion_rodag_validation_success_total' as metric_name,
    prometheus_rodag_validation_success() as metric_value,
    'counter' as metric_type,
    'Successful ro.DAG validations in last hour' as description;

-- Метрика: ro.DAG валидации (неудача)
CREATE OR REPLACE VIEW prometheus_metrics_rodag_failures AS
SELECT 
    'pygmalion_rodag_validation_failures_total' as metric_name,
    prometheus_rodag_validation_failures() as metric_value,
    'counter' as metric_type,
    'Failed ro.DAG validations in last hour' as description;

-- Метрика: Время ответа БД (p95)
CREATE OR REPLACE VIEW prometheus_metrics_db_p95 AS
SELECT 
    'pygmalion_db_response_time_p95_ms' as metric_name,
    ROUND(prometheus_db_response_time_p95() * 1000, 2) as metric_value,
    'gauge' as metric_type,
    'Database response time p95 (ms)' as description;

-- Метрика: Время ответа БД (p99)
CREATE OR REPLACE VIEW prometheus_metrics_db_p99 AS
SELECT 
    'pygmalion_db_response_time_p99_ms' as metric_name,
    ROUND(prometheus_db_response_time_p99() * 1000, 2) as metric_value,
    'gauge' as metric_type,
    'Database response time p99 (ms)' as description;

-- Метрика: Подключения к БД
CREATE OR REPLACE VIEW prometheus_metrics_connections AS
SELECT 
    'pygmalion_db_connections_active' as metric_name,
    prometheus_db_connections() as metric_value,
    'gauge' as metric_type,
    'Active database connections' as description;

-- Метрика: Активные коны
CREATE OR REPLACE VIEW prometheus_metrics_kons AS
SELECT 
    'pygmalion_active_kons_count' as metric_name,
    prometheus_active_kons_count() as metric_value,
    'gauge' as metric_type,
    'Active kons (life cycles) count' as description;

-- Метрика:即将 сгорающие коны
CREATE OR REPLACE VIEW prometheus_metrics_expiring_kons AS
SELECT 
    'pygmalion_expiring_kons_count' as metric_name,
    prometheus_expiring_kons_count() as metric_value,
    'gauge' as metric_type,
    'Kons expiring in less than 4 hours' as description;

-- Метрика: Средняя репутация
CREATE OR REPLACE VIEW prometheus_metrics_reputation AS
SELECT 
    'pygmalion_avg_reputation_weight' as metric_name,
    ROUND(prometheus_avg_reputation_weight(), 2) as metric_value,
    'gauge' as metric_type,
    'Average reputation weight of active participants' as description;

-- ===========================================
-- Комментарии
-- ===========================================

COMMENT ON FUNCTION prometheus_active_ok_count() IS 'Возвращает количество активных O.K.';
COMMENT ON FUNCTION prometheus_transactions_24h() IS 'Транзакции за последние 24 часа';
COMMENT ON FUNCTION prometheus_ue_burned_24h() IS 'Сгоревшие У.Е. за последние 24 часа';
COMMENT ON FUNCTION prometheus_rodag_validation_success() IS 'Успешные ro.DAG валидации';
COMMENT ON FUNCTION prometheus_rodag_validation_failures() IS 'Неудачные ro.DAG валидации';
COMMENT ON FUNCTION prometheus_db_response_time_p95() IS 'Время ответа БД p95 (мс)';
COMMENT ON FUNCTION prometheus_db_response_time_p99() IS 'Время ответа БД p99 (мс)';

COMMENT ON VIEW prometheus_metrics_ok IS 'Prometheus метрика: Активные O.K.';
COMMENT ON VIEW prometheus_metrics_transactions IS 'Prometheus метрика: Транзакции';
COMMENT ON VIEW prometheus_metrics_burn IS 'Prometheus метрика: Сгоревшие У.Е.';
COMMENT ON VIEW prometheus_metrics_rodag_success IS 'Prometheus метрика: ro.DAG успех';
COMMENT ON VIEW prometheus_metrics_rodag_failures IS 'Prometheus метрика: ro.DAG неудачи';
