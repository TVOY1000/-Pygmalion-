# Playwright — Автоматическое тестирование MVP Pygmalion

## Назначение
Этот скилл описывает правила использования Playwright для автоматического тестирования приложения Pygmalion (К.Р.И.С.Т.А.Л.Л.) в браузере.

## Контекст проекта
- **Тип приложения**: React-приложение с состоянием в `localStorage`
- **Хранение данных**: `localStorage` (ключи: `ro_dag`, `crystal_state`, `ue_timer`, `acts_log`)
- **Тестируемые сценарии**: 4 акта У.Е. (Условного Единицы)
- **Таймер сгорания**: Проверка через 28 часов

## Установка зависимостей

```bash
npm install -D @playwright/test
npx playwright install
```

## Структура тестов

### Базовый конфиг (playwright.config.ts)
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    headless: true,
    baseURL: 'http://localhost:5173', // Vite dev server
    storageState: './storage-state.json', // Для сохранения localStorage
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

## Сценарии тестирования 4-х актов

### Акт 1: Инициализация реестра
```typescript
import { test, expect } from '@playwright/test';

test('Акт 1: Создание начального реестра ro.DAG', async ({ page }) => {
  await page.goto('/');
  
  // Проверка загрузки интерфейса "Порога"
  await expect(page.locator('data-testid=threshold-container')).toBeVisible();
  
  // Инициализация первого узла
  await page.locator('data-testid=create-node-btn').click();
  await page.locator('data-testid=node-name-input').fill('Инициализация');
  await page.locator('data-testid=confirm-btn').click();
  
  // Проверка сохранения в localStorage
  const localStorageData = await page.evaluate(() => 
    localStorage.getItem('ro_dag')
  );
  expect(localStorageData).not.toBeNull();
  
  // Проверка появления в "Пространстве наблюдения"
  await expect(page.locator('data-testid=observation-space')).toContainText('Инициализация');
});
```

### Акт 2: Транзакция
```typescript
test('Акт 2: Проведение транзакции', async ({ page }) => {
  await page.goto('/');
  
  // Загрузка существующего состояния
  await page.evaluate((data) => localStorage.setItem('ro_dag', data), 
    JSON.stringify(initialState));
  await page.reload();
  
  // Создание транзакции
  await page.locator('data-testid=transaction-btn').click();
  await page.locator('data-testid=amount-input').fill('100');
  await page.locator('data-testid=recipient-input').fill('node_2');
  await page.locator('data-testid=submit-transaction').click();
  
  // Проверка обновления реестра
  const updatedData = await page.evaluate(() => 
    localStorage.getItem('ro_dag')
  );
  const parsed = JSON.parse(updatedData!);
  expect(parsed.transactions.length).toBeGreaterThan(0);
});
```

### Акт 3: Наблюдение
```typescript
test('Акт 3: Проверка пространства наблюдения', async ({ page }) => {
  await page.goto('/');
  
  // Проверка видимости всех узлов
  const nodes = page.locator('data-testid=observation-node');
  await expect(nodes).toHaveCount.greaterThan(0);
  
  // Проверка графического отображения DAG
  await expect(page.locator('data-testid=dag-visualizer')).toBeVisible();
  
  // Проверка цветовой схемы "Сада" (не "поля битвы")
  const backgroundColor = await page.locator('body').evaluate(
    (el) => window.getComputedStyle(el).backgroundImage
  );
  expect(backgroundColor).toContain('gradient');
});
```

### Акт 4: Таймер сгорания (28 часов)
```typescript
test('Акт 4: Эмуляция таймера сгорания У.Е.', async ({ page }) => {
  await page.goto('/');
  
  // Установка начального времени (эмуляция 28 часов назад)
  await page.evaluate(() => {
    const pastTime = Date.now() - (28 * 60 * 60 * 1000);
    localStorage.setItem('ue_timer', JSON.stringify({ start: pastTime }));
  });
  await page.reload();
  
  // Проверка активации сгорания
  await expect(page.locator('data-testid=burn-notification')).toBeVisible();
  await expect(page.locator('data-testid=burn-notification'))
    .toContainText('28 часов');
  
  // Проверка архивирования сгоревших единиц
  const archivedData = await page.evaluate(() => 
    localStorage.getItem('archived_ue')
  );
  expect(archivedData).not.toBeNull();
});
```

## Команды для Qwen в терминале

### Запуск всех тестов
```
qwen: "Запусти Playwright тесты для всех 4 актов Pygmalion"
```

### Запуск конкретного акта
```
qwen: "Запусти тест Акта 2 с проверкой транзакций"
```

### Исправление найденных багов
```
qwen: "Исправь ошибки, найденные в тестах Playwright"
```

### Генерация нового теста
```
qwen: "Создай тест для проверки [компонент/функция] с использованием Playwright"
```

## Правила для Qwen

1. **Всегда проверяй localStorage** — данные приложения хранятся там, не в базе
2. **Используй data-testid атрибуты** — для стабильных селекторов
3. **Сохраняй скриншоты при ошибках** — для отладки
4. **Эмулируй реальные сценарии** — клики, ввод текста, навигация
5. **Проверяй визуальный стиль** — "Сад, а не поле битвы" (градиенты, glassmorphism)
6. **Автосборка перед тестами** — убедись, что приложение собрано

## Полезные утилиты

### Очистка localStorage перед тестом
```typescript
await page.evaluate(() => localStorage.clear());
```

### Сохранение состояния между тестами
```typescript
await page.context().storageState({ path: 'state.json' });
```

### Ожидание появления элемента
```typescript
await expect(page.locator('data-testid=element')).toBeVisible({ timeout: 5000 });
```

## Интеграция с CI/CD

```yaml
# .github/workflows/playwright.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

## Примечания для проекта Pygmalion

- Все тесты должны проходить без ручного вмешательства
- Qwen должен сам исправлять найденные баги в `App.jsx`, компонентах
- После исправления — повторный запуск тестов
- Фокус на тестировании "Порога" и "Пространства наблюдения"
