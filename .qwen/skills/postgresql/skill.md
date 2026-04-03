# PostgreSQL

**Описание:** Мощная реляционная СУБД для хранения транзакций ro.DAG.

**Для чего используется:**
- ro.DAG — хранилище транзакций Pygmalion
- ACID транзакции для целостности данных
- Сложные запросы с JOIN и агрегациями
- Full-text search для поиска по артефактам

**Основные принципы:**

1. **Схема ro.DAG:**
```sql
-- Реестр объектов (DAG)
CREATE TABLE dag_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    parent_id UUID REFERENCES dag_objects(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Транзакции
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_id UUID REFERENCES dag_objects(id),
    operation VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_transactions_object ON transactions(object_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_objects_parent ON dag_objects(parent_id);
CREATE INDEX idx_transactions_data ON transactions USING GIN(data);
```

2. **Оптимизация запросов:**
```sql
-- EXPLAIN ANALYZE для анализа плана выполнения
EXPLAIN ANALYZE
SELECT t.*, o.name 
FROM transactions t
JOIN dag_objects o ON t.object_id = o.id
WHERE t.created_at > NOW() - INTERVAL '7 days';

-- Материализованные представления для агрегаций
CREATE MATERIALIZED VIEW daily_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as transaction_count,
    COUNT(DISTINCT object_id) as unique_objects
FROM transactions
GROUP BY DATE(created_at);

-- Refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_stats;
```

3. **PgBouncer (Connection Pooling):**
```ini
; pgbouncer.ini
[databases]
pygmalion = host=localhost port=5432 dbname=pygmalion

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
```

4. **Бэкапы:**
```bash
# Полный бэкап
pg_dump -U admin pygmalion > backup.sql

# Только схема
pg_dump -U admin --schema-only pygmalion > schema.sql

# Восстановление
psql -U admin pygmalion < backup.sql
```

**Ссылки:**
- Документация: https://www.postgresql.org/docs
- PgBouncer: https://www.pgbouncer.org
- Postgres Guide: https://postgresguide.com
