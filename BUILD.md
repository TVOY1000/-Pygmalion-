# Pygmalion / C.R.I.S.T.A.L.L. — Build Scripts

**Версия:** v0.3.0 «Песочница»  
**Canon:** v1.0

---

## 📦 Сборка offline-версии

### Быстрая сборка

```powershell
powershell -Command "Compress-Archive -Path 'C:\pygmalion\sandbox-v0.3.0\*' -DestinationPath 'C:\pygmalion\download\offline-mvp-v0.3.0.zip' -Force"
```

### Через скрипт

```powershell
powershell -ExecutionPolicy Bypass -File C:\pygmalion\build-simple.ps1
```

---

## 📁 Структура

```
C:\pygmalion\
├── sandbox-v0.3.0/       # Исходный код песочницы
├── download/             # Готовые дистрибутивы
│   ├── offline-mvp-v0.3.0.zip
│   └── sandbox-v0.3.0/   # Копия для тестирования
├── docker/               # Docker окружение
│   ├── docker-compose.yml
│   ├── nginx.conf
│   ├── .env.example
│   └── init-db/
│       └── 001-init-schema.sql
└── build-*.ps1           # Скрипты сборки
```

---

## 🚀 Публикация

1. **GitHub Pages:**
   - Запушить изменения в репозиторий
   - Песочница доступна: `https://username.github.io/-Pygmalion-/sandbox-v0.3.0/`

2. **Offline-версия:**
   - Файл: `download/offline-mvp-v0.3.0.zip`
   - Загрузить в раздел Releases или на сайт

---

## 🛠️ Docker (после установки WSL2)

```bash
cd C:\pygmalion\docker
cp .env.example .env
docker compose up -d
```

---

**Canon v0.3.0 · Build · 2026**
