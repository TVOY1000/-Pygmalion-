# Pygmalion / C.R.I.S.T.A.L.L. — Docker окружение

**Версия:** v0.3.0 «Песочница»  
**Canon:** v1.0  
**Этический стоп-кран:** активен

---

## 📋 Компоненты

| Сервис | Порт | Описание |
|--------|------|----------|
| **Nginx** | 80 | Раздача песочницы v0.3.0 |
| **Activepieces** | 8080 | Оркестрация ТИУП(ч) |
| **PostgreSQL** | 5432 | ro.DAG реестр транзакций |
| **Redis** | 6379 | Кэш для Activepieces |
| **pgAdmin** | 8081 | Администрирование БД |

---

## 🚀 Быстрый старт

### 1. Требования

- **Docker Desktop** с **WSL2**
- **Node.js v20.x.x LTS** (для локальной разработки)

### 2. Установка WSL2 (если не установлен)

```powershell
# От имени администратора
wsl --install
```

**Перезагрузите компьютер** после установки.

### 3. Настройка окружения

```bash
# Перейдите в папку docker
cd C:\pygmalion\docker

# Скопируйте .env.example в .env
cp .env.example .env

# Отредактируйте .env (измените пароли на безопасные)
```

### 4. Запуск

```bash
# Запуск всех сервисов
docker compose up -d

# Просмотр логов
docker compose logs -f

# Остановка
docker compose down
```

---

## 📊 Доступ к сервисам

| Сервис | URL | Логин | Пароль |
|--------|-----|-------|--------|
| **Песочница** | http://localhost | — | — |
| **Activepieces** | http://localhost:8080 | — | — |
| **pgAdmin** | http://localhost:8081 | admin@pygmalion.local | из .env |
| **PostgreSQL** | localhost:5432 | pygmalion | из .env |
| **Redis** | localhost:6379 | — | — |

---

## 🗄️ База данных (ro.DAG)

### Схема

- **participants** — участники системы
- **transactions** — ro.DAG реестр транзакций
- **kons** — циклы жизни У.Е. (28 часов)
- **archive_summary** — публичный архив итогов

### Подключение

```bash
# Через psql
psql -h localhost -U pygmalion -d pygmalion

# Через pgAdmin
http://localhost:8081
```

---

## 🔧 Разработка

### Локальный запуск песочницы

```bash
# Без Docker, просто открыть в браузере
C:\pygmalion\sandbox-v0.3.0\index.html
```

### Интеграция с Activepieces

1. Откройте http://localhost:8080
2. Создайте аккаунт
3. Настройте вебхуки для транзакций
4. Подключите PostgreSQL как базу данных

---

## 🛡️ Этический стоп-кран

Эта среда **НЕ** использует:

- ❌ Блокчейн
- ❌ Токены/криптовалюту
- ❌ Сбор персональных данных
- ❌ Геймификацию ради рейтинга
- ❌ ИИ внутри системы учёта

---

## 📝 Команды

```bash
# Перезапуск конкретного сервиса
docker compose restart activepieces

# Логи сервиса
docker compose logs postgres

# Очистка всех данных
docker compose down -v

# Обновление образов
docker compose pull
docker compose up -d
```

---

## 🐛 Диагностика

### Docker не запускается

1. Убедитесь что WSL2 установлен: `wsl --list`
2. Запустите Docker Desktop от имени администратора
3. Проверьте статус: `docker info`

### Ошибки портов

```bash
# Освободить порт 80
netstat -ano | findstr ":80"
taskkill /F /PID <PID>
```

### Сброс базы данных

```bash
docker compose down -v
docker compose up -d postgres
```

---

## 📄 Лицензия

MIT License · Human-centered · Non-political

**Canon v0.3.0 · Песочница · 2026**
