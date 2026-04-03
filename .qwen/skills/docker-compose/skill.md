# Docker Compose

**Описание:** Инструмент для определения и запуска многоконтейнерных Docker приложений.

**Для чего используется:**
- Развёртывание Activepieces + NiFi локально
- Оркестрация всей инфраструктуры Pygmalion
- Управление зависимостями между сервисами
- Локальная разработка и тестирование

**Основные принципы:**

1. **Базовая структура docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    image: node:18-alpine
    ports:
      - "3000:3000"
    volumes:
      - .:/app
    environment:
      - NODE_ENV=development
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: pygmalion
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

2. **Инфраструктура Pygmalion (10 сервисов):**
```yaml
services:
  postgres:
    image: postgres:15-alpine
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2'

  pgbouncer:
    image: bitnami/pgbouncer:1.20
    depends_on:
      - postgres

  redis:
    image: redis:7-alpine
    deploy:
      resources:
        limits:
          memory: 1G

  activepieces:
    image: activepieces/activepieces:0.24.0
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.5'

  nifi:
    image: apache/nifi:1.23.2
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '2'

  nginx:
    image: nginx:alpine

  prometheus:
    image: prom/prometheus:v2.45.0

  grafana:
    image: grafana/grafana:10.0.0
```

3. **Команды:**
```bash
# Запуск
docker compose up -d

# Остановка
docker compose down

# Просмотр логов
docker compose logs -f

# Пересборка
docker compose up -d --build

# Масштабирование
docker compose up -d --scale activepieces-worker=3
```

**Ссылки:**
- Документация: https://docs.docker.com/compose
- Compose file reference: https://docs.docker.com/compose/compose-file
- Awesome Compose: https://github.com/docker/awesome-compose
