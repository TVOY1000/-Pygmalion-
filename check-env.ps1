# Pygmalion — Скрипт проверки среды
# Использование: .\check-env.ps1

Write-Host "=== Pygmalion Environment Check ===" -ForegroundColor Cyan
Write-Host ""

# Node.js
Write-Host "Node.js:" -ForegroundColor Yellow
try {
    $node = node --version 2>&1
    Write-Host "  ✅ $node" -ForegroundColor Green
    if ($node -match "v24") {
        Write-Host "  ⚠️  Требуется Node v20.x (канон)" -ForegroundColor Red
        Write-Host "  Решение: nvm install 20 && nvm use 20" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ❌ Не установлен" -ForegroundColor Red
    Write-Host "  Решение: winget install OpenJS.NodeJS.LTS" -ForegroundColor Gray
}

# Git
Write-Host "`nGit:" -ForegroundColor Yellow
try {
    $git = git --version 2>&1
    Write-Host "  ✅ $git" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Не установлен" -ForegroundColor Red
}

# Docker
Write-Host "`nDocker:" -ForegroundColor Yellow
try {
    $docker = docker --version 2>&1
    Write-Host "  ✅ $docker" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Не в PATH или не установлен" -ForegroundColor Red
    Write-Host "  Решение: Переустановить Docker Desktop" -ForegroundColor Gray
}

# WSL2
Write-Host "`nWSL2:" -ForegroundColor Yellow
try {
    $wsl = wsl --list 2>&1
    if ($wsl -match "Нет установленных") {
        Write-Host "  ❌ Не установлен" -ForegroundColor Red
        Write-Host "  Решение: wsl --install (требует перезагрузки)" -ForegroundColor Gray
    } else {
        Write-Host "  ✅ Установлен" -ForegroundColor Green
        Write-Host "  $wsl" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ❌ Ошибка проверки" -ForegroundColor Red
}

# Windows Version
Write-Host "`nWindows:" -ForegroundColor Yellow
$winInfo = Get-ComputerInfo | Select-Object WindowsVersion, WindowsBuildLabEx
Write-Host "  Версия: $($winInfo.WindowsVersion)" -ForegroundColor Gray
Write-Host "  Сборка: $($winInfo.WindowsBuildLabEx)" -ForegroundColor Gray
if ([int]$winInfo.WindowsVersion -lt 2009 -or [int]$winInfo.WindowsBuildLabEx.Split('.')[0] -lt 19044) {
    Write-Host "  ⚠️  Требуется обновление до 19044+" -ForegroundColor Red
}

# Sandbox
Write-Host "`nSandbox v0.3.0:" -ForegroundColor Yellow
if (Test-Path "C:\pygmalion\sandbox-v0.3.0\index.html") {
    Write-Host "  ✅ Готова к запуску" -ForegroundColor Green
    Write-Host "  Открыть: file:///C:/pygmalion/sandbox-v0.3.0/index.html" -ForegroundColor Gray
} else {
    Write-Host "  ❌ Файлы не найдены" -ForegroundColor Red
}

Write-Host "`n=== Check Complete ===" -ForegroundColor Cyan
