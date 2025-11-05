# ✅ Tabla TENSORAPID_PAR Recreada - Resumen de Cambios

## Estado Completado

### 1. ✅ Tabla Eliminada y Recreada

- **Script**: `server/recreate_tensorapid_clean.js`
- **Ejecutado**: ✅ Exitosamente
- **Resultado**:
  - Tabla anterior eliminada
  - FK `FK_TENSORAPID_TBL_PAR` eliminada y recreada
  - Nueva tabla con 36 columnas exactas del archivo .PAR
  - Índice `IDX_TENSORAPID_PAR_USTER` creado

### 2. ✅ Esquema de la Tabla

```sql
CREATE TABLE TENSORAPID_PAR (
  TESTNR VARCHAR2(50) PRIMARY KEY,
  USTER_TESTNR VARCHAR2(50),  -- FK a USTER_PAR(TESTNR)

  -- Columnas exactas del archivo .PAR:
  CATALOG VARCHAR2(200),
  TIME VARCHAR2(100),
  SORTIMENT VARCHAR2(200),
  ARTICLE VARCHAR2(200),
  MASCHNR VARCHAR2(100),
  MATCLASS VARCHAR2(100),
  NOMCOUNT NUMBER,
  NOMTWIST NUMBER,
  USCODE VARCHAR2(100),
  LABORANT VARCHAR2(200),
  "COMMENT" VARCHAR2(500),  -- Quoted identifier (palabra reservada)
  LOTE VARCHAR2(200),
  TUNAME VARCHAR2(200),
  GROUPS NUMBER,
  WITHIN NUMBER,
  TOTAL NUMBER,
  UNSPOOLGROUPS NUMBER,
  LENGTH NUMBER,
  EXTSPEED NUMBER,
  PRETENSION NUMBER,
  CLAMPPRESSURE NUMBER,
  CYCLEFORCELL NUMBER,
  CYCLEFORCEUL NUMBER,
  NMBOFFORCECYCLES NUMBER,
  CYCLELONGLL NUMBER,
  CYCLELONGUL NUMBER,
  NMBOFELONGCYCLES NUMBER,
  FORCEF1REL NUMBER,
  ELONGATIONE1REL NUMBER,
  EVALTIMEREL NUMBER,
  PRELOADCYCLESREL NUMBER,
  FORCEF1RET NUMBER,
  ELONGATIONE1RET NUMBER,
  EVALTIMERET NUMBER,
  PRELOADCYCLESRET NUMBER
)
```

### 3. ✅ Backend Actualizado (`server/index.js`)

**Endpoint**: `POST /api/tensorapid/upload`

**Cambios aplicados**:

- ✅ SQL MERGE simplificado (solo columnas .PAR, sin aliases)
- ✅ `parBinds` mapeado 1:1 con campos .PAR
- ✅ Eliminadas columnas de compatibilidad innecesarias
- ✅ Logs añadidos para diagnóstico:
  - Payload summary (keys, snippet JSON)
  - TESTNR y USTER_TESTNR recibidos

**Ejemplo de binds**:

```javascript
parBinds = {
  TESTNR: par.TESTNR,
  USTER_TESTNR: par.USTER_TESTNR,
  CATALOG: par.CATALOG || null,
  TIME: par.TIME || null
  // ... resto de campos mapeados directamente
}
```

### 4. ✅ Frontend Ya Compatible (`src/components/TensoRapid.vue`)

El frontend ya está preparado para enviar los datos correctos:

**Mapeo de .PAR**:

```javascript
const tensoParFields = [
  { field: 'CATALOG', row: 3, col: 1 },
  { field: 'TESTNR', row: 8, col: 5 },
  { field: 'TIME', row: 9, col: 5 },
  { field: 'SORTIMENT', row: 10, col: 5 },
  { field: 'ARTICLE', row: 11, col: 5 },
  { field: 'MASCHNR', row: 12, col: 5 },
  { field: 'MATCLASS', row: 13, col: 8 },
  { field: 'NOMCOUNT', row: 14, col: 5 },
  { field: 'NOMTWIST', row: 15, col: 5 },
  { field: 'USCODE', row: 17, col: 8 },
  { field: 'LABORANT', row: 18, col: 5 },
  { field: 'COMMENT', row: 19, col: 5 },
  { field: 'LOTE', row: 20, col: 5 }
  // ... resto de campos (36 total)
]
```

