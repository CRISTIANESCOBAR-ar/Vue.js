# Script para limpiar campos OBS corruptos en Firebase
# Uso: .\clean-obs.ps1

Write-Host "🧹 Limpiando campos OBS corruptos en Firebase..." -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

# Verificar que existe serviceAccountKey.json
if (-not (Test-Path "serviceAccountKey.json")) {
    Write-Host "❌ Error: No se encontró serviceAccountKey.json" -ForegroundColor Red
    Write-Host "   Asegúrate de tener el archivo en server/firebase/" -ForegroundColor Yellow
    exit 1
}

# Ejecutar script de limpieza
node clean-obs-fields.js

Write-Host ""
Write-Host "✅ Proceso completado" -ForegroundColor Green
