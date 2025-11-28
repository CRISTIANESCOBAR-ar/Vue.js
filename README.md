# Análisis Stock STC

Proyecto Vue 3 + Vite para análisis de archivos Excel con persistencia local.

## Características

- ✅ Menu lateral responsive y colapsable
- ✅ Carga de archivos XLSX
- ✅ Persistencia de datos en localStorage
- ✅ 3 páginas con navegación
- ✅ Interfaz moderna con modo claro/oscuro

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

El proyecto estará disponible en `http://localhost:5173`

## Build para Producción

```bash
npm run build
```

## Estructura del Proyecto

```
src/
├── components/
│   └── Sidebar.vue          # Menú lateral
├── views/
│   ├── CargaArchivo.vue     # Página principal con carga de Excel
│   ├── Pagina2.vue          # Página 2 (placeholder)
│   └── Pagina3.vue          # Página 3 (placeholder)
├── composables/
│   ├── useLocalStorage.js   # Gestión de localStorage
│   └── useExcelReader.js    # Lectura de archivos Excel
├── router/
│   └── index.js             # Configuración de rutas
├── App.vue                  # Componente principal
├── main.js                  # Punto de entrada
└── style.css                # Estilos globales
```

## Uso

1. Selecciona un archivo XLSX desde la página "Carga de Archivo"
2. Procesa el archivo para visualizar los datos
3. Los datos se guardan automáticamente en localStorage
4. Navega entre páginas usando el menú lateral

## Tecnologías

- Vue 3 (Composition API)
- Vite
- Vue Router
- XLSX (SheetJS)
- localStorage para persistencia
