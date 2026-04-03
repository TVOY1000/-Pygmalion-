# API Design (REST)

**Описание:** Принципы проектирования REST API для интеграции протоколов с Activepieces.

**Для чего используется:**
- Интеграция протоколов Pygmalion с Activepieces
- Создание стандартизированных endpoints
- Взаимодействие фронтенда с бэкендом
- Webhook интеграции

**Основные принципы:**

1. **RESTful принципы:**
```
GET    /protocols          # Список всех протоколов
POST   /protocols          # Создание нового протокола
GET    /protocols/:id      # Получение протокола по ID
PUT    /protocols/:id      # Обновление протокола
DELETE /protocols/:id      # Удаление протокола

GET    /protocols/:id/transactions  # Транзакции протокола
POST   /protocols/:id/execute       # Выполнение протокола
```

2. **Стандартные ответы:**
```typescript
// Успех (200/201)
{
  "data": { "id": 1, "name": "ТИУП" },
  "meta": { "timestamp": "2026-03-21T10:00:00Z" }
}

// Ошибка (400/404/500)
{
  "error": {
    "code": "PROTOCOL_NOT_FOUND",
    "message": "Протокол с ID 123 не найден",
    "details": { "id": 123 }
  }
}

// Пагинация
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

3. **Валидация:**
```typescript
// Request body
{
  "name": "ТИУП",
  "version": "1.0.0",
  "config": {
    "timeout": 5000,
    "retries": 3
  }
}

// Response headers
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
```

4. **Activepieces Integration:**
```typescript
// Webhook trigger
POST /webhooks/activepieces/protocol-executed
{
  "event": "protocol.executed",
  "payload": {
    "protocolId": "uuid",
    "status": "completed",
    "result": { ... }
  }
}
```

**Ссылки:**
- REST API Guidelines: https://restfulapi.net
- Microsoft REST Guidelines: https://github.com/microsoft/api-guidelines
- Activepieces Docs: https://www.activepieces.com/docs
