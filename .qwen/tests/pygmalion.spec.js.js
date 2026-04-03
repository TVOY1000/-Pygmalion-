import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:5173'; // поправь если порт другой

// вспомогательная функция
async function getLocalStorage(page, key) {
  return await page.evaluate((k) => localStorage.getItem(k), key);
}

test.describe('Pygmalion MVP — 4 Acts', () => {

  test('Act 1 — Emission (R.U. creation)', async ({ page }) => {
    await page.goto(APP_URL);

    // ⚠️ адаптируй селектор под свой UI
    await page.click('[data-testid="create-ru"]');

    const state = await getLocalStorage(page, 'crystal_state');

    expect(state).not.toBeNull();

    console.log('Act 1 PASS: R.U. created in localStorage');
  });


  test('Act 2 — Transfer (assignment)', async ({ page }) => {
    await page.goto(APP_URL);

    await page.click('[data-testid="create-ru"]');
    await page.fill('[data-testid="recipient-input"]', 'test_user');
    await page.click('[data-testid="send-ru"]');

    const state = await getLocalStorage(page, 'crystal_state');

    expect(state).toContain('pending');

    console.log('Act 2 PASS: R.U. moved to pending state');
  });


  test('Act 3 — Withdrawal window', async ({ page }) => {
    await page.goto(APP_URL);

    await page.click('[data-testid="create-ru"]');
    await page.fill('[data-testid="recipient-input"]', 'test_user');
    await page.click('[data-testid="send-ru"]');

    // отзыв
    await page.click('[data-testid="withdraw-ru"]');

    const state = await getLocalStorage(page, 'crystal_state');

    expect(state).not.toContain('pending');

    console.log('Act 3 PASS: withdrawal applied');
  });


  test('Act 4 — Finalization (R.U. → R.M.)', async ({ page }) => {
    await page.goto(APP_URL);

    await page.click('[data-testid="create-ru"]');
    await page.fill('[data-testid="recipient-input"]', 'test_user');
    await page.click('[data-testid="send-ru"]');

    // имитация времени (если есть таймер — лучше мокнуть)
    await page.waitForTimeout(3000);

    await page.reload();

    const roDag = await getLocalStorage(page, 'ro_dag');

    expect(roDag).not.toBeNull();

    console.log('Act 4 PASS: R.M. recorded in ro.DAG');
  });


  test('Dispute scenario', async ({ page }) => {
    await page.goto(APP_URL);

    // ⚠️ если есть кнопка спора
    await page.click('[data-testid="open-dispute"]');

    const log = await getLocalStorage(page, 'acts_log');

    expect(log).toContain('dispute');

    console.log('Dispute PASS: dispute recorded');
  });

});
