# Pygmalion v0.3.0 - Build Offline Mirror
# Canon v1.0
#
# Usage: powershell -ExecutionPolicy Bypass -File build-offline.ps1

$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\pygmalion"
$SandboxSource = "$ProjectRoot\sandbox-v0.3.0"
$DownloadDir = "$ProjectRoot\download"
$OutputZip = "$DownloadDir\offline-mvp-v0.3.0.zip"
$BuildTemp = "$ProjectRoot\build-temp"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Pygmalion v0.3.0 - Building Offline" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (-not (Test-Path $SandboxSource)) {
    Write-Host "ERROR: Source not found: $SandboxSource" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $DownloadDir)) {
    New-Item -ItemType Directory -Path $DownloadDir | Out-Null
}

if (Test-Path $BuildTemp) {
    Remove-Item -Path $BuildTemp -Recurse -Force
}

New-Item -ItemType Directory -Path $BuildTemp | Out-Null

Write-Host "Copying sandbox files..." -ForegroundColor Yellow
Copy-Item -Path "$SandboxSource\*" -Destination $BuildTemp -Recurse

$AssetsTemp = "$BuildTemp\_assets"
New-Item -ItemType Directory -Path $AssetsTemp | Out-Null

Copy-Item -Path "$ProjectRoot\assets\i18n" -Destination $AssetsTemp -Recurse
Copy-Item -Path "$ProjectRoot\assets\js\lang.js" -Destination "$AssetsTemp\js\" -Force
Copy-Item -Path "$ProjectRoot\assets\css\global.css" -Destination "$AssetsTemp\css\" -Force
Copy-Item -Path "$ProjectRoot\favicon.ico" -Destination $BuildTemp -Force

Write-Host "Updating paths for offline..." -ForegroundColor Yellow
$HtmlContent = Get-Content "$BuildTemp\index.html" -Raw
$HtmlContent = $HtmlContent -replace '\.\./assets/', '_assets/'
$HtmlContent = $HtmlContent -replace '\.\./favicon\.ico', 'favicon.ico'
$HtmlContent | Out-File -FilePath "$BuildTemp\index.html" -Encoding UTF8

if (Test-Path $AssetsTemp) {
    Remove-Item -Path $AssetsTemp -Recurse -Force
}

Write-Host "Creating ZIP archive..." -ForegroundColor Yellow

if (Test-Path $OutputZip) {
    Remove-Item -Path $OutputZip -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($BuildTemp, $OutputZip)

Remove-Item -Path $BuildTemp -Recurse -Force

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "SUCCESS: Build completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Output: $OutputZip" -ForegroundColor Cyan
$Size = [math]::Round((Get-Item $OutputZip).Length / 1KB, 2)
Write-Host "Size: $Size KB" -ForegroundColor Cyan
