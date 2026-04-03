# 📦 Файлы для загрузки в репозиторий Pygmalion v0.3.0

**Репозиторий:** https://github.com/TVOY1000/-Pygmalion-/  
**Версия:** v0.3.0 «Песочница»  
**Canon:** v1.0

---

## ✅ Обязательные файлы (для публикации)

### 1. Песочница v0.3.0
```
sandbox-v0.3.0/
├── index.html          ← Главная страница песочницы
├── style.css           ← Стили интерфейса
└── logic.js            ← Логика 4 актов Кона
```

### 2. Обновлённые i18n файлы
```
assets/i18n/
├── ru.json             ← Обновить (добавлен ключ cta_sandbox_v030)
└── en.json             ← Обновить (добавлен ключ cta_sandbox_v030)
```

### 3. Главный index.html
```
index.html              ← Обновить (добавлена кнопка на песочницу)
```

---

## 📁 Опциональные файлы (инфраструктура)

### Docker окружение
```
docker/
├── docker-compose.yml
├── nginx.conf
├── .env.example
├── README.md
└── init-db/
    └── 001-init-schema.sql
```

### Документация
```
BUILD.md                ← Инструкция по сборке
```

### Offline-версия
```
download/
└── offline-mvp-v0.3.0.zip
```

---

## 🚀 Как загрузить

### Вариант 1: Через GitHub Web Interface
1. Откройте https://github.com/TVOY1000/-Pygmalion-/
2. Нажмите **Add file** → **Upload files**
3. Перетащите файлы из списка выше
4. Нажмите **Commit changes**

### Вариант 2: Через Git (если настроен)
```bash
cd C:\pygmalion

# Добавить файлы
git add sandbox-v0.3.0/
git add assets/i18n/ru.json
git add assets/i18n/en.json
git add index.html
git add docker/
git add BUILD.md
git add download/offline-mvp-v0.3.0.zip

# Коммит
git commit -m "feat: Add Pygmalion Sandbox v0.3.0 with 4 Acts of Kon

- Implemented 4 acts: PLAN, TOK-ORACLE-S, KOL-LITSO-OBlik, WEIGHT
- ro.DAG transaction registry
- 28-hour burn timer for Accounting Units
- Reputation weight formula: (Given×2)+(Received×1)−(Burned×1)
- i18n support (RU/EN)
- Docker Compose for PostgreSQL + Activepieces
- Offline build script

Canon v1.0 · Ethical stop-kran active"

# Отправка
git push origin main
```

---

## 🌐 После публикации

**Песочница будет доступна:**
```
https://tvoy1000.github.io/-Pygmalion-/sandbox-v0.3.0/
```

**Главная страница:**
```
https://tvoy1000.github.io/-Pygmalion-/
```

---

## ✅ Чек-лист публикации

- [ ] Загрузить `sandbox-v0.3.0/` (3 файла)
- [ ] Обновить `assets/i18n/ru.json`
- [ ] Обновить `assets/i18n/en.json`
- [ ] Обновить `index.html`
- [ ] Загрузить `docker/` (опционально)
- [ ] Загрузить `BUILD.md` (опционально)
- [ ] Загрузить `download/offline-mvp-v0.3.0.zip` (опционально)
- [ ] Проверить работу на GitHub Pages
- [ ] Протестировать i18n (RU/EN переключение)
- [ ] Проверить 4 акта Кона

---

**Canon v0.3.0 · Upload Checklist · 2026**
