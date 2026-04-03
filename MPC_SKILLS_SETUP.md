# 📡 MCP-серверы и Скиллы (Skills) Pygmalion

**Проект:** Pygmalion / C.R.I.S.T.A.L.L.  
**Дата:** 20 марта 2026 г.  
**Версия:** MCP Skills v1.0

---

## 🎯 Резюме

Этот документ содержит полную информацию о **MCP-серверах** (Model Context Protocol) и **библиотеках скиллов**, необходимых для развертывания инфраструктуры Pygmalion.

---

## 1. 🔌 MCP-серверы (5 штук)

Для полнофункциональной работы проекта требуются **5 MCP-серверов**:

| № | MCP-сервер | Назначение | Статус |
|---|------------|------------|--------|
| 1 | **PostgreSQL MCP** | Прямое взаимодействие модели с БД ro.DAG | ✅ Найден |
| 2 | **Docker MCP** | Управление контейнерами Activepieces и NiFi | ✅ Найден |
| 3 | **FileSystem (Local) MCP** | Работа с Offline-артефактом и редактирование файлов | ✅ Найден |
| 4 | **GitHub MCP** | Ведение «Летописи» кода и управление репозиторием | ✅ Найден |
| 5 | **Lucide / SVG MCP** | Генерация иконок «Цветка Жизни» | ✅ Найден |

### 📍 Где найти

Все MCP-серверы доступны на **MCP Market**:
- Основной каталог: https://mcpmarket.com/tools
- Поиск по названию в MCP Market

### ⚙️ Настройка

MCP-серверы настраиваются через файл конфигурации Qwen Code:
```
C:\Users\<Ваше Имя>\.qwen\settings.json
```

---

## 2. 📚 Библиотеки скиллов (Skills)

### Категория: Developer Tools

Основной источник: **https://mcpmarket.com/tools/skills/categories/developer-tools**

---

### 🔴 Приоритет 1: Обязательные скиллы

| № | Скилл | Назначение | Ссылка |
|---|-------|------------|--------|
| 1 | **React Best Practices** | Разработка MVP интерфейса (4 протокола) | https://mcpmarket.com/tools/skills/react-best-practices |
| 2 | **TypeScript** | Типизация кода протоколов, уменьшение ошибок | https://mcpmarket.com/tools/skills/typescript |
| 3 | **Docker Compose** | Развёртывание Activepieces + NiFi локально | https://mcpmarket.com/tools/skills/docker-compose |
| 4 | **Node.js + npm** | Работа с Vite, сборка React, скрипты | Встроено в Qwen Code |
| 5 | **Git + GitHub** | Версионирование, работа с форком TVOY1000/-Pygmalion- | Встроено в Qwen Code |

---

### 🟡 Приоритет 2: Полезные скиллы

| № | Скилл | Назначение | Ссылка |
|---|-------|------------|--------|
| 6 | **Tailwind CSS** | Стилизация интерфейса MVP | https://mcpmarket.com/tools/skills/tailwind |
| 7 | **Vite Configuration** | Настройка сборщика под проект | https://mcpmarket.com/tools/skills/vite |
| 8 | **API Design (REST)** | Интеграция протоколов с Activepieces | https://mcpmarket.com/tools/skills/rest-api |
| 9 | **PostgreSQL** | ro.DAG — хранилище транзакций | https://mcpmarket.com/tools/skills/postgresql |
| 10 | **Workflow Automation** | Понимание Activepieces workflows | https://mcpmarket.com/tools/skills/workflow-automation |

---

### 🟢 Приоритет 3: Дополнительные скиллы

| № | Скилл | Назначение | Ссылка |
|---|-------|------------|--------|
| 11 | **ESLint + Prettier** | Качество кода, единый стиль | https://mcpmarket.com/tools/skills/eslint |
| 12 | **Testing (Jest / Vitest)** | Тестирование протоколов | https://mcpmarket.com/tools/skills/testing |
| 13 | **CI/CD (GitHub Actions)** | Авто-деплой на GitHub Pages | https://mcpmarket.com/tools/skills/github-actions |
| 14 | **Logging + Monitoring** | Отладка NiFi конвейеров | https://mcpmarket.com/tools/skills/monitoring |

---

## 3. 📥 Установка скиллов

### Структура папок

