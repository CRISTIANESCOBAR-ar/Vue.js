# Script para conectar a Oracle desde PowerShell
# Uso: .\scripts\conectar-oracle.ps1 -Query "SELECT * FROM USTER_PAR WHERE ROWNUM <= 5;"

param(
    [string]$Query = "SELECT table_name, num_rows FROM user_tables ORDER BY table_name;"
)

# Credenciales Oracle
$user = "SYSTEM"
$password = "Alfa1984"
$connection = "192.168.0.131:1521/XE"

Write-Host "`n🔗 Conectando a Oracle..." -ForegroundColor Cyan
Write-Host "   Usuario: $user" -ForegroundColor Gray
Write-Host "   Host: $connection`n" -ForegroundColor Gray

$sqlScript = @"
SET LINESIZE 200
SET PAGESIZE 100
$Query
EXIT;
"@

$sqlScript | sqlplus -S $user/$password@$connection

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Consulta ejecutada correctamente" -ForegroundColor Green
} else {
    Write-Host "`n❌ Error al ejecutar la consulta" -ForegroundColor Red
}
