# Testing (Jest / Vitest)

**Описание:** Фреймворки для тестирования протоколов и компонентов.

**Для чего используется:**
- Тестирование протоколов Pygmalion
- Unit тесты для утилит и хуков
- Integration тесты для API
- E2E тесты для критических путей

**Основные принципы:**

1. **Vitest конфигурация (vitest.config.ts):**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{js,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      threshold: {
        lines: 80,
        functions: 80,
        branches: 80,
      },
    },
  },
})
```

2. **Unit тесты:**
```typescript
// src/utils/protocol.test.ts
import { describe, it, expect, vi } from 'vitest'
import { executeProtocol } from './protocol'

describe('executeProtocol', () => {
  it('должен выполнить протокол успешно', async () => {
    const result = await executeProtocol({ id: 1, name: 'ТИУП' })
    
    expect(result.status).toBe('completed')
    expect(result.protocolId).toBe(1)
  })

  it('должен выбросить ошибку при неверном ID', async () => {
    await expect(executeProtocol({ id: -1 }))
      .rejects
      .toThrow('Invalid protocol ID')
  })
})
```

3. **React компонент тесты:**
```typescript
// src/components/ProtocolCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ProtocolCard } from './ProtocolCard'

describe('ProtocolCard', () => {
  const mockProtocol = {
    id: 1,
    name: 'ТИУП',
    version: '1.0.0',
    isActive: true,
  }

  it('должен отображать название протокола', () => {
    render(<ProtocolCard protocol={mockProtocol} />)
    expect(screen.getByText('ТИУП')).toBeInTheDocument()
  })

  it('должен вызывать onExecute при клике', () => {
    const onExecute = vi.fn()
    render(<ProtocolCard protocol={mockProtocol} onExecute={onExecute} />)
    
    fireEvent.click(screen.getByRole('button', { name: /выполнить/i }))
    expect(onExecute).toHaveBeenCalledWith(mockProtocol.id)
  })
})
```

4. **API тесты (MSW mocking):**
```typescript
// src/api/protocols.test.ts
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { fetchProtocols } from './protocols'

const server = setupServer(
  http.get('/api/protocols', () => {
    return HttpResponse.json([
      { id: 1, name: 'ТИУП' },
      { id: 2, name: 'НОД' },
    ])
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

it('должен загрузить список протоколов', async () => {
  const protocols = await fetchProtocols()
  expect(protocols).toHaveLength(2)
  expect(protocols[0].name).toBe('ТИУП')
})
```

5. **NPM скрипты:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

**Ссылки:**
- Vitest: https://vitest.dev
- Testing Library: https://testing-library.com
- MSW: https://mswjs.io
