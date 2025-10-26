# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## Notas del desarrollador

- Backup del formulario principal:
  - `backups/FormRegistro.vue.bak` contiene la copia de seguridad antes de los cambios de navegación por teclado.
- Atajos de teclado en el formulario `Carga de datos`:
  - ArrowDown: mueve el foco en orden Rolada → Base → Color → Metros → Observaciones → Guardar
  - ArrowUp: mueve el foco en orden inverso Guardar → Observaciones → Metros → Color → Base → Rolada
- Comprobación de versiones (PWA):
  - Al pulsar "Buscar actualizaciones" se consulta `public/version.json`.
  - Si hay una nueva versión disponible se muestra un banner y se ofrece actualizar.
  - Si no hay novedades, la app ya no muestra un toast repetitivo; en la sección "Configuración" aparece la etiqueta "Estás en la última versión" tras la comprobación.

Si vas a publicar: ejecuta `npm run build` y luego `firebase deploy` (como de costumbre).
