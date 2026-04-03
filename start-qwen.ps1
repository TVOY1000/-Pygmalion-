# Pygmalion — Быстрый старт для Qwen 3.5+ (CLI агент)
# Использование: .\start-qwen.ps1

param(
    [string]$Task = "help"
)

Write-Host "=== Pygmalion CLI Assistant for Qwen ===" -ForegroundColor Cyan
Write-Host ""

switch ($Task) {
    "help" {
        Write-Host "Доступные задачи:" -ForegroundColor Yellow
        Write-Host "  .\start-qwen.ps1 check     - Проверка среды" -ForegroundColor Gray
        Write-Host "  .\start-qwen.ps1 sandbox   - Запуск песочницы" -ForegroundColor Gray
        Write-Host "  .\start-qwen.ps1 docker    - Запуск Docker (после WSL2)" -ForegroundColor Gray
        Write-Host "  .\start-qwen.ps1 build     - Сборка offline-версии" -ForegroundColor Gray
        Write-Host "  .\start-qwen.ps1 status    - Статус проекта" -ForegroundColor Gray
    }

    "check" {
        Write-Host "Запуск проверки среды..." -ForegroundColor Cyan
        & .\check-env.ps1
    }

    "sandbox" {
        Write-Host "Открытие песочницы v0.3.0..." -ForegroundColor Cyan
        Start-Process "file:///C:/pygmalion/sandbox-v0.3.0/index.html"
        Write-Host "✅ Песочница открыта в браузере" -ForegroundColor Green
    }

    "docker" {
        Write-Host "Проверка Docker..." -ForegroundColor Yellow
        try {
            docker --version | Out-Null
            Write-Host "Docker найден. Запуск сервисов..." -ForegroundColor Green
            Set-Location "C:\pygmalion\docker"
            docker compose up -d
            Write-Host "✅ Сервисы запущены:" -ForegroundColor Green
            docker compose ps
        } catch {
            Write-Host "❌ Docker не найден. Установите WSL2 и Docker Desktop" -ForegroundColor Red
            Write-Host "Команды:" -ForegroundColor Gray
            Write-Host "  wsl --install" -ForegroundColor Gray
            Write-Host "  Перезагрузите компьютер" -ForegroundColor Gray
            Write-Host "  Установите Docker Desktop" -ForegroundColor Gray
        }
    }

    "build" {
        Write-Host "Сборка offline-версии..." -ForegroundColor Cyan
        & .\build-simple.ps1
    }

    "status" {
        Write-Host "`n=== Pygmalion Status ===" -ForegroundColor Cyan
        Write-Host "Проект: Пигмалион / К.Р.И.С.Т.А.Л.Л." -ForegroundColor Yellow
        Write-Host "Версия: v0.3.0 «Песочница»" -ForegroundColor Gray
        Write-Host "Канон: v1.0" -ForegroundColor Gray
        Write-Host ""
        Write-Host "4 Акта Кона:" -ForegroundColor Yellow
        Write-Host "  1. ПЛАН (Эмиссия У.Е.)" -ForegroundColor Gray
        Write-Host "  2. ТОК-ОРАКУЛ-С (ro.DAG передача)" -ForegroundColor Gray
        Write-Host "  3. КОЛ-ЛИЦО-ОБЛИК (Цветок Жизни)" -ForegroundColor Gray
        Write-Host "  4. ВЕС (Репутационная формула)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Формула: (Отдано×2) + (Принято×1) − (Сгорело×1)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Этический стоп-кран: ✅ Активен" -ForegroundColor Green
        Write-Host "  - Нет блокчейна" -ForegroundColor Gray
        Write-Host "  - Нет токенов" -ForegroundColor Gray
        Write-Host "  - Нет накопления" -ForegroundColor Gray
        Write-Host "  - Нет сбора данных" -ForegroundColor Gray
    }

    default {
        Write-Host "Неизвестная задача: $Task" -ForegroundColor Red
        Write-Host "Используйте: .\start-qwen.ps1 help" -ForegroundColor Gray
    }
}
