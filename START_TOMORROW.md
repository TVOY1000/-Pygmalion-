# 🚀 Pygmalion — Быстрый старт

**Версия:** v0.3.2 Canonical  
**Дата:** 12 марта 2026  
**Статус:** Готово к развёртыванию

---

## 📋 Что уже сделано

✅ **Песочница v0.3.2** — исправлена согласно канону  
✅ **Docker инфраструктура** — 10 сервисов для 1000 O.K. × 20 000 транзакций  
✅ **Мониторинг** — Prometheus + Grafana  
✅ **Документация** — полная

---

## ⏳ Следующие шаги (приоритеты)

### 1. WSL2 (критично)
```powershell
# От имени администратора
wsl --install
```
→ **Перезагрузка компьютера**

### 2. Запуск Docker
```bash
cd C:\pygmalion\docker
cp .env.production.example .env
docker compose -f docker-compose.prod.yml up -d
```

### 3. Проверка
```bash
docker compose -f docker-compose.prod.yml ps
```

**Сервисы доступны:**
- Grafana: http://localhost:3000
- Activepieces: http://localhost:8080
- NiFi: http://localhost:8090/nifi
- Песочница: http://localhost/sandbox

---

## 📁 Главные файлы

| Файл | Назначение |
|------|------------|
| `docker/docker-compose.prod.yml` | Запуск инфраструктуры |
| `docker/SCALE_PLAN.md` | Полная документация |
| `gemini-code/Pygmalion_v0.3.2_Canonical.jsx` | Код песочницы |
| `UPLOAD_v0.3.2.md` | Загрузка в GitHub |

---

## 🎯 План на завтра

1. WSL2 → 5 мин
2. Docker Compose → 10 мин
3. Activepieces flows → 30 мин
4. NiFi процессоры → 30 мин
5. GitHub → 15 мин

**Итого:** ~1.5 часа

---

## 💡 Для продолжения

**Просто напишите:**
- "Продолжаем" — вспомню контекст
- "Запускаем Docker" — помогу с командами
- "Настраиваем flows" — помогу с Activepieces

---

**Canon v0.3.2 · Ready · 2026**
