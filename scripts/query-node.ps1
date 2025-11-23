# Script para consultar Oracle usando Node.js
# Uso: .\scripts\query-node.ps1 -Query "SELECT * FROM USTER_PAR WHERE ROWNUM <= 5"

param(
    [string]$Query = "SELECT table_name FROM user_tables WHERE table_name LIKE '%USTER%' OR table_name LIKE '%TENSOR%'"
)

Write-Host "`n🔗 Consultando Oracle con Node.js..." -ForegroundColor Cyan
Write-Host "   Query: $Query`n" -ForegroundColor Gray

# Ir a la carpeta del servidor
Set-Location "C:\carga-datos-vue\server"

# Ejecutar query con Node.js
$nodeScript = @"
const db = require('./db.js');
(async () => {
    try {
        await db.initPool();
        const conn = await db.getConnection();
        const result = await conn.execute('$Query');
        
        console.log('\n📊 Resultados:\n');
        console.log(JSON.stringify(result.rows, null, 2));
        console.log('\n✅ Total de filas:', result.rows.length);
        
        await conn.close();
        await db.closePool();
        process.exit(0);
    } catch(err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
})();
"@

node -e $nodeScript

# Volver a la raíz del proyecto
Set-Location "C:\carga-datos-vue"
