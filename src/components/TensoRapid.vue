<template>
	<div class="max-w-4xl mx-auto bg-white rounded shadow p-4">
		<h3 class="text-lg font-medium mb-3">TensoRapid</h3>

		<!-- Selector de carpeta -->
		<div class="mt-3 flex items-center gap-3">
			<label class="text-sm font-medium text-gray-700 mr-2 shrink-0">Carpeta TensoRapid:</label>
			<div class="flex-1 min-w-0">
				<div class="px-2 py-1 border rounded bg-gray-50 text-sm text-gray-800 truncate"
					:title="tensoFolderPathFull">
					{{ tensoFolderPathFull || 'Ninguna carpeta seleccionada' }}
				</div>
			</div>
			<div class="flex items-center gap-2">
				<button @click="selectTensoFolder"
					class="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">Seleccionar</button>
				<button @click="refreshTensoFolder"
					class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm">Actualizar</button>
				<input ref="tensoFolderInputLocal" type="file" webkitdirectory directory multiple class="hidden"
					@change="onTensoFolderInputChangeLocal" />
			</div>
		</div>

		<div class="mt-4">
			<div class="scan-container max-h-64 overflow-y-auto">
				<table class="text-sm border-collapse fixed-table scan-table w-full">
					<colgroup>
						<col />
						<col />
						<col />
						<col />
						<col />
					</colgroup>
					<thead>
						<tr class="bg-gray-100 text-gray-700">
							<th class="p-1 border text-xs text-center">Ensayo</th>
							<th class="p-1 border text-xs text-center">.PAR</th>
							<th class="p-1 border text-xs text-center">.TBL</th>
							<th class="p-1 border text-xs text-center">Ne</th>
							<th class="p-1 border text-xs text-center">Maq.</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(item, idx) in tensoDisplayList" :key="idx" class="hover:bg-gray-50 cursor-pointer"
							@click="onSelect(item.testnr)">
							<td class="p-1 border text-xs text-center">{{ item.testnr || '' }}</td>
							<td class="p-1 border text-center text-xs"><input type="checkbox" disabled
									:checked="item.hasPar" /></td>
							<td class="p-1 border text-center text-xs"><input type="checkbox" disabled
									:checked="item.hasTbl" /></td>
							<td class="p-1 border text-center text-xs font-mono">{{ item.nomcount || '' }}</td>
							<td class="p-1 border text-center text-xs font-mono">{{ item.maschnr || '' }}</td>
						</tr>
					</tbody>
				</table>
			</div>
			<div class="flex items-center gap-2 mt-2">
				<div class="text-sm text-gray-600">{{ tensoScanStatus }}</div>
				<div v-if="isScanning" class="text-sm text-gray-500 flex items-center gap-2">
					<svg class="w-4 h-4 animate-spin text-gray-600" viewBox="0 0 24 24" fill="none">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
						</circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
					</svg>
					<span>Escaneando...</span>
				</div>
			</div>
		</div>

		<!-- Preview area for selected test -->
		<div v-show="parsedTblData.length"
			class="max-w-4xl mx-auto bg-white rounded shadow p-4 mt-4">
			<h5 class="font-medium mb-2">Preview — TESTNR: {{ tblTestnr }}</h5>
			<div class="overflow-auto border rounded">
				<table class="w-full text-sm border-collapse">
					<thead>
						<tr class="bg-gray-100 text-gray-700">
							<th class="p-1 border text-xs">#</th>
							<th class="p-1 border text-xs">TESTNR</th>
							<th class="p-1 border text-xs">NO.</th>
							<th class="p-1 border text-xs">TIEMPO_ROTURA</th>
							<th class="p-1 border text-xs">FUERZA_B</th>
							<th class="p-1 border text-xs">ELONGACION</th>
							<th class="p-1 border text-xs">TENACIDAD</th>
							<th class="p-1 border text-xs">TRABAJO</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(r, ri) in parsedTblData" :key="ri">
							<td class="p-1 border text-xs">{{ ri + 1 }}</td>
							<td class="p-1 border text-xs font-mono">{{ r[0] || '' }}</td>
							<td v-for="(c, ci) in r.slice(1, 7)" :key="ci" class="p-1 border text-xs font-mono">{{ c }}
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

// UI state
const tensoFolderInputLocal = ref(null)
const tensoFolderPathFull = ref('')
const tensoHasPersistedHandle = ref(false)
const tensoScanList = ref([])
const tensoScanStatus = ref('')
const isScanning = ref(false)
const maxRows = 10

