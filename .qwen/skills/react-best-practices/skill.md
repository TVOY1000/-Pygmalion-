# React Best Practices

**Описание:** Лучшие практики разработки на React для создания масштабируемых и поддерживаемых приложений.

**Для чего используется:**
- Разработка MVP интерфейса Pygmalion (4 протокола)
- Создание компонентной архитектуры
- Управление состоянием (Context API, Zustand, Redux)
- Оптимизация производительности (memo, useMemo, useCallback)
- Структура проекта и организация файлов

**Основные принципы:**

1. **Компоненты:**
   - Функциональные компоненты вместо классовых
   - Разделение на Presentational и Container компоненты
   - Single Responsibility Principle для каждого компонента

2. **Хуки:**
   - useState для локального состояния
   - useEffect для побочных эффектов
   - useMemo/useCallback для оптимизации
   - Custom hooks для переиспользуемой логики

3. **Типизация:**
   - TypeScript + React.FC или React.FunctionComponent
   - Интерфейсы для props
   - Generics для событий

4. **Структура проекта:**
```
src/
├── components/     # Переиспользуемые компоненты
├── pages/          # Страницы приложения
├── hooks/          # Custom hooks
├── contexts/       # React Context
├── services/       # API вызовы
├── types/          # TypeScript типы
├── utils/          # Утилиты
└── styles/         # Стили
```

**Ссылки:**
- Документация React: https://react.dev
- React Patterns: https://reactpatterns.com
- Epic React: https://epicreact.dev