**Función `saveToOracle`**:

- ✅ Lee archivos .PAR y .TBL
- ✅ Parsea con `parseParText()`
- ✅ Añade `USTER_TESTNR` al payload
- ✅ Envía a `/api/tensorapid/upload`
- ✅ Logs añadidos para diagnóstico

## Siguiente Paso: Probar desde la UI

### Cómo probar:

1. **Asegúrate que el servidor esté corriendo**:

   ```powershell
   node server/index.js
   ```

2. **Abre la aplicación Vue** (si no está corriendo):

   ```powershell
   npm run dev
   ```

3. **En la UI de TensoRapid**:
   - Selecciona carpeta con archivos .PAR/.TBL
   - Asigna USTER_TESTNR a un ensayo
   - Haz clic en **Guardar**
   - Observa la consola del navegador para los logs:
     ```
     Saving to backend. payload summary: { TESTNR: '...', USTER_TESTNR: '...', parKeys: [...], ... }
     Server response for saveToOracle: { ok: true, status: 200, body: {...} }
     ```

4. **En la consola del servidor** verás:
   ```
   POST /api/tensorapid/upload received - TESTNR: ... USTER_TESTNR: ...
   POST /api/tensorapid/upload payload summary: { parKeys: [...], parSnippet: '...', tblLength: ... }
   Executing TENSORAPID MERGE SQL for TESTNR: ...
   ```

### Si hay errores:

**Error ORA-00904** (columna no existe):

- El SQL MERGE ya está corregido para usar solo las 36 columnas exactas

**Error ORA-01400** (no puede insertar NULL):

- Verifica que `USTER_TESTNR` esté asignado en la UI
- Verifica que ese TESTNR exista en `USTER_PAR`

**Error ORA-02291** (FK violation):

- El `USTER_TESTNR` debe existir previamente en `USTER_PAR.TESTNR`
- Primero graba ensayos USTER, luego los TensoRapid

## Archivos Modificados

| Archivo                               | Estado          | Descripción                            |
| ------------------------------------- | --------------- | -------------------------------------- |
| `server/recreate_tensorapid_clean.js` | ✅ Creado       | Script para drop+create tabla          |
| `server/index.js`                     | ✅ Actualizado  | MERGE simplificado, solo columnas .PAR |
| `src/components/TensoRapid.vue`       | ✅ Ya estaba OK | Logs añadidos para diagnóstico         |
| `server/test_tensorapid_upload.js`    | ✅ Creado       | Script de prueba (opcional)            |

## Verificación Manual

Si quieres verificar la estructura de la tabla:

```sql
-- Ver columnas de la tabla
SELECT column_name, data_type, data_length
FROM user_tab_columns
WHERE table_name = 'TENSORAPID_PAR'
ORDER BY column_id;

-- Ver constraints
SELECT constraint_name, constraint_type, search_condition
FROM user_constraints
WHERE table_name = 'TENSORAPID_PAR';

-- Ver FK
SELECT constraint_name, r_constraint_name
FROM user_constraints
WHERE table_name = 'TENSORAPID_PAR'
AND constraint_type = 'R';
```

## ✅ TODO Completado

- [x] Eliminar tabla TENSORAPID_PAR anterior
- [x] Crear nueva tabla con 36 columnas exactas del .PAR
- [x] Actualizar backend para usar solo estas columnas
- [x] Simplificar mapeo (frontend ya estaba correcto)
- [x] Añadir logs de diagnóstico
- [x] Recrear FK y constraints

**¡La solución está lista para probar desde la UI!** 🎉
