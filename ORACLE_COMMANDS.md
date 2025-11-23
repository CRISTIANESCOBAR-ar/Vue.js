# Guía Rápida - Carga de Datos Vue

## 🚀 LEVANTAR SERVIDORES (INICIO RÁPIDO)

### ⭐ Opción Recomendada: Script automático

**Terminal 1 - Backend con verificación de Oracle:**
```powershell
.\scripts\start-backend.ps1
```
Este script:
- ✅ Verifica que los servicios Oracle estén corriendo
- ✅ Los inicia si están detenidos
- ✅ Espera a que Oracle esté listo
- ✅ Inicia el backend

**Terminal 2 - Frontend:**
```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
cd C:\carga-datos-vue
npm run dev
```

---

### Opción 1: Dos terminales separadas (manual)

**Terminal 1 - Backend (Puerto 3001):**
```powershell
# Recargar PATH y ejecutar backend
$env:Path = "C:\Program Files\nodejs;" + $env:Path
cd C:\carga-datos-vue\server
npm start
```

**Terminal 2 - Frontend (Puerto 5173/5174):**
```powershell
# Recargar PATH y ejecutar frontend
$env:Path = "C:\Program Files\nodejs;" + $env:Path
cd C:\carga-datos-vue
npm run dev
```

### Opción 2: Un solo comando (Backend y Frontend juntos)

```powershell
# Iniciar backend en segundo plano
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = 'C:\Program Files\nodejs;' + `$env:Path; cd C:\carga-datos-vue\server; npm start"

# Iniciar frontend en la terminal actual
$env:Path = "C:\Program Files\nodejs;" + $env:Path
cd C:\carga-datos-vue
npm run dev
```

### ✅ Verificar que está funcionando

Una vez levantados los servidores, abre tu navegador:

- **Frontend (Aplicación):** http://localhost:5173 o http://localhost:5174
- **Backend API (Health Check):** http://localhost:3001/api/health

Deberías ver:
- Frontend: La aplicación Vue.js cargada
- Backend: Mensaje JSON con status "ok"

---

## 📊 CARGAR DATOS

1. Abre el navegador en http://localhost:5173
2. Ve a la sección de **Uster** o **TensorRapid**
3. Selecciona los archivos `.PAR` y `.TBL` correspondientes
4. Haz clic en **"Cargar"** o **"Upload"**
5. Los datos se guardarán automáticamente en Oracle

---

## 🔍 CONSULTAR DATOS

### Desde la aplicación web:
1. Ve a **"Lista de Registros"** o **"Registros"**
2. Usa los filtros de búsqueda (por lote, fecha, testnr, etc.)
3. Visualiza los datos en tablas o gráficos

### Desde PowerShell (Consultas rápidas):

**Ver total de registros:**
```powershell
cd C:\carga-datos-vue\server
node -e "const db = require('./db.js'); (async () => { await db.initPool(); const conn = await db.getConnection(); const result = await conn.execute('SELECT COUNT(*) FROM USTER_PAR'); console.log('USTER_PAR:', result.rows[0][0], 'registros'); await conn.close(); await db.closePool(); })();"
```

**Ver últimos registros:**
```powershell
cd C:\carga-datos-vue\server
node -e "const db = require('./db.js'); (async () => { await db.initPool(); const conn = await db.getConnection(); const result = await conn.execute('SELECT TESTNR, LOTE, TIME_STAMP FROM USTER_PAR ORDER BY CREATED_AT DESC FETCH FIRST 5 ROWS ONLY'); console.log(JSON.stringify(result.rows, null, 2)); await conn.close(); await db.closePool(); })();"
```

---

## 📋 Credenciales de Conexión Oracle

```
Usuario:     SYSTEM
Password:    Alfa1984
Host:        192.168.0.131
Puerto:      1521
Service:     XE
```

## 🔧 Conexión desde PowerShell

### Método 1: SQL*Plus directo
```powershell
# Copiar y pegar en PowerShell:
sqlplus SYSTEM/Alfa1984@192.168.0.131:1521/XE
```

### Método 2: Consulta rápida
```powershell
# Ver todas las tablas
echo "SELECT table_name, num_rows FROM user_tables ORDER BY table_name; EXIT;" | sqlplus -S SYSTEM/Alfa1984@192.168.0.131:1521/XE

