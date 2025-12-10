# 📊 Análisis Stock STC - Sistema de Producción y Control

Sistema completo de análisis de producción con importación automática desde Access/Excel a SQLite y visualización en Vue.js.

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
npm install
```

Esto instalará:
- **Backend**: `express`, `cors`, `sqlite3` (para API REST)
- **Frontend**: `vue`, `vue-router`, `chart.js`, `vue-chartjs`
- **Dev Tools**: `vite`, `concurrently`

### 2. Iniciar el Sistema Completo

#### Opción A: Todo en uno (API + Frontend)
```bash
npm run start:all
```

Esto inicia:
- API REST en `http://localhost:3001`
- Vue.js dev server en `http://localhost:5173`

#### Opción B: Servicios individuales

**Solo API:**
```bash
npm run api
```

**Solo Frontend:**
```bash
npm run dev
```

### 3. Acceder a la Aplicación

Abre tu navegador en: **http://localhost:5173**

---

## 📋 Componentes Disponibles

### 🏠 Dashboard (`/`)
- Estadísticas de todas las tablas
- Últimas importaciones
- Gráfico de producción (últimos 7 días)
- Top 10 motivos de parada

### 🔍 Búsqueda de Fichas (`/fichas`)
- Búsqueda en tiempo real por código, descripción, composición
- Modal con detalles completos del artículo
- Vista de tarjetas con información clave

### 🎯 Control de Calidad (`/calidad`)
- Tabla paginada con resultados de inspección
- Filtros por fecha, máquina, artículo
- Badges de estado (Aprobado/Reprobado)

### ⚠️ Paradas de Máquina (`/paradas`)
- Registro de interrupciones
- Filtros por fecha, máquina, motivo
- Total de horas de parada

---

## 🛠️ Scripts Disponibles

```bash
npm run dev              # Inicia Vite dev server
npm run api              # Inicia API REST en puerto 3001
npm run start:all        # Inicia API + Frontend (simultáneamente)
npm run build            # Compila para producción
npm run preview          # Preview de build
npm run deploy           # Deploy a GitHub Pages
```

---

## 📦 Importación de Datos

### Importación Manual con GUI

```powershell
pwsh .\scripts\import-gui.ps1
```

**O usa el acceso directo del escritorio:**
- Busca "Actualizar Base de Datos" en tu escritorio
- Doble clic para abrir la GUI

### Actualización Automática

```powershell
# Actualiza solo archivos modificados
pwsh .\scripts\update-all-tables.ps1

# Forzar reimportación completa
pwsh .\scripts\update-all-tables.ps1 -Force
```

---

## 🔌 API REST

**Base URL**: `http://localhost:3001`

### Endpoints Principales

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/status` | Estado del sistema |
| `GET /api/produccion` | Datos de producción |
| `GET /api/calidad` | Control de calidad |
| `GET /api/paradas` | Paradas de máquina |
| `GET /api/fichas?search=` | Búsqueda de artículos |

Ver documentación completa en `scripts/README.md`

---

## 📊 Base de Datos

- **Ubicación**: `C:\analisis-stock-stc\database\produccion.db`
- **Tipo**: SQLite 3
- **Tablas**: 7 tablas + control de importaciones

---

## 🗂️ Estructura del Proyecto

```
src/
├── components/
│   ├── Dashboard.vue          # Panel principal con estadísticas
│   ├── FichaSearch.vue        # Búsqueda de artículos
│   ├── CalidadTable.vue       # Tabla de control de calidad
│   ├── ParadasTable.vue       # Tabla de paradas
│   └── NavBar.vue             # Navegación principal
├── composables/
│   └── useDatabase.js         # API wrapper con 11 métodos
├── router/
│   └── index.js               # Rutas de Vue Router
├── App.vue                    # Layout principal
└── main.js                    # Punto de entrada

scripts/
├── sqlite-api-server.js       # Servidor API REST
├── import-gui.ps1             # Interfaz gráfica de importación
├── import-xlsx-to-sqlite.ps1  # Importador core
├── update-all-tables.ps1      # Actualización automática
└── mappings/                  # Configuración de columnas (7 archivos)
```

---

## 🐛 Troubleshooting

### API no responde
```powershell
# Verificar si está corriendo
netstat -ano | findstr :3001

# Reiniciar
npm run api
```

### Frontend no carga datos
1. Verifica API: `http://localhost:3001/api/status`
2. Abre DevTools (F12) → Consola
3. Verifica que ambos servicios estén corriendo

---

## 📝 Próximos Pasos

1. ✅ **Instalar**: `npm install`
2. ✅ **Iniciar**: `npm run start:all`
3. ✅ **Abrir**: `http://localhost:5173`
4. ✅ **Importar datos**: Usar GUI del escritorio
5. ✅ **Explorar**: Dashboard → Fichas → Calidad → Paradas

---

**¡Sistema listo para usar! 🎉**

Para más detalles técnicos, consulta `scripts/README.md`

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
