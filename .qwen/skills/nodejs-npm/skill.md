# Node.js + npm

**Описание:** Среда выполнения JavaScript и менеджер пакетов для работы с Vite, сборкой React и скриптами проекта Pygmalion.

**Для чего используется:**
- Запуск Vite dev-сервера
- Сборка React-приложения для production
- Установка зависимостей проекта
- Выполнение скриптов (lint, test, build)

**Основные команды:**

1. **Установка Node.js:**
```bash
# Проверка версии
node --version
npm --version

# Рекомендуется Node.js 18.x или 20.x
# Скачать: https://nodejs.org
# Или через nvm-windows: https://github.com/coreybutler/nvm-windows
```

2. **Базовые команды npm:**
```bash
# Установка всех зависимостей из package.json
npm install

# Чистая установка (для CI/CD)
npm ci

# Установка нового пакета
npm install <package-name>
npm install -D <package-name>  # как dev-зависимость

# Обновление пакетов
npm update
npm outdated  # проверить устаревшие
```

3. **Скрипты проекта Pygmalion (package.json):**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx",
    "lint:fix": "eslint src --ext ts,tsx --fix",
    "format": "prettier --write src",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

4. **Использование скриптов:**
```bash
# Запуск dev-сервера (http://localhost:3000)
npm run dev

# Production сборка
npm run build

# Предпросмотр сборки
npm run preview

# Линтинг и форматирование
npm run lint
npm run format

# Тесты
npm run test
npm run test:run
```

5. **Структура node_modules:**
```
project/
├── node_modules/      # Зависимости (не коммитить в git)
├── package.json       # Зависимости и скрипты
├── package-lock.json  # Заблокированные версии (коммитить!)
└── .npmrc             # npm конфигурация (опционально)
```

6. **Полезные утилиты:**
```bash
# Проверка уязвимостей
npm audit
npm audit fix

# Глобальные пакеты
npm install -g npm-check-updates
ncu  # проверить обновления

# Очистка кэша
npm cache clean --force
```

7. **.nvmrc (версия Node.js для проекта):**
```
# В корне проекта
20.11.0
```

```bash
# Использование
nvm use
```

**Ссылки:**
- Node.js: https://nodejs.org
- npm Docs: https://docs.npmjs.com
- nvm-windows: https://github.com/coreybutler/nvm-windows
- Package.json guide: https://docs.npmjs.com/cli/v10/configuring-npm/package-json
