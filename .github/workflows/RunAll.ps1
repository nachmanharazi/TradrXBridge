# Set encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "🚀 הפעלת תהליך כולל..." -ForegroundColor Cyan

# Check Docker
if (Get-Command docker -ErrorAction SilentlyContinue) {
    $dockerVersion = docker --version
    Write-Host "✅ Docker מותקן: $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Docker לא מותקן. אנא התקן אותו קודם." -ForegroundColor Red
}

# Run batch file
Write-Host "🧪 מריץ direct-test.bat..." -ForegroundColor Yellow
Start-Process ".\ps1\direct-test.bat" -Wait

# Run JavaScript files
Write-Host "⚙️ מריץ chat.js..." -ForegroundColor Yellow
node .\chat.js

Write-Host "⚙️ מריץ connect.js..." -ForegroundColor Yellow
node .\connect.js

# End
Write-Host "`n🎯 כל התהליכים הסתיימו" -ForegroundColor Cyan
pause
