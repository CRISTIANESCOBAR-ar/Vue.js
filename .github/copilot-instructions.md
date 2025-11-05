# Copilot Instructions - Carga de Datos Vue

## Architecture Overview

This is a **Vue 3 + Vite PWA** that manages textile testing data with Oracle backend integration. The app handles two types of test data:

- **USTER tests** (textile quality measurements)
- **TensoRapid tests** (tensile strength measurements)

**Key architecture:**

- **Frontend**: Vue 3 (Composition API) + Pinia store + Tailwind v4 + Vite + PWA
- **Backend**: Express server (`server/index.js`) exposing REST endpoints
- **Database**: Oracle XE with tables `USTER_PAR`/`USTER_TBL` and `TENSORAPID_PAR`/`TENSORAPID_TBL`
- **Data flow**: Local file parsing (File System Access API) → frontend validation → POST to backend → Oracle MERGE/INSERT (transactional)

## Critical File Locations

- **Main components**: `src/components/{Uster.vue, TensoRapid.vue, FormRegistro.vue, ListaRegistros.vue}`
- **Store**: `src/stores/registro.js` (Pinia store for rolada/tela records)
- **Backend API**: `server/index.js` (endpoints: `/api/uster/upload`, `/api/tensorapid/upload`, `/api/uster/status`)
- **DB helpers**: `server/db.js` (Oracle connection pool)
- **Schemas**: `TENSORAPID_SETUP.md`, `TENSORAPID_CLEAN_SCHEMA_COMPLETED.md`, `server/create_tensorapid_tables.sql`

## Development Workflow

**Start dev server:**

```bash
npm run dev  # Vite dev server on http://localhost:5173
```

**Start backend (in separate terminal):**

```bash
cd server
npm start  # or node index.js (Express on port 3001)
```

**Environment setup:**
Create `server/.env`:

```
ORACLE_USER=your_user
ORACLE_PASSWORD=your_password
ORACLE_CONNECTIONSTRING=localhost:1521/XEPDB1
PORT=3001
SCHEMA_PREFIX=  # Optional, e.g., "MYSCHEMA." (include trailing dot)
```

**Build for production:**

```bash
npm run build       # Generates dist/ with optimized assets
firebase deploy     # Deploy to Firebase (if configured)
```

## Key Patterns & Conventions

### 1. Oracle MERGE pattern (upsert)

Backend uses `MERGE INTO` for atomic upsert operations. Example from `server/index.js`:

```javascript
MERGE INTO ${SCHEMA_PREFIX}USTER_PAR t
USING (SELECT :TESTNR AS TESTNR FROM DUAL) s
ON (t.TESTNR = s.TESTNR)
WHEN MATCHED THEN UPDATE SET ...
WHEN NOT MATCHED THEN INSERT ...
```

Always wrap DB operations in transactions (`connection.execute(..., { autoCommit: false })` + `connection.commit()` or `connection.rollback()`).

### 2. File parsing with .PAR/.TBL files

Both USTER and TensoRapid components use File System Access API to read local files:

- `.PAR` files: key-value format parsed into objects (e.g., `TESTNR=001705`)
- `.TBL` files: tab-delimited columns parsed into arrays of objects
- Pattern: `parseParText(text)` and `parseTblText(text)` functions in each component

### 3. Tailwind v4 configuration

**Critical**: This project uses Tailwind CSS v4 with `@tailwindcss/postcss` plugin.

- Config: `postcss.config.cjs` (not `tailwind.config.js`)
- Import CSS: `src/index.css` with `@tailwind base; @tailwind components; @tailwind utilities;`
- **Do NOT** add CDN script tags or v3-style `tailwind.config.js` with `plugins: [require('@tailwindcss/forms')]`

### 4. Responsive sidebar behavior

`src/App.vue` implements auto-hide sidebar with device-specific delays:

- Mobile (<768px): 1500ms
- Tablet (768-1023px): 3000ms
- Desktop (>=1024px): 1000ms
  Function: `scheduleHideSidebarWithDelay(ms)` adjusts delay based on `windowWidth`

### 5. Input formatting & validation

