# Firebase Migration Guide

## 📋 Resumen

Esta guía explica cómo migrar los datos de Oracle a Firebase Firestore de forma segura, manteniendo Oracle operativo durante y después de la migración.

## ✅ Garantías de Seguridad

- **Oracle permanece intacto**: Solo operaciones de lectura
- **Proceso reversible**: Firebase se puede eliminar sin afectar Oracle
- **Sin cambios en el código principal**: Branch separado
- **Testing completo**: Validación antes de usar en producción

## 🎯 Objetivos

1. Acceso a datos desde cualquier dispositivo (PC/móvil)
2. Sin necesidad de VPN o red local
3. Sincronización en tiempo real
4. Soporte offline
5. Gratuito (plan Spark de Firebase)

## 📊 Volumen de Datos

**Actual:**
- USTER_PAR: 86 registros (~15 KB)
- USTER_TBL: 860 registros (~150 KB)
- TENSORAPID_PAR: 78 registros (~10 KB)
- TENSORAPID_TBL: 780 registros (~120 KB)
- **Total: ~295 KB**

**Proyección anual:** ~3.5 MB (0.35% del límite gratuito de 1GB)

## 🚀 Proceso de Migración

### Paso 1: Crear Proyecto Firebase (15 min)

1. Ir a https://console.firebase.google.com
2. Click en "Agregar proyecto"
3. Nombre: `carga-datos-vue`
4. Deshabilitar Google Analytics (opcional)
5. Click "Crear proyecto"

### Paso 2: Habilitar Firestore (5 min)

1. En el menú lateral → "Firestore Database"
2. Click "Crear base de datos"
3. Modo: **"Producción"** (para seguridad)
4. Ubicación: **"us-central1"** (o la más cercana)
5. Click "Habilitar"

### Paso 3: Generar Credenciales (10 min)

1. Configuración del proyecto (⚙️) → "Configuración del proyecto"
2. Tab "Cuentas de servicio"
3. Click "Generar nueva clave privada"
4. Guardar como: `server/firebase/serviceAccountKey.json`

⚠️ **IMPORTANTE**: Agregar a `.gitignore`:
```
server/firebase/serviceAccountKey.json
server/firebase/data/
```

### Paso 4: Instalar Dependencias (2 min)

```powershell
cd C:\carga-datos-vue\server
npm install firebase-admin
```

### Paso 5: Exportar Datos de Oracle (5 min)

```powershell
cd C:\carga-datos-vue\server\firebase
node export-oracle.js
```

**Output esperado:**
```
📦 Exporting USTER_PAR...
   ✓ Found 86 records
   ✓ Saved to uster_par.json (14.52 KB)

📦 Exporting USTER_TBL...
   ✓ Found 860 records
   ✓ Saved to uster_tbl.json (145.23 KB)

... (continúa para otras tablas)

✅ Export completed successfully!
```

### Paso 6: Importar a Firebase (5 min)

```powershell
node import-firebase.js
```

**Output esperado:**
```
📦 Importing uster_par...
   Found 86 records
   ✓ Batch 1: 86 records
   ✅ Imported 86 records to uster_par

... (continúa para otras colecciones)

✅ Import completed successfully!
```

### Paso 7: Verificar en Firebase Console (5 min)

1. Ir a Firebase Console → Firestore Database
2. Verificar colecciones:
   - `uster_par` (86 documentos)
   - `uster_tbl` (860 documentos)
   - `tensorapid_par` (78 documentos)
   - `tensorapid_tbl` (780 documentos)

3. Abrir un documento y verificar campos

## 🔄 Sincronización Continua

### Opción A: Manual (Recomendado al inicio)

Ejecutar después de cargar nuevos datos en Oracle:
```powershell
cd server/firebase
node export-oracle.js    # Exportar nuevos datos
node import-firebase.js  # Actualizar Firebase
```

### Opción B: Automática (Para producción)

Ejecutar `sync-bidirectional.js` con scheduler:
```powershell
# Windows Task Scheduler
# Ejecutar cada hora: node sync-bidirectional.js
```

## 📱 Estructura Firestore

