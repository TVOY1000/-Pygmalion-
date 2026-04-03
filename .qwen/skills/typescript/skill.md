# TypeScript

**Описание:** Статическая типизация JavaScript для уменьшения ошибок и улучшения Developer Experience.

**Для чего используется:**
- Типизация кода протоколов Pygmalion
- Уменьшение runtime ошибок через compile-time проверки
- Улучшение автодополнения в IDE
- Самодокументирующийся код

**Основные принципы:**

1. **Базовые типы:**
```typescript
// Примитивы
const name: string = "Pygmalion"
const version: number = 1.0
const isActive: boolean = true

// Массивы
const protocols: string[] = ["ТИУП", "НОД", "РОП", "УП"]
const ids: Array<number> = [1, 2, 3]

// Объекты
interface Protocol {
  id: number
  name: string
  version: string
  isActive: boolean
}
```

2. **Интерфейсы и типы:**
```typescript
// Interface (для объектов и классов)
interface User {
  id: number
  name: string
  email?: string // Опциональное поле
}

// Type (более гибкий)
type ProtocolStatus = "active" | "inactive" | "draft"
type Callback<T> = (data: T) => void
```

3. **Generics:**
```typescript
// Обобщенные типы
function identity<T>(arg: T): T {
  return arg
}

interface ApiResponse<T> {
  data: T
  status: number
  message: string
}
```

4. **Utility Types:**
```typescript
type PartialUser = Partial<User>           // Все поля опциональны
type ReadonlyUser = Readonly<User>         // Все поля readonly
type UserUpdate = Omit<User, "id">         // Без поля id
type UserName = Pick<User, "name">         // Только поле name
```

**Ссылки:**
- Официальная документация: https://www.typescriptlang.org
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook
- React + TypeScript: https://react-typescript-cheatsheet.netlify.app
