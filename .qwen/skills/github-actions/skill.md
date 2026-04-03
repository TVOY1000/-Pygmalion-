# CI/CD (GitHub Actions)

**Описание:** Автоматизация сборки, тестирования и деплоя через GitHub Actions.

**Для чего используется:**
- Авто-деплой на GitHub Pages
- Запуск тестов при каждом коммите
- Линтинг и форматирование в CI
- Сборка production билда

**Основные принципы:**

1. **Базовый workflow (.github/workflows/ci.yml):**
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm run test:run
      
      - name: Build
        run: npm run build
```

2. **Deploy на GitHub Pages:**
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

3. **Docker build and push:**
```yaml
name: Build and Push Docker

on:
  release:
    types: [published]

jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: pygmalion/app:${{ github.ref_name }}
          cache-from: type=registry,ref=pygmalion/app:buildcache
          cache-to: type=inline
```

4. **Environment secrets:**
```
Настройки репозитория → Secrets and variables → Actions:

DOCKER_USERNAME    # Логин Docker Hub
DOCKER_TOKEN       # Токен Docker Hub
DATABASE_URL       # Строка подключения к БД
API_KEY            # API ключи
```

5. **Matrix testing:**
```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [16, 18, 20]
        os: [ubuntu-latest, windows-latest]
    
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test
```

**Ссылки:**
- GitHub Actions Docs: https://docs.github.com/actions
- Actions Marketplace: https://github.com/marketplace/actions
- Awesome Actions: https://github.com/sdras/awesome-actions