```
carga-datos-vue (Firebase Project)
├── uster_par/                    # Colección
│   ├── 05413/                    # Documento (ID = TESTNR)
│   │   ├── testnr: "05413"
│   │   ├── nomcount: 7
│   │   ├── matclass: "Hilo"
│   │   ├── timestamp: Timestamp
│   │   └── ...
│   └── 05419/
│       └── ...
├── uster_tbl/                    # Colección
│   ├── {auto-id}/                # Documento (ID auto-generado)
│   │   ├── testnr: "05413"
│   │   ├── titulo: 8.9
│   │   ├── cvm_percent: 12.3
│   │   └── ...
│   └── ...
├── tensorapid_par/               # Colección
│   ├── 001708/                   # Documento (ID = TESTNR)
│   │   ├── testnr: "001708"
│   │   ├── uster_testnr: "05413"
│   │   └── ...
│   └── ...
└── tensorapid_tbl/               # Colección
    ├── {auto-id}/                # Documento
    │   ├── testnr: "001708"
    │   ├── fuerza_b: 745.2
    │   ├── elongacion: 5.8
    │   └── ...
    └── ...
```

## 💰 Costos Firebase

### Plan Spark (Gratuito)
- ✅ 1 GB almacenado
- ✅ 50,000 lecturas/día
- ✅ 20,000 escrituras/día

**Tu uso estimado:**
- Almacenamiento: ~3.5 MB/año (0.35% del límite)
- Lecturas: ~500/día (1% del límite)
- Escrituras: ~50/día (0.25% del límite)

**Conclusión:** Plan gratuito suficiente por 10+ años

### Plan Blaze (Si superas límites)
- $0.18/GB/mes almacenado
- $0.06 por 100K lecturas
- **Costo estimado:** $1-2/mes (poco probable)

## 🔒 Seguridad

### Reglas de Firestore (Ejemplo)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo usuarios autenticados pueden leer
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

## 🐛 Troubleshooting

### Error: "Cannot find module 'firebase-admin'"
```powershell
cd server
npm install firebase-admin
```

### Error: "serviceAccountKey.json not found"
- Descargar credenciales de Firebase Console
- Colocar en `server/firebase/serviceAccountKey.json`

### Error: "Permission denied" en Firestore
- Actualizar reglas de seguridad en Firebase Console
- Firestore → Reglas → Editar

### Error: "No data files found"
- Ejecutar primero `export-oracle.js`
- Verificar que exista `server/firebase/data/`

## 🔙 Rollback (Volver a Solo Oracle)

Si decides no usar Firebase:

1. **Eliminar colecciones en Firebase Console**
   - Firestore → Seleccionar colección → Eliminar

2. **Eliminar archivos locales**
   ```powershell
   Remove-Item -Recurse -Force server\firebase\data\
   Remove-Item server\firebase\serviceAccountKey.json
   ```

3. **Desinstalar dependencias (opcional)**
   ```powershell
   npm uninstall firebase-admin
   ```

4. **Oracle sigue funcionando normalmente**
   - Ningún cambio en Oracle
   - Frontend sigue usando Oracle
   - Zero downtime

## 📞 Soporte

- **Branch:** `feature/firebase-migration`
- **Documentación:** `server/firebase/README.md`
- **Scripts:** `server/firebase/*.js`

## ✅ Checklist de Migración

- [ ] Proyecto Firebase creado
- [ ] Firestore habilitado
- [ ] Credenciales descargadas
- [ ] Dependencias instaladas (`firebase-admin`)
- [ ] `.gitignore` actualizado
- [ ] `export-oracle.js` ejecutado
- [ ] Archivos JSON generados
- [ ] `import-firebase.js` ejecutado
- [ ] Datos verificados en Firebase Console
- [ ] Testing de queries
- [ ] Sincronización configurada (opcional)

## 🎓 Próximos Pasos

1. **Testing**: Probar queries desde Firebase
2. **Frontend**: Adaptar componentes para usar Firebase
3. **Autenticación**: Implementar login con Firebase Auth
4. **Deployment**: Subir a Firebase Hosting
5. **Mobile**: Agregar soporte PWA offline

---

**Tiempo total estimado:** 1-2 horas
**Dificultad:** Baja
**Riesgo:** Cero (Oracle intacto)