// compute display list padded to maxRows
const tensoDisplayList = computed(() => {
	const out = []
	if (!Array.isArray(tensoScanList.value) || tensoScanList.value.length === 0) {
		for (let i = 0; i < maxRows; i++) out.push({ testnr: '', hasPar: false, hasTbl: false, nomcount: '', maschnr: '' })
		return out
	}
	if (tensoScanList.value.length >= maxRows) return tensoScanList.value
	out.push(...tensoScanList.value)
	while (out.length < maxRows) out.push({ testnr: '', hasPar: false, hasTbl: false, nomcount: '', maschnr: '' })
	return out
})

async function onSelect(testnr) {
	if (!testnr) return
	await loadSelectedTensoFiles(testnr)
}

// load .PAR and .TBL for a given testnr using the persisted handle (or fallback input files)
async function loadSelectedTensoFiles(testnr) {
	try {
		fileText.value = ''
		tblText.value = ''
		// Do not clear parsedTblData here to avoid UI flicker when switching between rows.
		// parsedTblData will be replaced only after new data is parsed.
		selectedTblName.value = ''
		tblTestnr.value = testnr

		// Try to read from the in-memory scan list first (these entries may include file handles)
		const item = Array.isArray(tensoScanList.value) ? tensoScanList.value.find(x => x.testnr === testnr) : null
		if (item) {
			// If scan stored handles, use them (faster and less chance of missing files)
			try {
				if (item.parHandle && typeof item.parHandle.getFile === 'function') {
					const pf = await item.parHandle.getFile()
					fileText.value = await pf.text()
				}
			} catch (err) {
				console.warn('reading .PAR from scan-list handles failed', err)
			}
			try {
				if (item.tblHandle && typeof item.tblHandle.getFile === 'function') {
					const tf = await item.tblHandle.getFile()
					tblText.value = await tf.text()
					selectedTblName.value = tf.name || ''
					parseTblText(tblText.value)
				}
			} catch (err) {
				console.warn('reading .TBL from scan-list handles failed', err)
			}
			// if we got anything, return early
			if (fileText.value || tblText.value) return
		}

		// Fallback: read from the persisted directory handle (if any)
		const dh = await getDirHandleFromIDB('dir-tenso')
		if (!dh) {
			tensoScanStatus.value = 'No hay acceso directo a la carpeta (fallback). Usa Seleccionar para elegir carpeta.'
			return
		}
		const ok = await verifyPermission(dh, 'read')
		if (!ok) {
			tensoScanStatus.value = 'Permiso denegado para leer la carpeta. Vuelve a seleccionar la carpeta.'
			return
		}

		for await (const [name, handle] of dh.entries()) {
			try {
				if (!handle || handle.kind !== 'file') continue
				const ln = String(name || '').toLowerCase()
				if (!String(name).includes(testnr)) continue
				if (ln.endsWith('.par')) {
					try {
						const f = await handle.getFile()
						fileText.value = await f.text()
					} catch (err) {
						console.warn('reading .PAR selected', err)
					}
				}
				if (ln.endsWith('.tbl')) {
					try {
						const f = await handle.getFile()
						tblText.value = await f.text()
						selectedTblName.value = f.name || ''
						parseTblText(tblText.value)
					} catch (err) {
						console.warn('reading .TBL selected', err)
					}
				}
			} catch (err) {
				// Protect the loop from unexpected handle errors
				console.warn('error iterating directory entries', err)
			}
		}
	} catch (err) { console.warn('loadSelectedTensoFiles error', err); tensoScanStatus.value = 'Error al cargar archivos seleccionados: ' + (err && err.message ? err.message : String(err)) }
}

function parseTblText(text) {
	tblText.value = text || ''
	if (!text) return
	const lines = text.split(/\r?\n/)
	// startIndex 5 => line 6 (1-based rows: 6..)
	const startIndex = 5

	// derive TESTNR from selectedTblName (chars 7..12 -> slice(6,12)), fallback to provided tblTestnr
	let testnrFromName = ''
	if (selectedTblName.value && selectedTblName.value.length >= 12) {
		testnrFromName = selectedTblName.value.slice(6, 12)
	} else if (selectedTblName.value) {
		const m = (selectedTblName.value || '').match(/(\d{4,6})/)
		testnrFromName = m ? m[1] : ''
	}
	if (!testnrFromName && tblTestnr.value) testnrFromName = tblTestnr.value

	// build rows locally to avoid mutating the reactive array until ready
	const rows = []
	for (let i = startIndex; i < lines.length; i++) {
		const row = lines[i]
		const cleanRow = row && row.charCodeAt(0) === 0xFEFF ? row.slice(1) : row
		if (!cleanRow || cleanRow.trim() === '') break
		const cols = cleanRow.split('\t').map(c => (c || '').trim())
		// Build row as [TESTNR, NO., TIEMPO_ROTURA, FUERZA_B, ELONGACION, TENACIDAD, TRABAJO]
		const rowData = [testnrFromName]
		// columns 1..6 map to cols[0]..cols[5]
		for (let ci = 0; ci < 6; ci++) {
			rowData.push(cols[ci] || '')
		}
		rows.push(rowData)
	}
	// Replace reactive array in one assignment to minimize reactivity churn
	parsedTblData.value = rows
}