# Contar registros de USTER_PAR
echo "SELECT COUNT(*) as total FROM USTER_PAR; EXIT;" | sqlplus -S SYSTEM/Alfa1984@192.168.0.131:1521/XE

# Ver últimos 5 registros de USTER_PAR
echo "SELECT TESTNR, LOTE, TIME_STAMP FROM USTER_PAR WHERE ROWNUM <= 5; EXIT;" | sqlplus -S SYSTEM/Alfa1984@192.168.0.131:1521/XE
```

### Método 3: Scripts del proyecto
```powershell
# Usando SQL*Plus
.\scripts\conectar-oracle.ps1 -Query "SELECT COUNT(*) FROM USTER_PAR;"

# Usando Node.js
.\scripts\query-node.ps1 -Query "SELECT * FROM USTER_PAR WHERE ROWNUM <= 5"
```

## 🗂️ Consultas Node.js desde server/

```powershell
# Ir a la carpeta server
cd C:\carga-datos-vue\server

# Consulta simple
node -e "const db = require('./db.js'); (async () => { await db.initPool(); const conn = await db.getConnection(); const result = await conn.execute('SELECT COUNT(*) FROM USTER_PAR'); console.log('Total:', result.rows[0][0]); await conn.close(); await db.closePool(); })();"

# Ver tablas
node -e "const db = require('./db.js'); (async () => { await db.initPool(); const conn = await db.getConnection(); const result = await conn.execute('SELECT table_name FROM user_tables'); console.log(result.rows); await conn.close(); await db.closePool(); })();"

# Consulta con resultados formateados
node -e "const db = require('./db.js'); (async () => { await db.initPool(); const conn = await db.getConnection(); const result = await conn.execute('SELECT TESTNR, LOTE FROM USTER_PAR WHERE ROWNUM <= 5'); console.log(JSON.stringify(result.rows, null, 2)); await conn.close(); await db.closePool(); })();"
```

## 📊 Consultas SQL Útiles

### Ver estructura de tablas
```sql
DESC USTER_PAR;
DESC USTER_TBL;
DESC TENSORAPID_PAR;
DESC TENSORAPID_TBL;
```

### Conteo de registros
```sql
SELECT 'USTER_PAR' as tabla, COUNT(*) as registros FROM USTER_PAR
UNION ALL
SELECT 'USTER_TBL', COUNT(*) FROM USTER_TBL
UNION ALL
SELECT 'TENSORAPID_PAR', COUNT(*) FROM TENSORAPID_PAR
UNION ALL
SELECT 'TENSORAPID_TBL', COUNT(*) FROM TENSORAPID_TBL;
```

### Ver columnas de una tabla
```sql
SELECT column_name, data_type, data_length 
FROM user_tab_columns 
WHERE table_name = 'USTER_PAR' 
ORDER BY column_id;
```

### Últimos registros insertados
```sql
SELECT * FROM USTER_PAR 
WHERE CREATED_AT IS NOT NULL 
ORDER BY CREATED_AT DESC 
FETCH FIRST 10 ROWS ONLY;
```

## 🔌 Configuración en SQL Developer

```
Name:                SYSTEM_XE
Usuario:             SYSTEM
Contraseña:          Alfa1984
☑ Guardar contraseña

Tipo de conexión:    Básico
Nombre de host:      192.168.0.131
Puerto:              1521
SID:                 XE
```

## ⚠️ Solución de Problemas

### Si npm no se reconoce:
```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
```

### Si el puerto 5173 está ocupado:
Vite automáticamente usará 5174 o el siguiente disponible.

### Si Oracle no conecta:
```powershell
# Verificar servicios Oracle
Get-Service | Where-Object {$_.DisplayName -like "*Oracle*"}

# Iniciar listener si está detenido
Start-Service OracleOraDB21Home1TNSListener

# Probar conexión
sqlplus SYSTEM/Alfa1984@192.168.0.131:1521/XE
```

### Si el backend no inicia:
```powershell
# Verificar que las dependencias estén instaladas
cd C:\carga-datos-vue\server
npm install

# Verificar la configuración .env
cat .env
```
