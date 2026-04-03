# 🚀 Pygmalion v0.3.2 — План масштабирования

**Canon:** v1.0
**Цель:** 1000 O.K. × 20 000 транзакций/сутки
**Статус:** Production Ready
**Дата обновления:** Март 2026

---

## 📊 Архитектура инфраструктуры

```
┌─────────────────────────────────────────────────────────────────┐
│                         Nginx (Load Balancer)                    │
│                         Port: 80/443                             │
│                    Rate Limiting: 100 req/s/IP                   │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Sandbox     │    │  Activepieces    │    │  Activepieces   │
│   v0.3.2      │    │    (Primary)     │    │     Worker      │
│   Static      │    │    Port: 8080    │    │    Port: 8081   │
└───────────────┘    └──────────────────┘    └─────────────────┘
                            │                       │
                            └───────────┬───────────┘
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │    Apache NiFi        │
                            │   ТИУП(ч) Flows       │
                            │    Port: 8090         │
                            └───────────────────────┘
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │     PgBouncer         │
                            │  Connection Pool      │
                            │    Port: 6432         │
                            └───────────────────────┘
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │    PostgreSQL 15      │
                            │   ro.DAG Registry     │
                            │    Port: 5432         │
                            └───────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
                    ▼                                       ▼
        ┌───────────────────┐                   ┌───────────────────┐
        │      Redis 7      │                   │   pg-backup       │
        │   Cache/Sessions  │                   │   Daily Backup    │
        │    Port: 6379     │                   │   /backups        │
        └───────────────────┘                   └───────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   Monitoring Stack    │
        │  Prometheus + Grafana │
        │   Ports: 9090, 3000   │
        └───────────────────────┘
```

---

## 🎯 Расчёт нагрузки

| Параметр | Значение | Примечание |
|----------|----------|------------|
| **O.K. (участники)** | 1000 | Одновременных пользователей |
| **Транзакций/сутки** | 20 000 | Цель |
| **Транзакций/час** | ~833 | В среднем |
| **Транзакций/минуту** | ~14 | В среднем |
| **Пик (×5)** | ~70 | Транзакций/минуту |
| **Время ответа БД** | <100ms | p95 |
| **Uptime** | 99.9% | Цель |

---

## 📁 Структура файлов

```
docker/
├── docker-compose.prod.yml       # Production конфигурация
├── docker-compose.yml            # Local development
├── .env.example                  # Шаблон переменных окружения
├── .env.production.example       # Production шаблон
├── nginx/
│   └── nginx.conf                # Load Balancer + Rate Limiting (100 req/s/IP)
├── prometheus/
│   ├── prometheus.yml            # Конфигурация сбора метрик
│   ├── rules/
│   │   └── alerts.yml            # Правила алертинга
│   ├── pygmalion_exporter.py     # Business metrics exporter
│   ├── Dockerfile.exporter       # Dockerfile для экспортера
│   └── requirements.txt          # Python зависимости
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/
│   │   └── dashboards/
│   └── dashboards/
│       └── pygmalion-main.json   # Главный дашборд
├── init-db/
│   ├── 001-init-schema.sql       # Базовая схема
│   ├── 002-optimization-for-scale.sql  # Оптимизация для нагрузки
│   └── 003-prometheus-metrics.sql      # Бизнес-метрики для Prometheus
├── nifi/
│   ├── flow.xml                  # NiFi процессоры
│   └── postgresql-driver.jar     # PostgreSQL драйвер
├── activepieces/
│   └── flows.json                # Activepieces flows (эмиссия, transfer, burn)
├── backups/                      # Автоматические backup PostgreSQL
└── SCALE_PLAN.md                 # Этот файл
```

---

## 🚀 Быстрый старт

### 1. Требования

- **Docker Desktop** с **WSL2** (Windows)
- **16 GB RAM** (минимум)
- **4 CPU cores** (минимум)
- **50 GB SSD** (свободное место)

### 2. Установка WSL2 (если не установлен)

```powershell
# От имени администратора
wsl --install
```

**Перезагрузите компьютер** после установки.

### 3. Настройка окружения

```bash
cd C:\pygmalion\docker

# Копируем .env.example в .env
cp .env.example .env

# Редактируем .env (меняем пароли на безопасные)
nano .env
```

### 4. Запуск production среды

```bash
# Запуск всех сервисов
docker compose -f docker-compose.prod.yml up -d

# Проверка статуса
docker compose -f docker-compose.prod.yml ps

# Просмотр логов
docker compose -f docker-compose.prod.yml logs -f

# Остановка
docker compose -f docker-compose.prod.yml down
```

---

## 📊 Доступ к сервисам

| Сервис | URL | Логин | Пароль |
|--------|-----|-------|--------|
| **Песочница v0.3.2** | http://localhost/sandbox | — | — |
| **Activepieces** | http://localhost:8080 | — | — |
| **Apache NiFi** | http://localhost:8090/nifi | admin | из .env |
| **PgAdmin** | http://localhost:8081 | admin@pygmalion.local | из .env |
| **Grafana** | http://localhost:3000 | admin | из .env |
| **Prometheus** | http://localhost:9090 | — | — |
| **PostgreSQL** | localhost:5432 | pygmalion | из .env |
| **PgBouncer** | localhost:6432 | pygmalion | из .env |
| **Redis** | localhost:6379 | — | — |

---

## 🔧 ТИУП(ч) — Настройка потоков

### Activepieces Flows

**Flow 1: Эмиссия У.Е.**
```
Trigger: Webhook (POST /api/emission)
  ↓
Validate: O.K. exists & has active kon
  ↓
Create: Transaction (type=emission)
  ↓
Update: Participant UE balance
  ↓
Response: Success with UE count
```