const fileText = ref('')
const tblText = ref('')
const selectedTblName = ref('')
const tblTestnr = ref('')
const parsedTblData = ref([])

// IndexedDB helpers (store handles)
function openDb() {
	return new Promise((resolve, reject) => {
		// Open without explicit version so we don't attempt to open with a lower version than
		// the one already present in the browser (which throws VersionError).
		const r = window.indexedDB.open('carga-uster')
		r.onupgradeneeded = () => {
			const db = r.result
			if (!db.objectStoreNames.contains('handles')) db.createObjectStore('handles')
		}
		r.onsuccess = () => resolve(r.result)
		r.onerror = () => reject(r.error)
	})
}
async function saveDirHandleToIDB(dirHandle, key = 'dir-tenso') {
	const db = await openDb()
	return new Promise((resolve, reject) => {
		const tx = db.transaction('handles', 'readwrite')
		const store = tx.objectStore('handles')
		const req = store.put(dirHandle, key)
		req.onsuccess = () => resolve(true)
		req.onerror = () => reject(req.error)
	})
}
async function getDirHandleFromIDB(key = 'dir-tenso') {
	const db = await openDb()
	return new Promise((resolve, reject) => {
		const tx = db.transaction('handles', 'readonly')
		const store = tx.objectStore('handles')
		const req = store.get(key)
		req.onsuccess = () => resolve(req.result)
		req.onerror = () => reject(req.error)
	})
}
async function verifyPermission(handle, mode = 'read') {
	if (!handle) return false
	try {
		const opts = { mode }
		if (await handle.queryPermission(opts) === 'granted') return true
		if (await handle.requestPermission(opts) === 'granted') return true
	} catch (err) { console.warn('verifyPermission error', err) }
	return false
}

// extract cell from TSV-like .PAR (1-based rows/cols)
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

// scan directory handle for .PAR/.TBL files
async function scanTensoDirectory(dirHandle) {
	const map = {}
	try {
		isScanning.value = true
		for await (const [name, handle] of dirHandle.entries()) {
			if (!handle || handle.kind !== 'file') continue
			const ln = String(name || '').toLowerCase()
			if (!(ln.endsWith('.par') || ln.endsWith('.tbl'))) continue
			// extract ensayo from characters 7..12 (1-based inclusive => slice(6,12))
			const rawName = String(name || '')
			let t = ''
			if (rawName.length >= 12) t = rawName.slice(6, 12)
			// fallback: 5-digit regex
			if (!t || !/\d{4,6}/.test(t)) {
				const m = rawName.match(/(\d{5})/) || []
				t = m[1] || ''
			}
			if (!t) continue
			if (!map[t]) map[t] = { testnr: t, hasPar: false, hasTbl: false, parHandle: null, tblHandle: null, nomcount: '', maschnr: '' }
			if (ln.endsWith('.par')) {
				map[t].hasPar = true
				map[t].parHandle = handle
				try {
					const f = await handle.getFile()
					const txt = await f.text()
					// Ne (NOMCOUNT) está en la fila 14, columna 5 según especificación
					map[t].nomcount = extractTsvCell(txt, 14, 5) || ''
					// MASCHNR está en la fila 12, columna 5
					map[t].maschnr = extractTsvCell(txt, 12, 5) || ''
				} catch (err) { console.warn('reading .PAR during scan', name, err) }
			}
			if (ln.endsWith('.tbl')) { map[t].hasTbl = true; map[t].tblHandle = handle }
		}
	} catch (err) { console.warn('scanTensoDirectory error', err) }
	finally { isScanning.value = false }

	tensoScanList.value = Object.values(map).sort((a, b) => a.testnr.localeCompare(b.testnr))
	tensoScanStatus.value = tensoScanList.value.length ? (`Encontrados ${tensoScanList.value.length} ensayos`) : 'No se encontraron archivos .PAR/.TBL válidos en la carpeta seleccionada'
	try { localStorage.setItem('tenso.scanSnapshot', JSON.stringify(tensoScanList.value)) } catch (err) { console.warn('persist snapshot failed', err) }
}

