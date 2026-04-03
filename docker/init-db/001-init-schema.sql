-- Pygmalion / C.R.I.S.T.A.L.L.
-- Инициализация базы данных для ro.DAG реестра
-- Canon v0.3.0

-- Включаем расширение для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- Таблица: Участники (Participants)
-- ===========================================
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Репутационные метрики
    reputation_weight INTEGER DEFAULT 0,
    given_total INTEGER DEFAULT 0,
    received_total INTEGER DEFAULT 0,
    burned_total INTEGER DEFAULT 0,
    
    -- Домены активности (Цветок жизни)
    domain_knowledge INTEGER DEFAULT 0,
    domain_care INTEGER DEFAULT 0,
    domain_creativity INTEGER DEFAULT 0,
    domain_wisdom INTEGER DEFAULT 0,
    domain_trust INTEGER DEFAULT 0,
    domain_participation INTEGER DEFAULT 0,
    
    -- Метаданные
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_participants_name ON participants(name);
CREATE INDEX idx_participants_reputation ON participants(reputation_weight);

-- ===========================================
-- Таблица: Транзакции (ro.DAG реестр)
-- ===========================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Ссылки на предыдущие транзакции (ro.DAG валидация)
    parent_ids UUID[] DEFAULT '{}',
    
    -- Участники
    from_participant_id UUID REFERENCES participants(id),
    to_participant_id UUID REFERENCES participants(id),
    
    -- Сумма
    amount INTEGER NOT NULL CHECK (amount > 0 AND amount <= 13),
    
    -- Тип транзакции
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('emission', 'transfer', 'receive', 'burn')),
    
    -- Сообщение благодарности
    message TEXT,
    
    -- Домен активности
    domain VARCHAR(50) CHECK (domain IN ('knowledge', 'care', 'creativity', 'wisdom', 'trust', 'participation')),
    
    -- Временные метки
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- 28 часов для сгорания
    
    -- Метаданные
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_transactions_from ON transactions(from_participant_id);
CREATE INDEX idx_transactions_to ON transactions(to_participant_id);
CREATE INDEX idx_transactions_created ON transactions(created_at);
CREATE INDEX idx_transactions_expires ON transactions(expires_at);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);

-- Индекс для ro.DAG графа (ссылки на родительские транзакции)
CREATE INDEX idx_transactions_parents ON transactions USING GIN (parent_ids);

-- ===========================================
-- Таблица: Коны (циклы жизни)
-- ===========================================
CREATE TABLE IF NOT EXISTS kons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id),
    
    -- Статус Кона
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    
    -- Эмиссия
    emitted_amount INTEGER NOT NULL,
    remaining_amount INTEGER NOT NULL,
    
    -- Временные метки
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Итоги
    given_amount INTEGER DEFAULT 0,
    burned_amount INTEGER DEFAULT 0,
    
    -- Метаданные
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_kons_participant ON kons(participant_id);
CREATE INDEX idx_kons_status ON kons(status);
CREATE INDEX idx_kons_expires ON kons(expires_at);

-- ===========================================
-- Таблица: Архив итогов (публичный, неизменяемый)
-- ===========================================
CREATE TABLE IF NOT EXISTS archive_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id),
    participant_name VARCHAR(255) NOT NULL,
    
    -- Итоговые значения
    final_reputation_weight INTEGER NOT NULL,
    total_given INTEGER NOT NULL,
    total_received INTEGER NOT NULL,
    total_burned INTEGER NOT NULL,
    
    -- Домены
    domains JSONB DEFAULT '{}'::jsonb,
    
    -- Временная метка фиксации
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Хэш для верификации (без блокчейна, локальная верификация)
    verification_hash VARCHAR(64)
);

CREATE INDEX idx_archive_participant ON archive_summary(participant_id);
CREATE INDEX idx_archive_archived ON archive_summary(archived_at);

-- ===========================================
-- Представление: Текущий статус участников
-- ===========================================
CREATE OR REPLACE VIEW participant_status AS
SELECT 
    p.id,
    p.name,
    p.reputation_weight,
    p.given_total,
    p.received_total,
    p.burned_total,
    p.is_active,
    p.created_at,
    COUNT(DISTINCT k.id) as active_kons,
    COUNT(DISTINCT t.id) as total_transactions
FROM participants p
LEFT JOIN kons k ON k.participant_id = p.id AND k.status = 'active'
LEFT JOIN transactions t ON t.from_participant_id = p.id OR t.to_participant_id = p.id
GROUP BY p.id;

-- ===========================================
-- Триггер: Обновление updated_at
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_participants_updated_at
    BEFORE UPDATE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- Триггер: Автоматическое вычисление репутационного веса
-- ===========================================
CREATE OR REPLACE FUNCTION calculate_reputation_weight()
RETURNS TRIGGER AS $$
BEGIN
    -- Формула: (Отдано × 2) + (Принято × 1) − (Сгорело × 1)
    NEW.reputation_weight = (NEW.given_total * 2) + (NEW.received_total * 1) - (NEW.burned_total * 1);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reputation_weight
    BEFORE INSERT OR UPDATE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION calculate_reputation_weight();

-- ===========================================
-- Начальные данные (демо)
-- ===========================================
INSERT INTO participants (name, given_total, received_total, burned_total) VALUES
    ('Участник 1', 10, 5, 0),
    ('Участник 2', 5, 10, 0),
    ('Участник 3', 0, 0, 0)
ON CONFLICT DO NOTHING;

-- ===========================================
-- Комментарии
-- ===========================================
COMMENT ON TABLE participants IS 'Участники системы Pygmalion';
COMMENT ON TABLE transactions IS 'ro.DAG реестр транзакций';
COMMENT ON TABLE kons IS 'Коны — циклы жизни У.Е. (28 часов)';
COMMENT ON TABLE archive_summary IS 'Публичный архив итогов (неизменяемый)';

COMMENT ON COLUMN transactions.parent_ids IS 'Ссылки на родительские транзакции для ro.DAG валидации';
COMMENT ON COLUMN transactions.transaction_type IS 'Тип: emission (эмиссия), transfer (передача), receive (получение), burn (сгорание)';
COMMENT ON COLUMN transactions.amount IS 'Сумма У.Е. (канон: 1-13)';
COMMENT ON COLUMN transactions.expires_at IS 'Время сгорания У.Е. (28 часов после эмиссии)';

COMMENT ON COLUMN participants.reputation_weight IS 'Репутационный вес: (Отдано×2) + (Принято×1) − (Сгорело×1)';
COMMENT ON COLUMN participants.domain_knowledge IS 'Домен: Знания';
COMMENT ON COLUMN participants.domain_care IS 'Домен: Забота';
COMMENT ON COLUMN participants.domain_creativity IS 'Домен: Творчество';
COMMENT ON COLUMN participants.domain_wisdom IS 'Домен: Мудрость';
COMMENT ON COLUMN participants.domain_trust IS 'Домен: Доверие';
COMMENT ON COLUMN participants.domain_participation IS 'Домен: Участие';
