# Pygmalion v0.3.0 - Simple Offline Build
# Usage: powershell -ExecutionPolicy Bypass -File build-simple.ps1

$ProjectRoot = "C:\pygmalion"
$DownloadDir = "$ProjectRoot\download"
$OutputZip = "$DownloadDir\offline-mvp-v0.3.0.zip"

Write-Host "Creating offline package..." -ForegroundColor Cyan

# Create download folder if needed
if (-not (Test-Path $DownloadDir)) {
    New-Item -ItemType Directory -Path $DownloadDir -Force | Out-Null
}

# Copy sandbox to download folder
$SandboxDest = "$DownloadDir\sandbox-v0.3.0"
if (Test-Path $SandboxDest) {
    Remove-Item -Path $SandboxDest -Recurse -Force
}
Copy-Item -Path "$ProjectRoot\sandbox-v0.3.0" -Destination $DownloadDir -Recurse

# Create zip using shell application
$Shell = New-Object -ComObject Shell.Application
$Zip = $Shell.NameSpace($OutputZip)

# Clear existing zip content
if (Test-Path $OutputZip) {
    Remove-Item -Path $OutputZip -Force
}
# Create empty zip
"" | Out-File -FilePath $OutputZip -Encoding ASCII

$Zip = $Shell.NameSpace($OutputZip)
foreach ($item in (Get-ChildItem $SandboxDest)) {
    $Zip.CopyFrom($item.FullName, $item.Name)
}

Write-Host "Done: $OutputZip" -ForegroundColor Green
$Size = [math]::Round((Get-Item $OutputZip).Length / 1KB, 2)
Write-Host "Size: $Size KB" -ForegroundColor Cyan
