# Workflow Automation

**Описание:** Автоматизация рабочих процессов через Activepieces workflows.

**Для чего используется:**
- Понимание Activepieces workflows
- Оркестрация ТИУП(Ч) протоколов
- Интеграция между сервисами
- Автоматизация рутинных задач

**Основные принципы:**

1. **Компоненты Activepieces:**
```
Trigger (Триггер):
  - Webhook
  - Schedule (Cron)
  - App Event (из других приложений)

Actions (Действия):
  - HTTP Request
  - Code (JavaScript/TypeScript)
  - Database (PostgreSQL)
  - Delay
  - Branch (Condition)

Flow (Поток):
  Trigger → Action 1 → Action 2 → ... → End
```

2. **Пример workflow для Pygmalion:**
```yaml
name: Execute Protocol ТИУП
trigger:
  type: webhook
  path: /hooks/execute-protocol

steps:
  - name: Validate Input
    type: code
    script: |
      return {
        valid: !!payload.protocolId,
        protocolId: payload.protocolId
      }

  - name: Fetch Protocol
    type: http
    request:
      url: https://api.pygmalion.local/protocols/{{steps.Validate Input.protocolId}}
      method: GET

  - name: Check Status
    type: branch
    condition: "{{steps.Fetch Protocol.status}} == 'active'"
    trueBranch: [Execute Protocol]
    falseBranch: [Send Error]

  - name: Execute Protocol
    type: http
    request:
      url: https://nifi.local:8080/nifi-api/process-groups/execute
      method: POST
      body: "{{steps.Fetch Protocol.config}}"

  - name: Log Transaction
    type: postgresql
    operation: insert
    table: transactions
    data:
      protocol_id: "{{steps.Fetch Protocol.id}}"
      executed_at: "{{now}}"
      result: "{{steps.Execute Protocol.response}}"
```

3. **Переменные и выражения:**
```
{{payload.field}}           # Данные из триггера
{{steps.Step Name.output}}  # Результат шага
{{now}}                     # Текущее время
{{env.VARIABLE_NAME}}       # Переменная окружения
```

4. **Обработка ошибок:**
```yaml
onErrorHandler:
  - name: Log Error
    type: code
    script: |
      console.error('Workflow failed:', error)
  
  - name: Notify Admin
    type: http
    request:
      url: https://hooks.slack.com/services/xxx
      method: POST
      body:
        text: "Workflow failed: {{error.message}}"
```

**Ссылки:**
- Activepieces Docs: https://www.activepieces.com/docs
- Flow Examples: https://www.activepieces.com/docs/flows/examples
- Triggers: https://www.activepieces.com/docs/triggers/overview
