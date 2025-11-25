# Script para iniciar el backend asegurando que Oracle esté listo
# Uso: .\scripts\start-backend.ps1

Write-Host "`n🔧 Verificando servicios Oracle..." -ForegroundColor Cyan

# Verificar y arrancar servicios Oracle
$listener = Get-Service OracleOraDB21Home1TNSListener
$database = Get-Service OracleServiceXE

if ($listener.Status -ne 'Running') {
    Write-Host "⚡ Iniciando Oracle Listener..." -ForegroundColor Yellow
    Start-Service OracleOraDB21Home1TNSListener
}

if ($database.Status -ne 'Running') {
    Write-Host "⚡ Iniciando Oracle Database..." -ForegroundColor Yellow
    Start-Service OracleServiceXE
}

Write-Host "⏳ Esperando a que Oracle esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar conexión
Write-Host "🔍 Probando conexión a Oracle..." -ForegroundColor Cyan
$env:Path = "C:\Program Files\nodejs;" + $env:Path
Set-Location "C:\carga-datos-vue\server"

$testResult = node -e "const db = require('./db.js'); (async () => { try { await db.initPool(); const conn = await db.getConnection(); await conn.execute('SELECT 1 FROM DUAL'); await conn.close(); await db.closePool(); console.log('OK'); process.exit(0); } catch(err) { console.log('ERROR'); process.exit(1); } })();" 2>&1

if ($testResult -like "*OK*") {
    Write-Host "✅ Oracle está listo`n" -ForegroundColor Green
    Write-Host "🚀 Iniciando backend..." -ForegroundColor Cyan
    npm start
}
else {
    Write-Host "❌ No se pudo conectar a Oracle" -ForegroundColor Red
    Write-Host "Verifica que los servicios estén corriendo:" -ForegroundColor Yellow
    Get-Service | Where-Object { $_.DisplayName -like "*Oracle*" } | Select-Object DisplayName, Status
}
