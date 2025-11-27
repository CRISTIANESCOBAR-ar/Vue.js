# Implementación del Campo PASADOR

## Resumen

Se agregó el campo `PASADOR` a la tabla `USTER_PAR` para registrar si se utilizó un pasador (guía de hilo) durante el ensayo. El campo almacena los valores "Sí" o "No" según la selección del usuario.

## Cambios Realizados

### 1. Base de Datos

**Archivo**: `server/add_pasador_column.js`

- Script para agregar la columna `PASADOR VARCHAR2(3)` a la tabla `USTER_PAR`
- Verifica si la columna ya existe antes de agregarla
- Se ejecuta con: `node server/add_pasador_column.js`

**Estructura**:
```sql
ALTER TABLE USTER_PAR ADD PASADOR VARCHAR2(3)
```

### 2. Backend (server/index.js)

**Cambios en MERGE SQL** (líneas ~629-663):
- Agregado `PASADOR = :PASADOR` en la cláusula `UPDATE SET`
- Agregado `PASADOR` en la lista de columnas del `INSERT`
- Agregado `:PASADOR` en los valores del `INSERT`

**Cambios en parBinds** (línea ~687):
```javascript
PASADOR: par.PASADOR || null,
```

**Cambios en endpoint `/api/uster/par`** (línea ~233):
- Agregado `PASADOR` en el SELECT query para obtener el valor al cargar registros

### 3. Frontend (src/components/Uster.vue)

**UI - Radio Buttons** (líneas 205-235):
- Label "Pasador" a la izquierda
- Dos radio buttons: "Sí" y "No"
- Deshabilitado cuando no hay ensayo seleccionado (`:disabled="!selectedTestnr"`)
- Estilo compacto consistente con otros campos del formulario

**Estado Reactivo** (línea 352):
```javascript
const pasador = ref('')
```

**buildParObject()** (línea ~1338):
- Incluye `par.PASADOR = pasador.value` en el objeto enviado al backend

**saveCurrentTest()** (línea ~1430):
- Guarda `pasador.value` en `savedItem.pasador` para persistencia local en `scanList`

**selectRow()** (línea ~847):
- Carga `pasador.value` desde `scanList` al seleccionar un ensayo guardado

**clearForm()** (línea ~835):
- Limpia `pasador.value = ''` al limpiar el formulario

## Flujo de Datos

1. **Entrada del Usuario**: 
   - Usuario selecciona "Sí" o "No" en los radio buttons del campo Pasador

2. **Guardado Local**:
   - El valor se guarda en `pasador.value` (ref reactivo)
   - Al guardar el ensayo, se incluye en `savedItem.pasador` dentro de `scanList`

3. **Envío al Backend**:
   - `buildParObject()` incluye `PASADOR` en el payload
   - POST a `/api/uster/upload` con `{ par: { PASADOR: "Sí" }, tbl: [...] }`

4. **Almacenamiento en Oracle**:
   - Backend ejecuta MERGE INTO con bind `:PASADOR`
   - Se guarda en columna `USTER_PAR.PASADOR`

5. **Recuperación**:
   - GET `/api/uster/par` incluye columna PASADOR
   - Frontend carga valor desde `scanList` al seleccionar ensayo

## Validaciones

- Campo deshabilitado cuando `selectedTestnr` es null
- Valores permitidos: "Sí", "No", o null (no seleccionado)
- Persistencia local en `scanList` para mantener valor entre navegación

## Comandos de Verificación

### Verificar columna en Oracle:
```sql
SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH 
FROM USER_TAB_COLUMNS 
WHERE TABLE_NAME = 'USTER_PAR' AND COLUMN_NAME = 'PASADOR';
```

### Ver datos guardados:
```sql
SELECT TESTNR, PASADOR FROM USTER_PAR WHERE PASADOR IS NOT NULL;
```

### Ejecutar script de creación:
```bash
cd server
node add_pasador_column.js
```

## Fecha de Implementación

27 de noviembre de 2025
