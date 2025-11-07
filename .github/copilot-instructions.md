# Copilot Instructions - Carga de Datos Vue

## Copilot instructions — carga-datos-vue (resumen rápido)

Breve: frontend Vue 3 (Composition API) + Pinia + Vite + Tailwind v4; backend Express (server/) que habla con Oracle XE. El flujo principal: lectura local de `.PAR`/`.TBL` → validación en frontend → POST a `/api/*` → MERGE/INSERT en Oracle.

Archivos clave (rápido):

- `src/components/{Uster.vue,TensoRapid.vue,FormRegistro.vue,ListaRegistros.vue}` — parsers `parseParText` / `parseTblText` y UI de carga.
- `src/stores/registro.js` — Pinia store para registros/roladas.
- `server/index.js` — endpoints: `/api/uster/upload`, `/api/tensorapid/upload`, `/api/uster/status`.
- `server/db.js` — pool/conexión Oracle; ver `initPool()` y uso de transacciones.

Comandos dev esenciales:

- Frontend: `npm run dev` (Vite, http://localhost:5173)
- Backend: `cd server && npm start` (Express en puerto desde `server/.env`, por defecto 3001)
- Build: `npm run build`; deploy opcional con `firebase deploy` según `firebase.json`.

Entorno: crear `server/.env` con `ORACLE_USER`, `ORACLE_PASSWORD`, `ORACLE_CONNECTIONSTRING`, `PORT`, `SCHEMA_PREFIX`.

Patrones importantes y ejemplos del código:

- Oracle upsert: backend usa `MERGE INTO ...` y siempre ejecuta dentro de transacción (ej: `server/index.js`). Mantén `{ autoCommit: false }` y `commit()`/`rollback()`.
- Parsers: `.PAR` = key=value, `.TBL` = tab-delimited arrays; funciones `parseParText` / `parseTblText` en los componentes.
- Tailwind: el proyecto usa PostCSS/Tailwind v4; no agregues CDN de Tailwind ni config v3 incompatible — ver `postcss.config.cjs` y `src/index.css`.

Pruebas y scripts útiles:

- E2E: `npm run test:e2e` (Playwright config en `playwright.config.cjs`).
- Herramientas de backend: `server/test_tensorapid_upload.js`, `server/post_test.js`, `server/verify_tensorapid_data.js` para validar uploads y resultados en BD.

Gotchas recurrentes:

- La columna reservada `COMMENT` se usa con comillas en Oracle (`"COMMENT"`) — evita ORA-01745 usando alias/bindings.
- `server/db.js` expone un pool singleton: llamar `initPool()` antes de abrir conexiones.
- PWA/versioning: `public/version.json` es generado por `scripts/write-version.cjs` en `prebuild`.

Cómo ayudar como agente:

- Cuando modifiques backend SQL, actualiza también el MERGE/INSERT y los scripts en `server/` (p. ej. `add_*` o `recreate_*`).
- Para cambios UI, respeta los formateos automáticos (ej. `formatUsterTestnr`) y las clases utilitarias Tailwind existentes (no reescribir estilos globlamente).
- Si necesitas datos de prueba, toma `server/test_payload.json` o los ejemplos en `server/test_tensorapid_upload.js`.

Si algo no está claro (por ejemplo, reglas de naming del schema, o el uso del `SCHEMA_PREFIX`), dime qué sección quieres ampliar y la actualizo con ejemplos concretos del código.

Última revisión: 2025-11-07