**Flow 2: Передача (ro.DAG)**
```
Trigger: Webhook (POST /api/transfer)
  ↓
Validate: ro.DAG (2-3 parent refs)
  ↓
Check: Sender has enough UE
  ↓
Create: Transaction (type=transfer)
  ↓
Update: Both participants balances
  ↓
Response: Success with new UM
```

**Flow 3: Сгорание**
```
Trigger: Schedule (every hour)
  ↓
Query: Expired kons (>28 hours)
  ↓
Create: Transaction (type=burn)
  ↓
Update: Participant burned_total
  ↓
Archive: Old transactions
```

**Flow 4: Итоги**
```
Trigger: Schedule (daily 00:00)
  ↓
Calculate: Reputation weight
  ↓
Archive: Daily summary
  ↓
Notify: Participants (optional)
```

### Apache NiFi Processors

**Processor 1: ConsumeKafka**
```
Type: ConsumeKafka_2_0
Topic: pygmalion.transactions
Batch Size: 1000
Output: PostgreSQL
```

**Processor 2: QueryDatabase**
```
Type: QueryDatabase
SQL: SELECT * FROM transactions WHERE validated = false
Output: ro.DAG Validation
```

**Processor 3: MergeContent**
```
Type: MergeContent
Minimum Entries: 1000
Output: Archive (parquet)
```

**Processor 4: RouteOnAttribute**
```
Type: RouteOnAttribute
Rules: anomaly_detection
Output: Alert Channel
```

---

## 📈 Мониторинг

### Ключевые метрики

| Метрика | Порог | Действие |
|---------|-------|----------|
| **Активные O.K.** | <100 | Алерт warning |
| **Транзакций/сек** | >50 | Алерт warning |
| **Время ответа БД (p95)** | >100ms | Алерт warning |
| **Время ответа БД (p99)** | >500ms | Алерт critical |
| **CPU** | >80% | Алерт warning |
| **Память** | >85% | Алерт critical |
| **Диск** | >80% | Алерт warning |
| **ro.DAG валидация** | >5 неудач/мин | Алерт warning |

### Дашборды Grafana

1. **Pygmalion Main** — общая картина
2. **Database Performance** — детально по БД
3. **Activepieces Flows** — выполнение flows
4. **Business Metrics** — O.K., транзакции, У.Е.

---

## 🛡️ Резервирование

### Backup PostgreSQL

```bash
# Автоматический backup ежедневно
# Хранится в /backups

# Ручной backup
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U pygmalion pygmalion > backup.sql

# Восстановление
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U pygmalion pygmalion < backup.sql
```

### Репликация (опционально)

Для высокой доступности можно добавить slave-реплику:

```yaml
postgres-slave:
  image: postgres:15-alpine
  environment:
    - POSTGRES_USER=repl
    - POSTGRES_PASSWORD=repl_password
  command: >
    postgres
    -c hot_standby=on
    -c primary_conninfo='host=postgres port=5432 user=repl password=repl_password'
```

---

## ⚠️ Этический стоп-кран

Эта инфраструктура **НЕ** использует:

- ❌ Блокчейн
- ❌ Токены/криптовалюту
- ❌ Сбор персональных данных (IP, email, телефоны)
- ❌ Геймификацию ради рейтинга
- ❌ ИИ внутри системы учёта

**Данные хранятся:**
- В PostgreSQL (локально)
- В Redis (кэш, сессии)
- **НЕ** передаются третьим лицам

---

## 🐛 Диагностика

### Проверка статуса сервисов

```bash
# Все сервисы
docker compose -f docker-compose.prod.yml ps

# Логи конкретного сервиса
docker compose -f docker-compose.prod.yml logs postgres
docker compose -f docker-compose.prod.yml logs activepieces
docker compose -f docker-compose.prod.yml logs nifi
```

### Проверка БД

```bash
# Подключение к PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U pygmalion -d pygmalion

# Проверка количества O.K.
SELECT COUNT(*) FROM participants WHERE is_active = true;

# Проверка транзакций за 24 часа
SELECT COUNT(*) FROM transactions 
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Проверка метрик

```bash
# Prometheus metrics
curl http://localhost:9090/api/v1/query?query=pygmalion_active_ok_count

# Grafana API
curl http://admin:password@localhost:3000/api/health
```

---

## 📝 Команды для управления

```bash
# Перезапуск сервиса
docker compose -f docker-compose.prod.yml restart activepieces

# Масштабирование worker'ов
docker compose -f docker-compose.prod.yml up -d --scale activepieces-worker=3

# Обновление образов
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Очистка старых данных
docker compose -f docker-compose.prod.yml down -v  # Осторожно: удалит все данные!

# Экспорт логов
docker compose -f docker-compose.prod.yml logs --tail=1000 > logs.txt
```

---

## ✅ Чек-лист готовности

- [ ] WSL2 установлен
- [ ] Docker Desktop запущен
- [ ] .env настроен (пароли изменены)
- [ ] docker-compose.prod.yml проверен
- [ ] Все сервисы запускаются
- [ ] БД инициализирована (схема + оптимизация)
- [ ] Activepieces flows настроены
- [ ] NiFi процессоры загружены
- [ ] Grafana дашборды импортированы
- [ ] Prometheus алерты работают
- [ ] Backup настроен
- [ ] Тестовая нагрузка пройдена (1000 O.K.)

---

## 📄 Лицензия

MIT License · Human-centered · Non-political

**Canon v0.3.2 · Scale Plan · 2026**
