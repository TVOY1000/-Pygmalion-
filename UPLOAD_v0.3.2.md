# 🚀 Загрузка Pygmalion v0.3.2 Canonical в репозиторий

**Версия:** v0.3.2 Canonical Edition  
**Canon:** v1.0  
**Репозиторий:** https://github.com/TVOY1000/-Pygmalion-/

---

## ✅ Исправления согласно аудиту Хранителя

| Компонент | Исправление |
|-----------|-------------|
| **О.К.** | 3-50 символов (было 70) |
| **ЧисСлоБукВ** | 48 букв (11 общих + 15 EN + 22 RU) + 10 цифр |
| **Регистр** | Только заглавные буквы |
| **Эмиссия триад** | Свободный выбор (не линейно) |
| **У.Е. №21** | Только после ≥1 триады |
| **Таймер** | Привязка к 19:56, мин. 4 часа |

---

## 📁 Файлы для загрузки

### 1. Песочница v0.3.2 (ОБЯЗАТЕЛЬНО)

```
sandbox-v0.3.2/
├── index.html          ← Главная страница
├── App.jsx             ← Исправленный код React
├── style.css           ← Стили Tailwind
└── README.md           ← Документация
```

**Где:** `C:\pygmalion\sandbox-v0.3.2\`

### 2. Обновлённые i18n (ОБЯЗАТЕЛЬНО)

```
assets/i18n/
├── ru.json             ← Добавить ключи v0.3.2
└── en.json             ← Добавить ключи v0.3.2
```

### 3. Обновление главного index.html

Добавить кнопку на v0.3.2:
```html
<a href="/-Pygmalion-/sandbox-v0.3.2/" class="btn btn-primary">
  🚀 Песочница v0.3.2 Canonical
</a>
```

### 4. Документация (ОПЦИОНАЛЬНО)

```
gemini-code/
├── Pygmalion_v0.3.2_Canonical.jsx  ← Исходный код
├── FIXES_FOR_GEMINI.md             ← Список исправлений
└── README.md                       ← Документация
```

---

## 📝 Инструкция по загрузке (GitHub Web)

### Шаг 1: Создать папку sandbox-v0.3.2

1. Откройте https://github.com/TVOY1000/-Pygmalion-/
2. Нажмите **Add file** → **Create new file**
3. Введите имя: `sandbox-v0.3.2/index.html`
4. Вставьте содержимое файла
5. Нажмите **Commit changes**

Повторите для каждого файла:
- `sandbox-v0.3.2/App.jsx`
- `sandbox-v0.3.2/style.css`
- `sandbox-v0.3.2/README.md`

### Шаг 2: Обновить i18n

1. Откройте `assets/i18n/ru.json`
2. Добавьте ключи для v0.3.2
3. **Commit changes**

### Шаг 3: Обновить index.html

1. Откройте `index.html` в корне
2. Добавьте кнопку на v0.3.2
3. **Commit changes**

---

## 🔧 Команды для Git (если настроен)

```bash
cd C:\pygmalion

# Создать папку
mkdir sandbox-v0.3.2

# Копировать файлы
copy gemini-code\Pygmalion_v0.3.2_Canonical.jsx sandbox-v0.3.2\App.jsx
# ... остальные файлы

# Добавить в git
git add sandbox-v0.3.2/
git add assets/i18n/ru.json
git add assets/i18n/en.json
git add index.html

# Коммит
git commit -m "feat: Pygmalion v0.3.2 Canonical Edition

Исправления согласно аудиту Хранителя:
- О.К.: 3-50 символов (было 70)
- ЧисСлоБукВ: 48 букв + 10 цифр
- Свободный выбор триад (не линейно)
- У.Е. №21: только после ≥1 триады
- Таймер: привязка к 19:56, мин. 4 часа

Canon v1.0 · Ethical stop-kran active"

# Отправка
git push origin main
```

---

## 🌐 После публикации

**Песочница доступна:**
```
https://tvoy1000.github.io/-Pygmalion-/sandbox-v0.3.2/
```

**Проверка:**
- [ ] Порог: 3-50 символов
- [ ] ЧисСлоБукВ: 48 букв + 10 цифр
- [ ] Свободный выбор триад
- [ ] У.Е. №21 блокируется без триад
- [ ] Таймер: отсчёт до 19:56

---

## 📄 Коммит-сообщение (шаблон)

```
feat: Pygmalion Sandbox v0.3.2 Canonical

Corrections per Canon audit:
- O.K. length: 3-50 chars (was 70)
- ChisSloBukV: 48 letters + 10 digits
- Free triad selection (not linear)
- U.E. #21: only after ≥1 triad
- Burn timer: 19:56 reference, min 4 hours

Canon v1.0 · Ethical compliance verified
```

---

**Canon v0.3.2 · Upload Ready · 2026**