```
C:\Users\<Ваше Имя>\.qwen\skills\
├── pygmalion/          ✅ Уже создано
├── react-best-practices/
│   └── skill.md
├── typescript/
│   └── skill.md
├── docker-compose/
│   └── skill.md
├── tailwind/
│   └── skill.md
└── ...
```

### Инструкция по установке

1. Создайте папку: `C:\Users\<Ваше Имя>\.qwen\skills\`
2. Для каждого скилла создайте подпапку: `skills\<skill-name>\`
3. Внутри создайте файл `skill.md` с описанием скилла
4. Qwen Code автоматически подхватит скиллы из этой папки

### Пример содержимого `skill.md`:

```markdown
# Название скилла

**Описание:** Краткое описание назначения скилла

**Для чего используется:**
- Пункт 1
- Пункт 2

**Ссылки:**
- Документация: <URL>
- Примеры: <URL>
```

---

## 4. 🚀 План установки скиллов

| Этап | Скиллы | Срок |
|------|--------|------|
| **После перезагрузки** | Docker Compose, Node.js | Сразу |
| **Этап 2 (ПЛАН)** | React, TypeScript, Vite | Неделя 2 |
| **Этап 3 (ТОК)** | API Design, PostgreSQL | Неделя 3 |
| **Этап 4 (КОЛ)** | Tailwind, Workflow Automation | Неделя 4 |
| **Этап 6 (Масштаб)** | Testing, CI/CD, Monitoring | Неделя 6-7 |

---

## 5. 📄 Документы проекта

| Файл | Описание |
|------|----------|
| `C:\pygmalion\скиллы.txt` | Полный список скиллов и MCP |
| `C:\pygmalion\docker\SCALE_PLAN.md` | План масштабирования |
| `C:\pygmalion\docker\SCALE_REPORT.md` | Итоговый отчёт о масштабировании |
| `C:\pygmalion\docker\docker-compose.prod.yml` | Production конфигурация Docker |
| `C:\pygmalion\docker\.env.production.example` | Шаблон переменных окружения |

---

## 6. 📊 Текущее состояние

| Компонент | Статус |
|-----------|--------|
| MCP-серверы (5/5) | ✅ Найдены |
| Скиллы (14) | ✅ Каталог составлен |
| Документация | ✅ Создана |
| Инфраструктура Docker | ✅ Готова (SCALE_REPORT.md) |

---

## 7. 📞 Поддержка и контакты

### Репозитории
- **GitHub:** TVOY1000/-Pygmalion-
- **Официальный сайт:** (будет добавлен)

### Ресурсы
- **MCP Market:** https://mcpmarket.com
- **Activepieces:** https://www.activepieces.com
- **Apache NiFi:** https://nifi.apache.org

---

## 8. 🐳 Docker-инфраструктура (кратко)

### 10 сервисов Docker:

| Сервис | Версия | Назначение | Ресурсы |
|--------|--------|------------|---------|
| **PostgreSQL** | 15-alpine | ro.DAG реестр | 4GB RAM, 2 CPU |
| **PgBouncer** | 1.20 | Connection Pooling | 512MB, до 1000 подключений |
| **Redis** | 7-alpine | Кэш + сессии | 1GB RAM |
| **Activepieces** | 0.24.0 | Оркестрация ТИУП(Ч) | 2GB RAM, 1.5 CPU |
| **Activepieces Worker** | 0.24.0 | Дополнительный воркер | 1GB RAM, 1 CPU |
| **Apache NiFi** | 1.23.2 | Потоки данных | 2GB RAM, 2 CPU |
| **Nginx** | alpine | Load Balancer | 256MB RAM |
| **Prometheus** | v2.45.0 | Сбор метрик | 1GB RAM |
| **Grafana** | 10.0.0 | Визуализация | 512MB RAM |
| **Node Exporter** | v1.6.0 | Метрики хоста | 256MB RAM |

**Итого:** ~12GB RAM, ~8 CPU cores

### Быстрый старт:

```bash
cd C:\pygmalion\docker

# Копирование .env
cp .env.production.example .env

# Запуск production среды
docker compose -f docker-compose.prod.yml up -d

# Проверка статуса
docker compose -f docker-compose.prod.yml ps

# Просмотр логов
docker compose -f docker-compose.prod.yml logs -f
```

---

**MIT License • Human-centered • Non-political**
