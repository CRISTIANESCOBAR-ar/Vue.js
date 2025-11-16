# Script para migrar campos OBS de Oracle a Firebase
# Lee correctamente los CLOBs y los sube como strings

Write-Host "🔄 Migrando campos OBS de Oracle a Firebase..." -ForegroundColor Cyan
Write-Host ""

$originalLocation = Get-Location
Set-Location $PSScriptRoot

try {
    # Verificar archivos necesarios
    if (-not (Test-Path "serviceAccountKey.json")) {
        Write-Host "❌ Error: No se encontró serviceAccountKey.json" -ForegroundColor Red
        exit 1
    }

    if (-not (Test-Path "../.env")) {
        Write-Host "❌ Error: No se encontró .env en server/" -ForegroundColor Red
        exit 1
    }

    # Ejecutar migración
    node migrate-obs-from-oracle.js

    Write-Host ""
    Write-Host "✅ Proceso completado" -ForegroundColor Green
}
finally {
    Set-Location $originalLocation
}
