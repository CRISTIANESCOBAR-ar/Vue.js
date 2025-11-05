# Configuración de TensoRapid

## Base de datos Oracle

### Prerrequisitos

- Acceso a una base de datos Oracle
- Permisos para crear tablas y relaciones (FOREIGN KEY)
- Las tablas USTER_PAR y USTER_TBL deben existir previamente

### Crear tablas

Ejecutar el script `server/create_tensorapid_tables.sql` en la base de datos Oracle:

```sql
sqlplus usuario/contraseña@BD @server/create_tensorapid_tables.sql
```

O bien, copiar y pegar el contenido del archivo en SQL Developer, SQL\*Plus, o cualquier cliente Oracle.

### Estructura de tablas

#### TENSORAPID_PAR

Almacena los parámetros de cada ensayo TensoRapid:

- **TESTNR**: Número de ensayo TensoRapid (Primary Key)
- **USTER_TESTNR**: Referencia al ensayo USTER correspondiente (Foreign Key)
- 34 campos adicionales con datos técnicos del ensayo

#### TENSORAPID_TBL

Almacena las mediciones individuales de cada ensayo:

- **TESTNR**: Número de ensayo (Foreign Key a TENSORAPID_PAR)
- **NO\_**: Número de medición secuencial
- **TIEMPO_ROTURA**: Tiempo hasta la rotura
- **FUERZA_B**: Fuerza medida
- **ELONGACION**: Elongación del material
- **TENACIDAD**: Tenacidad calculada
- **TRABAJO**: Trabajo realizado

### Relaciones

- `TENSORAPID_PAR.USTER_TESTNR` → `USTER_PAR.TESTNR`
- `TENSORAPID_TBL.TESTNR` → `TENSORAPID_PAR.TESTNR` (ON DELETE CASCADE)

## Uso de la aplicación

### 1. Seleccionar carpeta TensoRapid

- Hacer clic en "Seleccionar carpeta TensoRapid"
- La carpeta debe contener archivos con formato:
  - `.PAR`: Parámetros del ensayo
  - `.TBL`: Datos tabulados de mediciones
- Los archivos deben tener el número de ensayo en las posiciones 7-12 del nombre

### 2. Escaneo automático

- La aplicación escanea la carpeta y muestra:
  - Número de ensayo
  - Si existe archivo .PAR
  - Si existe archivo .TBL
  - Estado (guardado o no guardado)
  - Ne (título nominal)
  - Máquina

### 3. Vincular con USTER

- Para cada ensayo TensoRapid, ingresar el número de ensayo USTER correspondiente
- Este vínculo es obligatorio antes de guardar

### 4. Guardar en Oracle

- Hacer clic en el botón "Guardar" de cada fila
- La aplicación:
  1. Carga los archivos .PAR y .TBL
  2. Parsea los datos según el formato TensoRapid
  3. Agrega el vínculo al ensayo USTER
  4. Envía al backend para guardar en Oracle
  5. Marca el ensayo como guardado (✓)

### 5. Indicadores visuales

- **Icono verde (✓)**: Ensayo ya guardado en la base de datos
- **Botón "Guardar" habilitado**: Listo para guardar (tiene número USTER)
- **Botón deshabilitado**: Falta ingresar número USTER

## Backend

### Endpoints creados

#### POST /api/tensorapid/upload

Guarda un ensayo TensoRapid completo (PAR + TBL)

**Request:**

```json
{
  "par": {
    "TESTNR": "001234",
    "USTER_TESTNR": "005678",
    "CATALOG": "...",
    ...
  },
  "tbl": [
    {
      "TESTNR": "001234",
      "NO": 1,
      "TIEMPO_ROTURA": 1.23,
      "FUERZA_B": 2.34,
      "ELONGACION": 3.45,
      "TENACIDAD": 4.56,
      "TRABAJO": 5.67
    },
    ...
  ]
}
```

**Response:**

```json
{
  "success": true,
  "inserted": 50
}
```

#### POST /api/tensorapid/status

Verifica qué ensayos ya están guardados en la base de datos

**Request:**

```json
{
  "testnrs": ["001234", "001235", "001236"]
}
```

**Response:**

```json
{
  "existing": ["001234", "001236"]
}
```

## Notas técnicas

### Formato de archivos PAR

Los archivos .PAR son TSV (Tab-Separated Values) con 36 campos específicos en posiciones fijas:

- Fila 3, Columna 1: CATALOG
- Fila 8, Columna 5: TESTNR
- Fila 14, Columna 5: TITULO (Ne)
- Fila 12, Columna 5: MAQUINA
- ... (ver `tensoParFields` en TensoRapid.vue para la lista completa)

### Formato de archivos TBL

Los archivos .TBL contienen datos tabulados con:

- Columna 0: TESTNR
- Columna 1: NO (número de medición)
- Columnas 2-6: Datos de medición (TIEMPO_ROTURA, FUERZA_B, ELONGACION, TENACIDAD, TRABAJO)

### File System Access API

La aplicación usa la File System Access API para:

- Selección persistente de carpetas
- Lectura de archivos sin necesidad de subirlos
- Actualización en vivo de archivos .TBL

### Transacciones

Todas las operaciones de guardado usan transacciones Oracle:

- MERGE en TENSORAPID_PAR (upsert)
- DELETE + INSERT en TENSORAPID_TBL
- COMMIT al finalizar exitosamente
- ROLLBACK en caso de error
