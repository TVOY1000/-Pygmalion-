# Pygmalion — Установка Node.js v20 (канон)
# Использование: .\setup-node20.ps1

Write-Host "=== Pygmalion: Установка Node.js v20 ===" -ForegroundColor Cyan

# Проверка nvm
Write-Host "`nПроверка nvm-windows..." -ForegroundColor Yellow
try {
    $nvmVersion = nvm version 2>&1
    Write-Host "nvm установлен: $nvmVersion" -ForegroundColor Green
} catch {
    Write-Host "nvm не установлен. Установка..." -ForegroundColor Yellow
    winget install CoreyButler.NVM --silent
    Write-Host "nvm установлен. Перезапустите терминал." -ForegroundColor Green
    exit
}

# Установка Node 20
Write-Host "`nУстановка Node.js v20.18.0..." -ForegroundColor Yellow
nvm install 20.18.0

# Активация
Write-Host "Активация Node 20..." -ForegroundColor Yellow
nvm use 20.18.0

# Проверка
Write-Host "`nПроверка..." -ForegroundColor Yellow
node --version
npm --version

Write-Host "`n✅ Node.js v20 готов!" -ForegroundColor Green
Write-Host "Для возврата на v24: nvm use 24.14.0" -ForegroundColor Gray