USTER inputs auto-format to 5 digits with zero-padding (e.g., `"123"` → `"00123"`):

```javascript
function formatUsterTestnr(event) {
  let val = event.target.value.replace(/\D/g, '').slice(0, 5)
  event.target.value = val
  if (val.length === 5) focusSaveButton()
}
```

Pattern: auto-focus next field when length limit reached.

### 6. Sticky table headers

Tables use `sticky top-0 bg-gray-100 z-10` on `<thead>` for fixed headers during vertical scroll (see `TensoRapid.vue`, `ListaRegistros.vue`).

## Database Schema Notes

- `USTER_PAR` and `TENSORAPID_PAR` tables have `CREATED_AT` and `UPDATED_AT` timestamp columns (default `SYSTIMESTAMP`)
- `TENSORAPID_PAR` includes `PAR_JSON` CLOB to store raw .PAR file as JSON backup
- Foreign keys: `TENSORAPID_PAR.USTER_TESTNR → USTER_PAR.TESTNR`, `TENSORAPID_TBL.TESTNR → TENSORAPID_PAR.TESTNR` (CASCADE DELETE)
- Column `"COMMENT"` in `TENSORAPID_PAR` is quoted because it's a reserved word in Oracle

## Common Tasks

**Add new DB column:**

1. Create script in `server/` (e.g., `add_column_name.js`)
2. Use pattern from `server/add_timestamps.js`: connect, execute DDL, commit, close
3. Update backend MERGE/INSERT bindings in `server/index.js`

**Debug Oracle queries:**
Backend logs SQL statements when `SHOW_SQL_IN_RESPONSE=true` in `.env`. Check terminal output after POST requests.

**Run responsive test simulation:**
In dev mode, a "Simular responsive" button appears in footer (see `App.vue` function `runResponsiveSimTest()`). Opens console groups with sidebar state at 360px, 800px, 1200px.

**Migration scripts pattern:**
All `server/*.js` migration scripts follow:

```javascript
import oracledb from 'oracledb'
import dotenv from 'dotenv'
dotenv.config()
async function run() {
  const conn = await oracledb.getConnection({
    /* credentials */
  })
  try {
    await conn.execute(`ALTER TABLE ...`, [], { autoCommit: false })
    await conn.commit()
    console.log('✓ Migration complete')
  } catch (err) {
    await conn.rollback()
    console.error('Migration failed:', err)
  } finally {
    await conn.close()
  }
}
run()
```

## Testing & Debugging

- **Playwright E2E tests**: `npm run test:e2e` (config: `playwright.config.cjs`)
- **Backend test scripts**: `server/test_tensorapid_upload.js`, `server/post_test.js` (POST sample payloads to verify endpoints)
- **Verify data**: `server/verify_tensorapid_data.js` (queries Oracle and prints row counts/samples)

## Gotchas & Known Issues

1. **Oracle connection pool**: Backend uses singleton pool (`server/db.js`). Call `initPool()` before first connection.
2. **Reserved column names**: Use quoted identifiers for Oracle reserved words (e.g., `"COMMENT"`) and bind with alias to avoid ORA-01745.
3. **Tailwind CDN warning**: If you see "cdn.tailwindcss.com should not be used in production", check `index.html` for leftover `<script>` tags. Remove them; CSS is processed via PostCSS.
4. **PWA versioning**: `public/version.json` is auto-generated by `scripts/write-version.cjs` (runs in `prebuild`). Update logic triggers in `App.vue` via `checkForUpdates()`.
5. **Browser extensions noise**: Console logs from `background.js`, Norton, WAX are from extensions, not the app. Test in incognito to isolate app logs.

## Project-Specific Terminology

- **Rolada**: Textile roll ID (input in `FormRegistro.vue`)
- **TESTNR**: Test number (primary key for USTER and TensoRapid)
- **HUSO**: Thread count format like "62/5" (extract numeric part as `HUSO_NUMBER`)
- **PAR/TBL files**: Native data format from USTER and TensoRapid instruments
- **MERGE**: Oracle's upsert statement (INSERT if not exists, UPDATE if exists)

---

_Last updated: 2025-11-05_
