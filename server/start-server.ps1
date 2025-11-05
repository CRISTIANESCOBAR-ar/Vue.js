Set-Location C:\carga-datos-vue\server
$env:ORACLE_USER = 'SYSTEM'
$env:ORACLE_PASSWORD = 'Alfa1984'
$env:ORACLE_CONNECTIONSTRING = 'localhost:1521/XE'
$env:PORT = '3001'
node .\index.js
