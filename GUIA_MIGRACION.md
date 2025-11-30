# Guía de Migración: Análisis Stock STC

Esta guía describe los pasos para trasladar el proyecto de desarrollo a otra computadora.

## 1. Preparación (En la PC actual)

Antes de copiar los archivos, es recomendable limpiar las carpetas generadas automáticamente para reducir el peso del traslado.

1.  Navega a la carpeta del proyecto: `analisis-stock-stc`.
2.  **Elimina** la carpeta llamada `node_modules`.
    *   *Nota: Esta carpeta contiene miles de archivos y es muy pesada. Se puede regenerar fácilmente en la nueva PC.*
3.  **Elimina** la carpeta `dist` (si existe).
4.  Ahora tu carpeta del proyecto debería ser ligera y fácil de copiar.

## 2. Traslado

Copia la carpeta `analisis-stock-stc` completa a la nueva computadora utilizando el medio de tu preferencia (USB, Google Drive, OneDrive, Red local, etc.).

## 3. Instalación (En la nueva PC)

### Requisitos Previos
Asegúrate de que la nueva computadora tenga instalado **Node.js**.
*   Puedes verificarlo abriendo una terminal y escribiendo: `node -v`
*   Si no está instalado, descárgalo gratis desde [nodejs.org](https://nodejs.org/) (se recomienda la versión "LTS").

### Pasos de Instalación
1.  Abre la carpeta del proyecto en la nueva PC (puedes usar Visual Studio Code).
2.  Abre una terminal en esa carpeta.
3.  Ejecuta el siguiente comando para descargar todas las librerías necesarias:
    ```bash
    npm install
    ```
4.  Una vez finalizado, inicia el proyecto con:
    ```bash
    npm run dev
    ```
5.  El navegador se abrirá automáticamente (o verás un link como `http://localhost:5173`) con la aplicación funcionando.

## ⚠️ Importante: Datos y Backups

Ten en cuenta cómo funcionan los datos en esta aplicación:

*   **El Código**: Se traslada perfectamente siguiendo los pasos anteriores.
*   **Los Backups Locales**: Los backups que creaste con el botón "Guardar" se almacenan en la base de datos interna del navegador (IndexedDB) de la PC donde se crearon. **NO se transfieren automáticamente con la carpeta del proyecto.**

**Recomendación**:
Si necesitas trabajar con datos históricos en la nueva PC, asegúrate de llevar contigo los archivos Excel originales (`estoquePecas.xlsx`) y volver a cargarlos o generar nuevos backups en la nueva máquina.

## Opción: Instalación como App (PWA)

Una vez que el proyecto esté corriendo en la nueva PC (`npm run dev`), verás un icono en la barra de direcciones del navegador para **"Instalar Análisis Stock"**.
Esto te permitirá usar la herramienta como si fuera una aplicación nativa de escritorio, con acceso directo en el escritorio y barra de tareas.