// Select folder (File System Access API) or fallback to hidden input
async function selectTensoFolder() {
	try {
		if (typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function') {
			const dh = await window.showDirectoryPicker()
			if (!dh) return
			await saveDirHandleToIDB(dh, 'dir-tenso')
			tensoHasPersistedHandle.value = true
			tensoFolderPathFull.value = dh.name || ''
			await scanTensoDirectory(dh)
			return
		}
		// fallback to input (scan only, do not persist files)
		if (tensoFolderInputLocal && tensoFolderInputLocal.value) tensoFolderInputLocal.value.click()
	} catch (err) { console.warn('selectTensoFolder error', err) }
}

async function refreshTensoFolder() {
	try {
		const dh = await getDirHandleFromIDB('dir-tenso')
		if (!dh) return selectTensoFolder()
		const ok = await verifyPermission(dh, 'read')
		if (!ok) return selectTensoFolder()
		tensoHasPersistedHandle.value = true
		tensoFolderPathFull.value = dh.name || ''
		await scanTensoDirectory(dh)
	} catch (err) { console.warn('refreshTensoFolder error', err) }
}

async function onTensoFolderInputChangeLocal(e) {
	try {
		const files = e && e.target && e.target.files ? Array.from(e.target.files) : []
		const map = {}
		for (const f of files) {
			const name = f.name || ''
			const ln = name.toLowerCase()
			if (!(ln.endsWith('.par') || ln.endsWith('.tbl'))) continue
			let t = ''
			if (name.length >= 12) t = name.slice(6, 12)
			if (!t || !/\d{4,6}/.test(t)) {
				const m = name.match(/(\d{5})/) || []
				t = m[1] || ''
			}
			if (!t) continue
			if (!map[t]) map[t] = { testnr: t, hasPar: false, hasTbl: false, nomcount: '', maschnr: '' }
			if (ln.endsWith('.par')) {
				map[t].hasPar = true
				try { const txt = await f.text(); map[t].nomcount = extractTsvCell(txt, 14, 5) || ''; map[t].maschnr = extractTsvCell(txt, 12, 5) || '' } catch (err) { console.warn('reading .PAR fallback', err) }
			}
			if (ln.endsWith('.tbl')) map[t].hasTbl = true
		}
		tensoScanList.value = Object.values(map).sort((a, b) => a.testnr.localeCompare(b.testnr))
		tensoScanStatus.value = tensoScanList.value.length ? (`Encontrados ${tensoScanList.value.length} ensayos (input)`) : 'No se encontraron archivos en el input'
		try { localStorage.setItem('tenso.scanSnapshot', JSON.stringify(tensoScanList.value)) } catch (err) { console.warn('persist snapshot failed', err) }
	} catch (err) { console.warn('onTensoFolderInputChangeLocal error', err) }
}

onMounted(() => {
	if (typeof window !== 'undefined' && typeof window.document !== 'undefined') window.document.title = 'TensoRapid'
	// try to load existing snapshot from localStorage
	try {
		const raw = localStorage.getItem('tenso.scanSnapshot')
		if (raw) {
			const parsed = JSON.parse(raw)
			if (Array.isArray(parsed)) {
				tensoScanList.value = parsed
				tensoScanStatus.value = parsed.length ? (`Encontrados ${parsed.length} ensayos (snapshot)`) : 'No hay registros en snapshot'
			}
		}
	} catch { /* ignore */ }

	// Ensure preview pane is empty on first render (no preloaded file/tbl data)
	try {
		fileText.value = ''
		tblText.value = ''
		parsedTblData.value = []
		selectedTblName.value = ''
		tblTestnr.value = ''
	} catch { /* noop */ }

	// try to auto-load persisted dir handle 'dir-tenso' and scan it
	; (async () => {
		try {
			const dh = await getDirHandleFromIDB('dir-tenso')
			if (!dh) return
			const ok = await verifyPermission(dh, 'read')
			if (!ok) {
				console.warn('No permission to access persisted dir-tenso')
				return
			}
			tensoHasPersistedHandle.value = true
			tensoFolderPathFull.value = dh.name || ''
			await scanTensoDirectory(dh)
		} catch (err) {
			console.warn('auto-load dir-tenso failed', err)
		}
	})()
})
</script>

<style scoped>
.scan-container {
	max-height: 16rem;
	overflow-y: auto;
}
</style>
