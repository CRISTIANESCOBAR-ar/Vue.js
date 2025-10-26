<template>
  <div class="w-full pt-0.5 md:pt-2 px-0.5 md:px-2 space-y-3 uster-component">
    <!-- título mostrado movido a la pestaña del navegador -->

    <div class="bg-white rounded shadow p-2 md:p-2 space-y-3">
      <!-- Top: compact carpeta selector on a single line for desktop -->
      <div>
        <div class="flex items-center gap-3">
          <label class="text-sm font-medium text-gray-700 mr-2 shrink-0">Carpeta de archivos Uster:</label>

          <div class="flex-1 min-w-0">
            <div class="px-2 py-1 border rounded bg-gray-50 text-sm text-gray-800 truncate" :title="folderPathFull">
              {{ folderPathFull || folderPath || selectedFolderName || 'Ninguna carpeta seleccionada' }}
              <span v-if="!isAbsolutePath" class="text-xs text-gray-500 ml-2">(ruta no absoluta disponible por
                seguridad)</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button @click="selectFolder" title="Seleccionar carpeta con archivos de Uster"
              class="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm hidden md:inline-flex">Seleccionar</button>

            <button @click="selectFolder" title="Seleccionar carpeta con archivos de Uster"
              class="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 inline-flex md:hidden"
              aria-label="Seleccionar carpeta">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 7a2 2 0 012-2h3l2 3h6a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
            </button>

            <button v-if="hasPersistedHandle" @click="refreshFolder" title="Actualizar archivos de Uster"
              class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm hidden md:inline-flex">Actualizar</button>
            <button v-if="hasPersistedHandle" @click="refreshFolder" title="Actualizar archivos de Uster"
              class="p-2 bg-green-600 text-white rounded hover:bg-green-700 inline-flex md:hidden"
              aria-label="Actualizar carpeta">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M20 12a8 8 0 11-4.906-7.437M20 12h-4" />
              </svg>
            </button>

            <!-- Revalidar button removed from UI -->
            <input ref="folderInput" type="file" webkitdirectory directory multiple class="hidden"
              @change="onFolderInputChange" />
          </div>

        </div>
      </div>
      <!-- scanStatus moved below the left list as per UX request -->

      <!-- Middle: three columns (left: list, middle: compact preview, right: Nro/Titulo) -->
      <div class="grid" style="grid-template-columns: 372px 96px 280px; gap: 0.5rem 1ch; align-items: start;">
        <!-- Columna 1: Lista de Ensayos, Botones y Estado -->
        <div class="flex flex-col gap-2">
          <div class="scan-container">
            <table class="text-sm border-collapse fixed-table scan-table">
              <colgroup>
                <col class="col-ensayo" />
                <col class="col-par" />
                <col class="col-tbl" />
                <col class="col-imp" />
                <col class="col-ne" />
                <col class="col-maq" />
              </colgroup>
              <thead>
                <tr class="bg-gray-100 text-gray-700">
                  <th class="p-0.5 border text-xs text-center col-ensayo">Ensayo</th>
                  <th class="p-0.5 border text-center text-xs col-par">.PAR</th>
                  <th class="p-0.5 border text-center text-xs col-tbl">.TBL</th>
                  <th class="p-0.5 border text-center text-xs col-imp">Imp.</th>
                  <th class="p-0.5 border text-center text-xs col-ne">Ne</th>
                  <th class="p-0.5 border text-center text-xs col-maq">Maq.</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in scanDisplayList" :key="idx" class="hover:bg-gray-50 cursor-pointer"
                  @click="item.testnr && selectRow(item.testnr)"
                  :class="{ 'bg-indigo-50': selectedTestnr === item.testnr }">
                  <td class="p-0.5 border text-xs text-center text-xs col-ensayo">{{ item.testnr || '' }}</td>
                  <td class="p-0.5 border text-center text-xs col-par"><input type="checkbox" disabled
                      :checked="item.hasPar" /></td>
                  <td class="p-0.5 border text-center text-xs col-tbl"><input type="checkbox" disabled
                      :checked="item.hasTbl" /></td>
                  <td class="p-0.5 border text-center text-xs col-imp">{{ item.imp ? 'Sí' : 'No' }}</td>
                  <td class="p-0.5 border text-center font-mono text-xs col-ne">{{ item.nomcount || '' }}</td>
                  <td class="p-0.5 border text-center font-mono text-xs col-maq">{{ item.maschnr || '' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex gap-2">
            <button @click="loadSelectedFiles"
              class="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm">Cargar
              seleccionados</button>
            <button @click="clearCache" class="px-3 py-1 bg-gray-200 rounded text-sm">Limpiar cache</button>
          </div>
          <div class="text-sm text-gray-600">
            {{ scanStatus }}
          </div>
        </div>

        <!-- Columna 2: Nro / Titulo (ahora en el medio) -->
        <div style="width:96px;">
          <!-- fixed-height container that shows 10 rows and scrolls when there are more -->
          <div class="titulo-container">
            <table class="w-full text-sm border-collapse titulo-table">
              <thead>
                <tr class="bg-gray-100 text-gray-700">
                  <th class="p-0.5 border text-xs text-center" style="width: calc(4ch + 0.75rem);">Nro</th>
                  <th class="p-0.5 border text-xs text-center" style="width:96px">Titulo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, idx) in tituloList" :key="idx" class="hover:bg-gray-50">
                  <td class="p-0.5 border text-xs text-center font-mono" style="width: calc(4ch + 0.75rem);">{{ r.nro }}
                  </td>
                  <td class="p-0.5 border text-xs text-center" style="width:96px">
                    <div v-if="r.srcIndex !== null">
                      <input :id="'titulo-input-' + r.srcIndex" v-model="tblData[r.srcIndex].TITULO" inputmode="decimal"
                        maxlength="5" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                        @focus="onTituloFocus(r.srcIndex)" @blur="onTituloBlur(r.srcIndex)"
                        @input="onTituloInput(r.srcIndex, $event)" @keydown.enter.prevent="focusNextTitulo(r.srcIndex)"
                        @keydown.up.prevent="focusPrevTitulo(r.srcIndex)"
                        @keydown.down.prevent="focusNextTituloWrap(r.srcIndex)"
                        :class="['p-0.5 text-xs border truncate text-xs text-center', isFocusedIndex === r.srcIndex ? 'bg-yellow-100' : '']"
                        style="width:100%; box-sizing: border-box;" />
                    </div>
                    <div v-else class="text-xs text-gray-400">—</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Columna 3: Detalle Compacto (moved to right) -->
        <div>
          <table class="text-sm border-collapse compact-table">
            <colgroup>
              <col class="col-dato" />
              <col class="col-valor" />
            </colgroup>
            <thead>
              <tr class="bg-gray-100 text-gray-700">
                <th class="p-0.5 border text-xs text-left col-dato">Dato</th>
                <th class="p-0.5 border text-xs text-left col-valor">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in compactFields" :key="c.code">
                <td class="p-0.5 border font-medium text-xs col-dato">{{ c.label }}</td>
                <td class="p-0.5 border font-mono text-xs col-valor">{{ getFieldValueByCode(c.code) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Bottom: TBL import results (full width) -->
      <div v-if="tblData.length" class="mt-4 border-t pt-4 bg-white p-3 rounded">
        <h4 class="font-medium mb-2">Datos importados desde .TBL — TESTNR: {{ tblTestnr }}</h4>
        <div class="overflow-auto max-h-72 border rounded">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th class="p-0.5 border text-xs">#</th>
                <th v-for="c in tblColumns" :key="c" class="p-0.5 border text-xs">{{ c }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, idx) in tblData" :key="idx">
                <td class="p-0.5 border text-xs">{{ idx + 1 }}</td>
                <td v-for="c in tblColumns" :key="c" class="p-0.5 border font-mono text-xs">{{ r[c] }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-3">
          <h5 class="font-medium">Layout de importación (campo → columna)</h5>
          <table class="w-full text-sm border-collapse mt-2">
            <thead>
              <tr>
                <th class="p-1 border">Campo</th>
                <th class="p-1 border">Columna</th>
                <th class="p-1 border">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in tblFields" :key="f.name">
                <td class="p-1 border font-medium">{{ f.name }}</td>
                <td class="p-1 border">{{ f.col }}</td>
                <td class="p-1 border text-xs text-gray-600">{{ f.note || '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <!-- Detalle completo de campos extraídos (.PAR) movido hacia abajo -->
      <div v-if="fileText" class="mt-4 border-t pt-4 bg-white p-3 rounded">
        <h4 class="font-medium mb-2">Preview detallado para Oracle — campos extraídos (.PAR)</h4>
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="text-left">
              <th class="p-1 border">Campo</th>
              <th class="p-1 border">Valor extraído</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in oracleFields" :key="f.field">
              <td class="p-1 border font-medium">{{ f.field }}</td>
              <td class="p-1 border font-mono">{{ getCell(f.row, f.col) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import Swal from 'sweetalert2'

// refs and state
const folderInput = ref(null)
const selectedFolderName = ref('')
const scanList = ref([])
const selectedTestnr = ref('')
const scanStatus = ref('')

const selectedName = ref('')
const selectedFile = ref(null)
const fileText = ref('')
const folderPath = ref('')
const hasPersistedHandle = ref(false)
const folderPathFull = ref('')
const isAbsolutePath = ref(false)

function getTestnrFromName(name) {
  if (!name) return null
  const m = String(name).match(/(\d{5})/)
  return m ? m[1] : null
}

function onTituloInput(srcIndex, ev) {
  try {
    // read raw typed value
    let raw = String((ev && ev.target && ev.target.value) || '')
    // sanitize: allow only digits and a single dot; allow up to 2 decimal digits
    raw = raw.replace(/[^0-9.]/g, '')
    // keep only first dot and limit integer/decimal lengths (int: up to 2, dec: up to 2)
    const parts = raw.split('.')
    if (parts.length === 1) {
      // no dot: trim integer part to 2 digits
      raw = parts[0].slice(0, 2)
    } else {
      const intPart = parts[0].slice(0, 2)
      const decPart = (parts[1] || '').slice(0, 2)
      raw = intPart + '.' + decPart
    }
    // write sanitized value back to the model and DOM
    if (tblData.value && tblData.value[srcIndex]) tblData.value[srcIndex]['TITULO'] = raw
    if (ev && ev.target) ev.target.value = raw

    const max = Number(ev && ev.target && ev.target.maxLength) || 5
    if (raw.length >= max && raw.length > 0) {
      // small timeout to ensure the input value is applied before moving focus
      setTimeout(() => focusNextTitulo(srcIndex), 0)
    }
  } catch (err) { console.warn('onTituloInput error', err) }
}

async function selectFolder() {
  try {
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      // use File System Access API
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker()
      // save handle for persistence
      try { await saveDirHandleToIDB(dirHandle); hasPersistedHandle.value = true } catch (err) { console.warn('saveDirHandleToIDB failed', err) }
      selectedFolderName.value = dirHandle.name || 'Carpeta seleccionada'
      // folderPathFull: browsers do not expose full filesystem absolute path for security.
      // We store a best-effort display value. The user can override manually.
      folderPathFull.value = dirHandle.name || ''
      isAbsolutePath.value = false
      // scan directory and populate list
      try {
        await scanDirectory(dirHandle)
      } catch (err) { console.warn('scanDirectory error', err) }
      // no snapshot persistence: we persist only the DirectoryHandle in IDB
      return
    }
  } catch (err) { console.warn('selectFolder error', err) }
  // fallback: trigger webkitdirectory input
  try {
    if (folderInput.value) {
      folderInput.value.click()
    } else {
      console.warn('No se pudo abrir el selector de carpeta: input no disponible')
      try { Swal.fire({ icon: 'error', title: 'No se pudo abrir el selector', text: 'El selector de carpetas no está disponible en este contexto.' }) } catch { scanStatus.value = 'No se pudo abrir el selector de carpetas.' }
    }
  } catch (err) { console.warn('No se pudo abrir el selector de carpeta', err); try { Swal.fire({ icon: 'error', title: 'Error', text: String(err) }) } catch { scanStatus.value = String(err) } }
}

// openLocalPicker removed: no fallback local opener required

// --- File System Access persistence helpers (IndexedDB) ---
function openDb() {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open('carga-uster', 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('handles')) db.createObjectStore('handles')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function saveDirHandleToIDB(dirHandle) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readwrite')
    const store = tx.objectStore('handles')
    const r = store.put(dirHandle, 'dir')
    r.onsuccess = () => resolve(true)
    r.onerror = () => reject(r.error)
  })
}

async function getDirHandleFromIDB() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readonly')
    const store = tx.objectStore('handles')
    const r = store.get('dir')
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

async function verifyPermission(handle, mode = 'read') {
  // Check if permission was already granted. If not, request it.
  if (!handle) return false
  try {
    // @ts-ignore
    const opts = { mode }
    // @ts-ignore
    if (await handle.queryPermission(opts) === 'granted') return true
    // @ts-ignore
    if (await handle.requestPermission(opts) === 'granted') return true
  } catch (err) {
    console.warn('verifyPermission error', err)
  }
  return false
}

async function deleteDirHandleFromIDB() {
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('handles', 'readwrite')
      const store = tx.objectStore('handles')
      const r = store.delete('dir')
      r.onsuccess = () => resolve(true)
      r.onerror = () => reject(r.error)
    })
  } catch (err) { console.warn('deleteDirHandleFromIDB error', err) }
}

// revalidateFolder removed: permission revalidation handled in refreshFolder and onMounted flow

async function refreshFolder() {
  try {
    const dirHandle = await getDirHandleFromIDB()
    if (!dirHandle) return
    const ok = await verifyPermission(dirHandle, 'read')
    if (!ok) {
      try {
        const res = await Swal.fire({
          icon: 'warning',
          title: 'Permisos insuficientes',
          text: 'No se concedieron permisos de lectura para la carpeta almacenada. Debes seleccionar la carpeta de nuevo para otorgar permisos.',
          confirmButtonText: 'Seleccionar carpeta',
          showCancelButton: true,
          cancelButtonText: 'Cancelar'
        })
        if (res.isConfirmed) await selectFolder()
      } catch (err) { console.warn('Swal error', err) }
      return
    }
    await scanDirectory(dirHandle)
  } catch (err) { console.warn('refreshFolder error', err) }
}

// Manual path editing removed: UI simplified to selector + refresh

async function scanDirectory(dirHandle) {
  console.log('Iniciando scanDirectory con handle:', dirHandle.name);
  const map = {}
  let fileCount = 0;
  try {
    for await (const [name, handle] of dirHandle.entries()) {
      fileCount++;
      if (!handle || handle.kind !== 'file') continue
      const ln = String(name || '').toLowerCase()
      if (!(ln.endsWith('.par') || ln.endsWith('.tbl'))) continue

      console.log('Archivo encontrado:', name);

      const t = getTestnrFromName(name)
      if (!t) continue;

      console.log('TESTNR extraído:', t);

      if (!map[t]) map[t] = { testnr: t, hasPar: false, hasTbl: false, parHandle: null, tblHandle: null, imp: null, nomcount: null, maschnr: null }
      if (ln.endsWith('.par')) {
        map[t].hasPar = true
        map[t].parHandle = handle
        try {
          const f = await handle.getFile()
          const txt = await f.text()
          map[t].nomcount = extractTsvCell(txt, 15, 5) || ''
          map[t].maschnr = extractTsvCell(txt, 13, 5) || ''
        } catch (err) {
          console.warn('reading .PAR during scan', name, err)
        }
      }
      if (ln.endsWith('.tbl')) {
        map[t].hasTbl = true
        map[t].tblHandle = handle
      }
    }
  } catch (err) {
    console.error('Error durante el bucle de escaneo de directorio:', err);
    scanStatus.value = `Error al escanear: ${err.message}`;
  }

  console.log(`Escaneo finalizado. Total de archivos en el directorio: ${fileCount}. Ensayos mapeados: ${Object.keys(map).length}`);
  console.log('Mapa de ensayos:', map);

  scanList.value = Object.values(map).sort((a, b) => a.testnr.localeCompare(b.testnr))
  console.log('scanList actualizado:', scanList.value);

  selectedFolderName.value = dirHandle.name || 'Carpeta seleccionada'
  const count = scanList.value.length
  scanStatus.value = count ? (`Encontrados ${count} ensayos`) : 'No se encontraron archivos .PAR/.TBL válidos en la carpeta seleccionada'
}

// no snapshot persistence function: we persist only the DirectoryHandle in IDB

async function onFolderInputChange(e) {
  try {
    const files = (e && e.target && e.target.files) || []
    const map = {}
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const name = f.name || ''
      const ln = name.toLowerCase()
      if (!(ln.endsWith('.par') || ln.endsWith('.tbl'))) continue
      const t = getTestnrFromName(name)
      if (!t) continue
      if (!map[t]) map[t] = { testnr: t, hasPar: false, hasTbl: false, parHandle: null, tblHandle: null, imp: null, nomcount: null, maschnr: null }
      if (ln.endsWith('.par')) {
        map[t].hasPar = true
        map[t].parHandle = f
        try {
          const txt = await f.text()
          map[t].nomcount = extractTsvCell(txt, 15, 5) || ''
          map[t].maschnr = extractTsvCell(txt, 13, 5) || ''
        } catch (err) { console.warn('reading .PAR fallback', name, err) }
      }
      if (ln.endsWith('.tbl')) {
        map[t].hasTbl = true
        map[t].tblHandle = f
      }
    }
    scanList.value = Object.values(map).sort((a, b) => a.testnr.localeCompare(b.testnr))
    selectedFolderName.value = 'Carpeta seleccionada (local)'
    scanStatus.value = scanList.value.length ? (`Encontrados ${scanList.value.length} ensayos (fallback)`) : 'No se encontraron archivos .PAR/.TBL en la selección local'
    // derive a best-effort folder path from the first file's webkitRelativePath
    if (files.length > 0 && files[0].webkitRelativePath) {
      const rel = files[0].webkitRelativePath
      const parts = rel.split('/')
      if (parts.length > 1) folderPath.value = parts.slice(0, parts.length - 1).join('/')
    }
    hasPersistedHandle.value = false
    // when using fallback, set folderPathFull to the derived relative path
    folderPathFull.value = folderPath.value || ''
    isAbsolutePath.value = false
  } catch (err) { console.warn('onFolderInputChange error', err) }
}

onMounted(() => {
  // colocar el título en la pestaña del navegador
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') window.document.title = 'Uster';
  (async () => {
    try {
      // try to load persisted DirectoryHandle from IDB and re-scan if permission
      let dirHandle = null
      try { dirHandle = await getDirHandleFromIDB() } catch { /* ignore */ }
      if (dirHandle) {
        const ok = await verifyPermission(dirHandle, 'read')
        if (ok) {
          try {
            await scanDirectory(dirHandle)
          } catch (err) { console.warn('scanDirectory onMounted error', err) }
          hasPersistedHandle.value = true
          // folderPathFull: cannot expose absolute path; use handle.name as best-effort
          folderPathFull.value = dirHandle.name || ''
          isAbsolutePath.value = false
          return
        }
        // have handle but no permission: prompt user to re-select so browser can grant permissions
        selectedFolderName.value = dirHandle.name || 'Carpeta (sin permisos)'
        try {
          const r = await Swal.fire({
            icon: 'warning',
            title: 'Permisos requeridos',
            text: 'La carpeta guardada no tiene permisos de lectura. Selecciona la carpeta nuevamente para reautorizar el acceso.',
            confirmButtonText: 'Seleccionar carpeta',
            showCancelButton: true,
            cancelButtonText: 'Cancelar'
          })
          if (r.isConfirmed) await selectFolder()
        } catch (err) { console.warn('Swal error', err) }
        return
      }
    } catch (err) { console.warn('onMounted load snapshot error', err) }
  })()
})

async function loadSelectedFiles() {
  if (!selectedTestnr.value) return
  const item = scanList.value.find(x => x.testnr === selectedTestnr.value)
  if (!item) return
  // load PAR
  if (item.hasPar && item.parHandle) {
    try {
      let fileObj = null
      if (typeof item.parHandle.getFile === 'function') {
        fileObj = await item.parHandle.getFile()
      } else {
        fileObj = item.parHandle
      }
      if (fileObj) await setFile(fileObj)
    } catch (err) { console.warn('loadSelectedFiles.par error', err) }
  }
  // load TBL
  if (item.hasTbl && item.tblHandle) {
    try {
      let tfile = null
      if (typeof item.tblHandle.getFile === 'function') {
        tfile = await item.tblHandle.getFile()
      } else {
        tfile = item.tblHandle
      }
      if (tfile) await setTblFile(tfile)
    } catch (err) { console.warn('loadSelectedFiles.tbl error', err) }
  }
}

async function selectRow(testnr) {
  selectedTestnr.value = testnr
  try {
    await loadSelectedFiles()
  } catch (err) {
    console.warn('selectRow loadSelectedFiles error', err)
  }
}

async function clearCache() {
  try {
    try { await deleteDirHandleFromIDB() } catch { /* ignore */ }
    try { localStorage.removeItem('uster.scanSnapshot') } catch { /* ignore */ }
  } catch (err) { console.warn('clearCache error', err) }
  scanList.value = []
  selectedFolderName.value = ''
  selectedTestnr.value = ''
  // clear loaded previews
  fileText.value = ''
  tblData.value = []
  selectedName.value = ''
  selectedTblName.value = ''
}

// TBL file (new)
const selectedTblName = ref('')
const tblFile = ref(null)
const tblText = ref('')
const tblData = ref([]) // array of parsed rows
const tblTestnr = ref('')

// permitir 1-2 dígitos en la parte entera y hasta 2 decimales (ej. 1.25 .. 99.99)
const tituloMaskRe = /^\d{1,2}(?:\.\d{1,2})?$/
const tituloIntegerRe = /^\d{1,2}$/

// index of the input currently focused (for styling)
const isFocusedIndex = ref(null)

// Display list for scan (left table) that always shows up to maxRows placeholders
const scanDisplayList = computed(() => {
  const out = []
  const maxRows = 10
  if (!Array.isArray(scanList.value) || scanList.value.length === 0) {
    for (let i = 0; i < maxRows; i++) out.push({ testnr: '', hasPar: false, hasTbl: false, imp: null, nomcount: '', maschnr: '' })
    return out
  }
  if (scanList.value.length > maxRows) return scanList.value
  out.push(...scanList.value)
  while (out.length < maxRows) out.push({ testnr: '', hasPar: false, hasTbl: false, imp: null, nomcount: '', maschnr: '' })
  return out
})

// columns to display (based on mapping order)
const tblColumns = [
  'TESTNR', 'NO', 'U%_%', 'CVM_%', 'INDICE_%', 'CVM_1M_%', 'CVM_3M_%', 'CVM_10M_%', 'TITULO', 'TITULO_REL_±_%', 'H', 'SH', 'SH_1M', 'SH_3M', 'SH_10M', 'DELG_-30%_KM', 'DELG_-40%_KM', 'DELG_-50%_KM', 'DELG_-60%_KM', 'GRUE_35%_KM', 'GRUE_50%_KM', 'GRUE_70%_KM', 'GRUE_100%_KM', 'NEPS_140%_KM', 'NEPS_200%_KM', 'NEPS_280%_KM', 'NEPS_400%_KM'
]

// mapping of field names to column index (1-based) and notes
const tblFields = [
  { name: 'TESTNR', col: null, note: 'Extraer del nombre de archivo: caracteres 7..11' },
  { name: 'NO', col: 1 },
  { name: 'U%_%', col: 2 },
  { name: 'CVM_%', col: 3 },
  { name: 'INDICE_%', col: 4 },
  { name: 'CVM_1M_%', col: 5 },
  { name: 'CVM_3M_%', col: 6 },
  { name: 'CVM_10M_%', col: 7 },
  { name: 'TITULO', col: 9 },
  { name: 'TITULO_REL_±_%', col: 10 },
  { name: 'H', col: 11 },
  { name: 'SH', col: 12 },
  { name: 'SH_1M', col: 13 },
  { name: 'SH_3M', col: 14 },
  { name: 'SH_10M', col: 15 },
  { name: 'DELG_-30%_KM', col: 17 },
  { name: 'DELG_-40%_KM', col: 18 },
  { name: 'DELG_-50%_KM', col: 19 },
  { name: 'DELG_-60%_KM', col: 20 },
  { name: 'GRUE_35%_KM', col: 21 },
  { name: 'GRUE_50%_KM', col: 22 },
  { name: 'GRUE_70%_KM', col: 23 },
  { name: 'GRUE_100%_KM', col: 24 },
  { name: 'NEPS_140%_KM', col: 25 },
  { name: 'NEPS_200%_KM', col: 26 },
  { name: 'NEPS_280%_KM', col: 27 },
  { name: 'NEPS_400%_KM', col: 28 }
]


async function setFile(file) {
  selectedFile.value = file
  selectedName.value = file.name || ''
  const lower = (selectedName.value || '').toLowerCase()
  const shouldReadAsText = lower.endsWith('.par') || (file.type || '').startsWith('text/')
  if (shouldReadAsText) {
    try { fileText.value = await file.text() } catch (err) { console.warn('No se pudo leer el archivo .PAR', err); fileText.value = '' }
  } else {
    fileText.value = ''
  }
}

// TBL handlers

async function setTblFile(file) {
  tblFile.value = file
  selectedTblName.value = file.name || ''
  try {
    const text = await file.text()
    tblText.value = text
    // TESTNR: chars 7..11 (1-based), so slice(6,11)
    tblTestnr.value = (selectedTblName.value || '').slice(6, 11)
    parseTblText(text)
  } catch (err) {
    console.warn('No se pudo leer el archivo .TBL', err)
    tblText.value = ''
    tblData.value = []
    tblTestnr.value = ''
  }
}

function parseTblText(text) {
  tblData.value = []
  if (!text) return
  const lines = text.split(/\r?\n/)
  const startIndex = 5 // 0-based => row 6
  for (let i = startIndex; i < lines.length; i++) {
    const row = lines[i]
    // normalize BOM only if first character
    const cleanRow = row && row.charCodeAt(0) === 0xFEFF ? row.slice(1) : row
    const cols = (cleanRow || '').split('\t')
    // stop when first column is empty
    const firstCol = (cols[0] || '').trim()
    if (firstCol === '') break
    const entry = {}
    // always include TESTNR extracted from filename
    entry['TESTNR'] = tblTestnr.value || ''
    for (const f of tblFields) {
      if (f.name === 'TESTNR') continue
      const ci = f.col - 1
      entry[f.name] = (cols[ci] || '').trim()
    }
    tblData.value.push(entry)
  }
}

// computed list mapping NO -> Nro and TITULO -> Titulo for the selected TESTNR
// Always return exactly `maxRows` entries: real rows (with srcIndex) first, then placeholders
const tituloList = computed(() => {
  const out = []
  const maxRows = 10
  if (!tblData.value || !Array.isArray(tblData.value) || !selectedTestnr.value) {
    // return placeholders when no data/selection
    for (let i = 0; i < maxRows; i++) out.push({ nro: '', titulo: '', srcIndex: null })
    return out
  }

  // collect rows that match the selected TESTNR
  const matched = []
  for (let i = 0; i < tblData.value.length; i++) {
    const r = tblData.value[i]
    if ((r && (r['TESTNR'] || '')) === String(selectedTestnr.value)) {
      matched.push({ nro: r['NO'] || '', titulo: r['TITULO'] || '', srcIndex: i })
    }
  }

  // If there are more than maxRows, return them all (we'll allow scrolling).
  if (matched.length > maxRows) return matched

  // otherwise push the actual rows and pad with placeholders up to maxRows
  for (let i = 0; i < matched.length; i++) out.push(matched[i])
  while (out.length < maxRows) out.push({ nro: '', titulo: '', srcIndex: null })
  return out
})

function onTituloFocus(srcIndex) {
  isFocusedIndex.value = srcIndex
}

function validateAndNormalizeTitulo(srcIndex) {
  const raw = (tblData.value && tblData.value[srcIndex] && String(tblData.value[srcIndex]['TITULO'] || '').trim()) || ''
  if (raw === '') return true

  // helper to clamp and format to 2 decimals
  // allow range 0.01 .. 99.99 per user request
  function clampAndFormat(n) {
    if (Number.isNaN(n)) return ''
    if (n < 0.01) n = 0.01
    if (n > 99.99) n = 99.99
    const s = Number(n).toFixed(2)
    const parts = String(s).split('.')
    parts[0] = parts[0].padStart(2, '0')
    return parts.join('.')
  }

  // if integer like '7' or '12' convert to '7.00' or '12.00'
  if (tituloIntegerRe.test(raw)) {
    const formatted = clampAndFormat(Number(raw))
    if (formatted !== '') {
      if (tblData.value && tblData.value[srcIndex]) tblData.value[srcIndex]['TITULO'] = formatted
      return true
    }
  }

  // allow up to two decimals: try parse and validate range
  if (tituloMaskRe.test(raw)) {
    const n = parseFloat(raw)
    const formatted = clampAndFormat(n)
    if (formatted !== '') {
      if (tblData.value && tblData.value[srcIndex]) tblData.value[srcIndex]['TITULO'] = formatted
      return true
    }
  }

  // sanitize fallback: keep up to 2 integer digits and up to 2 decimals
  let sanitized = raw.replace(/[^0-9.]/g, '')
  const parts = sanitized.split('.')
  if (parts.length === 1) sanitized = parts[0].slice(0, 2)
  else sanitized = parts[0].slice(0, 2) + '.' + (parts[1] || '').slice(0, 2)

  if (sanitized === '') {
    if (tblData.value && tblData.value[srcIndex]) tblData.value[srcIndex]['TITULO'] = ''
    return true
  }
  const n2 = parseFloat(sanitized)
  const formatted2 = clampAndFormat(n2)
  if (formatted2 !== '') {
    if (tblData.value && tblData.value[srcIndex]) tblData.value[srcIndex]['TITULO'] = formatted2
    return true
  }
  // fallback clear
  if (tblData.value && tblData.value[srcIndex]) tblData.value[srcIndex]['TITULO'] = ''
  return true
}

function onTituloBlur(srcIndex) {
  validateAndNormalizeTitulo(srcIndex)
  // remove focus marker
  if (isFocusedIndex.value === srcIndex) isFocusedIndex.value = null
}

function focusNextTitulo(srcIndex) {
  // validate current first (onTituloBlur will run after blur when focus moves)
  // find position of current in tituloList
  const list = tituloList.value || []
  const pos = list.findIndex(x => x.srcIndex === srcIndex)
  if (pos === -1) return
  const next = list[pos + 1]
  // validate and normalize current before moving
  const ok = validateAndNormalizeTitulo(srcIndex)
  if (!ok) return
  if (next) {
    // focus next input
    nextTick(() => {
      if (typeof window !== 'undefined' && window.document) {
        const el = window.document.getElementById('titulo-input-' + next.srcIndex)
        if (el) {
          el.focus()
          try { el.select && el.select() } catch (err) { console.warn('select error', err) }
        }
      }
    })
  } else {
    // no next: blur current input to ensure validation
    nextTick(() => {
      if (typeof window !== 'undefined' && window.document) {
        const el = window.document.getElementById('titulo-input-' + srcIndex)
        if (el) el.blur()
      }
    })
  }
}

function focusNextTituloWrap(srcIndex) {
  const list = tituloList.value || []
  const pos = list.findIndex(x => x.srcIndex === srcIndex)
  if (pos === -1 || list.length === 0) return
  const next = list[pos + 1] || list[0]
  const ok = validateAndNormalizeTitulo(srcIndex)
  if (!ok) return
  if (next) {
    nextTick(() => {
      if (typeof window !== 'undefined' && window.document) {
        const el = window.document.getElementById('titulo-input-' + next.srcIndex)
        if (el) {
          el.focus()
          try { el.select && el.select() } catch (err) { console.warn('select error', err) }
        }
      }
    })
  }
}

function focusPrevTitulo(srcIndex) {
  const list = tituloList.value || []
  const pos = list.findIndex(x => x.srcIndex === srcIndex)
  if (pos === -1 || list.length === 0) return
  const prev = pos > 0 ? list[pos - 1] : list[list.length - 1]
  const ok = validateAndNormalizeTitulo(srcIndex)
  if (!ok) return
  if (prev) {
    nextTick(() => {
      if (typeof window !== 'undefined' && window.document) {
        const el = window.document.getElementById('titulo-input-' + prev.srcIndex)
        if (el) {
          el.focus()
          try { el.select && el.select() } catch (err) { console.warn('select error', err) }
        }
      }
    })
  }
}

function extractTsvCell(text, rowIndex, colIndex) {
  if (text == null) return null
  const lines = text.split(/\r?\n/)
  if (lines.length < rowIndex) return null
  let row = lines[rowIndex - 1]
  if (row && row.charCodeAt(0) === 0xFEFF) row = row.slice(1)
  const cols = row.split('\t')
  if (colIndex - 1 >= cols.length) return null
  return cols[colIndex - 1]
}

function getCell(row, col) {
  if (!fileText.value) return ''
  const v = extractTsvCell(fileText.value, row, col)
  return v == null ? '' : v
}

// Oracle mapping: field -> row, col (1-based)
const oracleFields = [
  { field: 'CATALOG', row: 3, col: 1 },
  { field: 'TESTNR', row: 8, col: 5 },
  { field: 'TIME', row: 9, col: 5 },
  { field: 'LOTE', row: 10, col: 5 },
  { field: 'SORTIMENT', row: 11, col: 5 },
  { field: 'ARTICLE', row: 12, col: 5 },
  { field: 'MASCHNR', row: 13, col: 5 },
  { field: 'MATCLASS', row: 14, col: 8 },
  { field: 'NOMCOUNT', row: 15, col: 5 },
  { field: 'NOMTWIST', row: 16, col: 5 },
  { field: 'USCODE', row: 17, col: 8 },
  { field: 'FB_MIC', row: 18, col: 5 },
  { field: 'FB_TIPO', row: 18, col: 8 },
  { field: 'FB_LONG', row: 18, col: 9 },
  { field: 'FB_PORC', row: 18, col: 12 },
  { field: 'LABORANT', row: 21, col: 5 },
  { field: 'OBS', row: 22, col: 5 },
  { field: 'TUNAME', row: 27, col: 5 },
  { field: 'GROUPS', row: 28, col: 5 },
  { field: 'WITHIN', row: 29, col: 5 },
  { field: 'TOTAL', row: 30, col: 5 },
  { field: 'SPEED', row: 31, col: 5 },
  { field: 'TESTTIME', row: 32, col: 5 },
  { field: 'SLOT', row: 33, col: 5 },
  { field: 'ABSORBERPRESSURE', row: 34, col: 5 }
]

// compact fields to show as essential summary (label + code)
const compactFields = [
  { label: 'Nro Test', code: 'TESTNR' },
  { label: 'Hilo', code: 'NOMCOUNT' },
  { label: 'Maquina', code: 'MASCHNR' },
  { label: 'Lote', code: 'LOTE' },
  { label: 'Total Test', code: 'TOTAL' },
  { label: 'Fecha y Hora', code: 'TIME' },
  { label: 'Laboratorista', code: 'LABORANT' }
]

function getFieldValueByCode(code) {
  // prefer using the parsed fileText when available
  const def = oracleFields.find(x => x.field === code)
  if (def && fileText.value) {
    const v = getCell(def.row, def.col)
    if (v) {
      if (code === 'TIME') return formatTimestampToDatetime(v)
      return v
    }
  }
  // fallback to values gathered during scanning (scanList)
  const item = scanList.value.find(x => x.testnr === selectedTestnr.value)
  if (item) {
    if (code === 'NOMCOUNT') return item.nomcount || ''
    if (code === 'MASCHNR') return item.maschnr || ''
    if (code === 'TESTNR') return item.testnr || ''
  }
  // last resort: empty string
  return ''
}

function formatTimestampToDatetime(value) {
  if (value == null) return ''
  const s = String(value).trim()
  if (s === '') return ''
  // try numeric
  const n = Number(s)
  if (!Number.isFinite(n)) return s
  // assume seconds if plausible (< 1e12), otherwise milliseconds
  let ms = n
  if (Math.abs(n) < 1e12) ms = n * 1000
  const d = new Date(ms)
  if (isNaN(d.getTime())) return s
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`
}
</script>

<style scoped>
.fixed-table {
  table-layout: fixed;
  width: 100%;
}

.compact-table {
  table-layout: fixed;
  width: 100%;
}

/* Anchos fijos para columnas */
.col-ensayo {
  width: 84px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', 'Helvetica Neue', monospace;
}

.col-par,
.col-tbl {
  width: 44px;
}

.col-imp {
  width: 56px;
}

.col-ne,
.col-maq {
  width: 60px;
}

.col-ne {
  width: 60px;
}

/* Columnas tabla compacta */
.col-dato {
  width: 100px;
}

.col-valor {
  width: 180px;
}

/* ensure table cells use border-box so widths include borders/padding */
table.text-sm,
table.text-sm th,
table.text-sm td {
  box-sizing: border-box;
  /* Use a system sans-serif stack for all table text to improve legibility */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* Nro/Titulo small column: fixed visible area for 10 rows and sticky header */
.titulo-container {
  /* height = header (approx 2rem) + 10 rows (each about 1.9rem) — adjustable via CSS variables */
  max-height: calc(var(--titulo-header-h, 2rem) + (var(--titulo-row-h, 1.9rem) * 10));
  overflow-y: auto;
  /* prevent horizontal scrollbar caused by small overflows */
  overflow-x: hidden;
}

.titulo-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: inherit;
  /* preserve header background */
}

.titulo-table tbody tr {
  /* hint row height to keep 10 visible rows — tweak if necessary */
  height: var(--titulo-row-h, 1.9rem);
}

.titulo-table td input {
  /* make inputs fit well inside the small column */
  height: calc(var(--titulo-row-h, 1.9rem) - 0.25rem);
  line-height: 1rem;
}

.scan-container {
  /* Scan list (left) fixed area for 10 rows */
  /* use the same header/row height variables as the Nro/Titulo column
     so both tables visually align */
  max-height: calc(var(--titulo-header-h, 2rem) + (var(--titulo-row-h, 1.9rem) * 10));
  overflow-y: auto;
  /* prevent horizontal scrollbar caused by column widths or long content */
  overflow-x: hidden;
}

.scan-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: inherit;
}

.scan-table tbody tr {
  height: var(--titulo-row-h, 1.9rem);
}

/* Defensive: ensure tables don't force horizontal scroll beyond their containers */
table.text-sm,
table.w-full {
  max-width: 100%;
  overflow-wrap: anywhere;
}

/* set concrete variables so row heights match exactly (including small margin) */
.uster-component {
  /* tweak these values if you want slightly larger/smaller rows */
  --titulo-row-h: 2rem;
  /* row height used for Nro/Titulo and scan rows */
  --titulo-header-h: 2rem;
  /* header height used in calculations */
}
</style>
