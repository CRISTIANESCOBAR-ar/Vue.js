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

		<!-- Filtros: Todos / No guardados / Guardados -->
		<div class="mt-3 flex items-center gap-4">
			<label class="inline-flex items-center text-sm">
				<input type="radio" name="tenso-filter" v-model="filterMode" value="all" class="mr-2" />
				<span>Todos</span>
			</label>
			<label class="inline-flex items-center text-sm">
				<input type="radio" name="tenso-filter" v-model="filterMode" value="not" class="mr-2" />
				<span>No guardados</span>
			</label>
			<label class="inline-flex items-center text-sm">
				<input type="radio" name="tenso-filter" v-model="filterMode" value="saved" class="mr-2" />
				<span>Guardados</span>
			</label>
		</div>

		<div class="mt-4">
			<div class="scan-container max-h-64 overflow-y-auto">
				<table class="text-sm border-collapse fixed-table scan-table w-full">
					<colgroup>
						<col style="width: 80px" />
						<col style="width: 50px" />
						<col style="width: 50px" />
						<col style="width: 50px" />
						<col style="width: 60px" />
						<col style="width: 60px" />
						<col style="width: 120px" />
						<col style="width: 80px" />
					</colgroup>
					<thead class="sticky top-0 bg-gray-100 z-10">
						<tr class="text-gray-700">
							<th class="p-1 border text-xs text-center">Ensayo</th>
							<th class="p-1 border text-xs text-center">.PAR</th>
							<th class="p-1 border text-xs text-center">.TBL</th>
							<th class="p-1 border text-xs text-center">Estado</th>
							<th class="p-1 border text-xs text-center">Ne</th>
							<th class="p-1 border text-xs text-center">Maq.</th>
							<th class="p-1 border text-xs text-center">USTER</th>
							<th class="p-1 border text-xs text-center">Acción</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(item, idx) in tensoDisplayList" :key="idx" class="hover:bg-gray-50 cursor-pointer"
							:class="{ 'bg-blue-50': selectedTensoTestnr === item.testnr }"
							@click="loadTensoTestFiles(item.testnr)">
							<td class="p-1 border text-xs text-center">{{ item.testnr || '' }}</td>
							<td class="p-1 border text-center text-xs"><input type="checkbox" disabled
									:checked="item.hasPar" /></td>
							<td class="p-1 border text-center text-xs"><input type="checkbox" disabled
									:checked="item.hasTbl" /></td>
							<td class="p-1 border text-center text-xs">
								<span v-if="item.saved === true" title="Guardado en la base de datos">
									<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-600 mx-auto"
										fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
									</svg>
								</span>
							</td>
							<td class="p-1 border text-center text-xs font-mono">{{ item.nomcount || '' }}</td>
							<td class="p-1 border text-center text-xs font-mono">{{ item.maschnr || '' }}</td>
							<td class="p-1 border text-center text-xs" @click.stop>
								<input v-if="item.testnr" 
									type="text" 
									v-model="item.usterTestnr" 
									:placeholder="item.saved ? '05410' : ''"
									maxlength="5" 
									inputmode="numeric"
									:disabled="item.saved && !item.isEditing"
									:ref="el => setInputRef(el, item.testnr)"
									@input="formatUsterTestnr(item, $event)"
									@keydown.enter="focusSaveButton(item)"
									:class="[
										'w-full px-1 py-0.5 text-xs text-center border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono',
										item.saved && !item.isEditing ? 'bg-gray-100 cursor-not-allowed' : ''
									]" />
							</td>
							<td class="p-1 border text-center text-xs" @click.stop>
								<!-- Botón Editar (solo si está guardado y no está editando) -->
								<button v-if="item.testnr && item.saved && !item.isEditing" @click="startEditing(item)"
									class="px-2 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs">
									Editar
								</button>
								<!-- Botones Guardar y Cancelar (si está editando o no está guardado) -->
								<div v-else-if="item.testnr && item.usterTestnr" class="flex gap-1 justify-center">
									<button @click="saveToOracle(item)"
										:disabled="isSaving"
										:ref="el => setSaveButtonRef(el, item.testnr)"
										class="px-2 py-0.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs disabled:opacity-50">
										{{ isSaving ? 'Guardando...' : 'Guardar' }}
									</button>
									<button v-if="item.isEditing" @click="cancelEditing(item)"
										:disabled="isSaving"
										class="px-2 py-0.5 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs disabled:opacity-50">
										Cancelar
									</button>
								</div>
							</td>
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

		<!-- Preview area for PAR data - COMENTADO: Solo se muestra TBL -->
		<!-- 
		<div v-show="Object.keys(parsedParData).length" class="max-w-4xl mx-auto bg-white rounded shadow p-4 mt-4">
			<h5 class="font-medium mb-2">Datos .PAR — TESTNR: {{ parsedParData.TESTNR || tblTestnr }}</h5>
			<div class="overflow-auto border rounded">
				<table class="w-full text-sm border-collapse">
					<thead>
						<tr class="bg-gray-100 text-gray-700">
							<th class="p-2 border text-xs text-left">Campo</th>
							<th class="p-2 border text-xs text-left">Valor</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="field in tensoParFields" :key="field.field">
							<td class="p-2 border text-xs font-medium">{{ field.field }}</td>
							<td class="p-2 border text-xs font-mono">{{ parsedParData[field.field] || '' }}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
		-->

		<!-- Preview area for TBL data -->
		<div v-show="parsedTblData.length" class="max-w-4xl mx-auto bg-white rounded shadow p-4 mt-4">
			<h5 class="font-medium mb-2">Datos .TBL — TESTNR: {{ tblTestnr }}</h5>
			<div class="overflow-auto border rounded max-h-96">
				<table class="w-full text-sm border-collapse">
					<thead class="sticky top-0 bg-gray-100">
						<tr class="text-gray-700">
							<th class="p-1 border text-xs">#</th>
							<th class="p-1 border text-xs">TESTNR</th>
							<th class="p-1 border text-xs">No.</th>
							<th class="p-1 border text-xs bg-blue-50">Huso</th>
							<th class="p-1 border text-xs">TIEMPO_ROTURA</th>
							<th class="p-1 border text-xs">FUERZA_B</th>
							<th class="p-1 border text-xs">ELONGACION</th>
							<th class="p-1 border text-xs">TENACIDAD</th>
							<th class="p-1 border text-xs">TRABAJO</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(row, ri) in preparedTblPreview" :key="ri">
							<td class="p-1 border text-xs text-center">{{ ri + 1 }}</td>
							<td class="p-1 border text-xs font-mono">{{ row.TESTNR || '' }}</td>
							<td class="p-1 border text-xs font-mono">{{ row.HUSO_ENSAYOS || '' }}</td>
							<td class="p-1 border text-xs font-mono bg-blue-50 text-center font-semibold">{{ row.HUSO_NUMBER }}</td>
							<td class="p-1 border text-xs font-mono text-right">{{ row.TIEMPO_ROTURA || '' }}</td>
							<td class="p-1 border text-xs font-mono text-right">{{ row.FUERZA_B || '' }}</td>
							<td class="p-1 border text-xs font-mono text-right">{{ row.ELONGACION || '' }}</td>
							<td class="p-1 border text-xs font-mono text-right">{{ row.TENACIDAD || '' }}</td>
							<td class="p-1 border text-xs font-mono text-right">{{ row.TRABAJO || '' }}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'

// UI state
const tensoFolderInputLocal = ref(null)
const tensoFolderPathFull = ref('')
const tensoHasPersistedHandle = ref(false)
const tensoScanList = ref([])
const selectedTensoTestnr = ref('')
const tensoScanStatus = ref('')
const isScanning = ref(false)
const isSaving = ref(false)
const maxRows = 10

// filtro UI: 'all' | 'saved' | 'not'
const filterMode = ref('all')

// Refs para inputs y botones (para auto-focus)
const inputRefs = ref({})
const saveButtonRefs = ref({})

// compute display list padded to maxRows and filtered by checkboxes
const tensoDisplayList = computed(() => {
	const src = Array.isArray(tensoScanList.value) ? tensoScanList.value.slice() : []

	// aplicar filtros
	let filtered = []
	if (src.length === 0) {
		filtered = []
	} else if (filterMode.value === 'all') {
		filtered = src
	} else {
		const showSaved = filterMode.value === 'saved'
		const showNot = filterMode.value === 'not'
		// si no hay ninguna opción seleccionada, mostrar todo
		if (!showSaved && !showNot) {
			filtered = src
		} else {
			filtered = src.filter(item => {
				const saved = !!item.saved
				return (saved && showSaved) || (!saved && showNot)
			})
		}
	}

	const out = []
	if (filtered.length === 0) {
		for (let i = 0; i < maxRows; i++) out.push({ testnr: '', hasPar: false, hasTbl: false, nomcount: '', maschnr: '' })
		return out
	}

	if (filtered.length >= maxRows) return filtered
	out.push(...filtered)
	while (out.length < maxRows) out.push({ testnr: '', hasPar: false, hasTbl: false, nomcount: '', maschnr: '' })
	return out
})

// Handlers para mantener comportamiento de filtros
// filtros manejados por filterMode (radio)

// (extractHusoNumber removed — logic inlined where needed)

// Formatea el texto de estado según total, savedCount y modo de filtro
function formatScanStatus(total, savedCount, mode) {
	if (!total || total === 0) return 'No se encontraron archivos .PAR/.TBL válidos en la carpeta seleccionada'
	if (mode === 'all') return `Encontrados ${total} ensayos (mostrando todos)`
	// si no tenemos savedCount, mostrar 'mostrando' genérico
	if (savedCount == null) {
		if (mode === 'saved') return `Encontrados ${total} ensayos (mostrando guardados)`
		if (mode === 'not') return `Encontrados ${total} ensayos (mostrando no guardados)`
	}
	const notSaved = total - (savedCount || 0)
	if (mode === 'saved') return `Encontrados ${total} ensayos (${savedCount} guardados)`
	if (mode === 'not') return `Encontrados ${total} ensayos (${notSaved} no guardados)`
	return `Encontrados ${total} ensayos`
}

// Recalcula y actualiza el texto de estado según la lista actual y el modo de filtro
function recalcStatus() {
	const total = Array.isArray(tensoScanList.value) ? tensoScanList.value.length : 0
	// detectar si tenemos información de saved en la lista
	const hasSavedInfo = Array.isArray(tensoScanList.value) && tensoScanList.value.some(it => typeof it.saved !== 'undefined')
	const savedCount = hasSavedInfo ? tensoScanList.value.reduce((acc, it) => acc + (it.saved ? 1 : 0), 0) : null
	tensoScanStatus.value = formatScanStatus(total, savedCount, filterMode.value)
}

// Cuando cambia el modo de filtro o la lista de ensayos, actualizar el label inmediatamente
watch(filterMode, () => recalcStatus())
watch(tensoScanList, () => recalcStatus(), { deep: true })

// Función para cargar archivos al hacer clic en una fila
async function loadTensoTestFiles(testnr) {
	if (!testnr) {
		console.log('loadTensoTestFiles: testnr vacío')
		return
	}
	console.log('loadTensoTestFiles: cargando archivos para testnr:', testnr)
	selectedTensoTestnr.value = testnr
	try {
		await loadSelectedTensoFiles(testnr)
		console.log('loadTensoTestFiles: archivos cargados exitosamente')
	} catch (err) {
		console.error('loadTensoTestFiles: error al cargar archivos', err)
	}
}

async function saveToOracle(item) {
	if (!item || !item.testnr || !item.usterTestnr) return
	if (isSaving.value) return

	isSaving.value = true
	try {
		// Cargar archivos PAR y TBL para este ensayo
		await loadSelectedTensoFiles(item.testnr)

		// Verificar que tengamos datos PAR y TBL
		if (!parsedParData.value || Object.keys(parsedParData.value).length === 0) {
			throw new Error('No se pudieron cargar los datos del archivo .PAR')
		}
		if (!parsedTblData.value || parsedTblData.value.length === 0) {
			throw new Error('No se pudieron cargar los datos del archivo .TBL')
		}

		// Agregar el TESTNR de USTER a los datos PAR
		const parDataToSave = {
			...parsedParData.value,
			USTER_TESTNR: item.usterTestnr
		}

		// Preparar datos TBL - extraer número de huso de la columna Ne (ej: "62/5" -> 62)
		const tblDataToSave = parsedTblData.value
			.map((row, index) => {
				// Extraer número de huso de la columna 1 (formato "62/5", "320/5", etc)
				const husoEnsayos = row[1] && row[1].trim() !== '' ? row[1].trim() : null
				let husoNumber = null
				if (husoEnsayos) {
					const match = husoEnsayos.match(/^(\d+)\//)
					if (match && match[1]) {
						husoNumber = parseInt(match[1], 10)
					}
				}
				// Si no se puede extraer, usar índice+1 como fallback
				if (!husoNumber || isNaN(husoNumber)) {
					husoNumber = index + 1
				}

				return {
					TESTNR: row[0] || parDataToSave.TESTNR,
					HUSO_ENSAYOS: husoEnsayos,
					HUSO_NUMBER: husoNumber,
					TIEMPO_ROTURA: row[2] && row[2].trim() !== '' ? row[2] : null,
					FUERZA_B: row[3] && row[3].trim() !== '' ? row[3] : null,
					ELONGACION: row[4] && row[4].trim() !== '' ? row[4] : null,
					TENACIDAD: row[5] && row[5].trim() !== '' ? row[5] : null,
					TRABAJO: row[6] && row[6].trim() !== '' ? row[6] : null
				}
			})

		// Toast de progreso
		if (typeof Swal !== 'undefined') {
			Swal.fire({
				toast: true,
				position: 'top-end',
				icon: 'info',
				title: 'Guardando...',
				showConfirmButton: false,
				timer: 30000,
				timerProgressBar: true
			})
		}

		// Determinar URL del backend
		const backendUrl = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
			? 'http://localhost:3001'
			: ''
		const endpoint = backendUrl + '/api/tensorapid/upload'

		// Enviar datos al backend
		// Log payload summary before sending (helps diagnose missing fields)
		try {
			console.log('Saving to backend. payload summary:', {
				TESTNR: parDataToSave.TESTNR,
				USTER_TESTNR: parDataToSave.USTER_TESTNR,
				parKeys: Object.keys(parDataToSave || {}).slice(0, 50),
				tblCount: tblDataToSave.length,
				tblFirst: tblDataToSave.length > 0 ? tblDataToSave[0] : null
			})
		} catch (e) { console.warn('Could not log payload summary', e) }
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				par: parDataToSave,
				tbl: tblDataToSave
			}),
			credentials: 'include'
		})

		let data = null
		try { data = await response.json() } catch { data = null }

		// Log server response for debugging
		try { console.log('Server response for saveToOracle:', { ok: response.ok, status: response.status, body: data }) } catch (e) { console.warn('Could not log server response', e) }

		if (!response.ok) {
			throw new Error(data && data.error ? data.error : (data && data.message) || `HTTP ${response.status}`)
		}

		// Marcar como guardado en la lista y salir del modo edición
		item.saved = true
		item.isEditing = false

		// Toast de éxito
		if (typeof Swal !== 'undefined') {
			Swal.fire({
				toast: true,
				position: 'top-end',
				icon: 'success',
				title: `Ensayo ${item.testnr} guardado`,
				text: `Vinculado con USTER ${item.usterTestnr}`,
				showConfirmButton: false,
				timer: 3000,
				timerProgressBar: true
			})
		}
	} catch (err) {
		console.error('saveToOracle error', err)
		// Modal de error
		if (typeof Swal !== 'undefined') {
			await Swal.fire({
				icon: 'error',
				title: 'Error al guardar',
				text: String(err && err.message ? err.message : err),
				confirmButtonText: 'Cerrar'
			})
		}
	} finally {
		isSaving.value = false
	}
}

// Iniciar edición de un ensayo guardado
function startEditing(item) {
	if (!item) return
	// Guardar el valor original por si se cancela
	item.originalUsterTestnr = item.usterTestnr
	item.isEditing = true
}

// Cancelar edición y restaurar valor original
function cancelEditing(item) {
	if (!item) return
	// Restaurar el valor original
	if (item.originalUsterTestnr !== undefined) {
		item.usterTestnr = item.originalUsterTestnr
	}
	item.isEditing = false
	item.originalUsterTestnr = undefined
}

// Guardar referencia al input para poder enfocarlo
function setInputRef(el, testnr) {
	if (el) {
		inputRefs.value[testnr] = el
	}
}

// Guardar referencia al botón Guardar para poder enfocarlo
function setSaveButtonRef(el, testnr) {
	if (el) {
		saveButtonRefs.value[testnr] = el
	}
}

// Formatear USTER_TESTNR con padding de ceros (5 dígitos) y solo números
function formatUsterTestnr(item, event) {
	if (!item) return
	
	// Extraer solo números
	let value = (event.target.value || '').replace(/\D/g, '')
	
	// Limitar a 5 caracteres
	if (value.length > 5) {
		value = value.slice(0, 5)
	}
	
	// Actualizar el valor (sin padding mientras escribe)
	item.usterTestnr = value
	
	// Si llegó a 5 dígitos, aplicar padding y enfocar botón Guardar
	if (value.length === 5) {
		// Padding con ceros a la izquierda
		item.usterTestnr = value.padStart(5, '0')
		// Enfocar botón Guardar después de un pequeño delay para que se actualice el DOM
		setTimeout(() => focusSaveButton(item), 100)
	}
}

// Enfocar el botón Guardar para un ensayo específico
function focusSaveButton(item) {
	if (!item || !item.testnr) return
	const button = saveButtonRefs.value[item.testnr]
	if (button && typeof button.focus === 'function') {
		button.focus()
	}
}

// Helper: formatear USTER_TESTNR a 5 dígitos con padding
function padUsterTestnr(value) {
	if (!value) return ''
	const numStr = String(value).replace(/\D/g, '').slice(0, 5)
	return numStr ? numStr.padStart(5, '0') : ''
}

// load .PAR and .TBL for a given testnr using the persisted handle (or fallback input files)
async function loadSelectedTensoFiles(testnr) {
	try {
		fileText.value = ''
		tblText.value = ''
		parsedParData.value = {}
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
					// Parse PAR data
					parsedParData.value = parseParText(fileText.value)
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
						// Parse PAR data
						parsedParData.value = parseParText(fileText.value)
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
const parsedParData = ref({})

// Prepared TBL data as it will be sent to the backend (matching saveToOracle mapping)
const preparedTblPreview = computed(() => {
	try {
		return (parsedTblData.value || []).map((row, index) => {
			const husoEnsayos = row[1] && row[1].trim() !== '' ? row[1].trim() : ''
			let husoNumber = null
			if (husoEnsayos) {
				const match = husoEnsayos.match(/^(\d+)\//)
				if (match && match[1]) husoNumber = parseInt(match[1], 10)
			}
			if (!husoNumber || isNaN(husoNumber)) husoNumber = index + 1

			return {
				TESTNR: row[0] || tblTestnr.value,
				HUSO_ENSAYOS: husoEnsayos,
				HUSO_NUMBER: husoNumber,
				TIEMPO_ROTURA: row[2] && row[2].trim() !== '' ? row[2] : '',
				FUERZA_B: row[3] && row[3].trim() !== '' ? row[3] : '',
				ELONGACION: row[4] && row[4].trim() !== '' ? row[4] : '',
				TENACIDAD: row[5] && row[5].trim() !== '' ? row[5] : '',
				TRABAJO: row[6] && row[6].trim() !== '' ? row[6] : ''
			}
		})
	} catch (err) {
		console.warn('preparedTblPreview compute error', err)
		return []
	}
})

// TensoRapid .PAR file field mapping (row, column as specified)
const tensoParFields = [
	{ field: 'CATALOG', row: 3, col: 1 },
	{ field: 'TESTNR', row: 8, col: 5 },
	{ field: 'TIME', row: 9, col: 5 },
	{ field: 'SORTIMENT', row: 10, col: 5 },
	{ field: 'ARTICLE', row: 11, col: 5 },
	{ field: 'MASCHNR', row: 12, col: 5 },
	{ field: 'MATCLASS', row: 13, col: 8 },
	{ field: 'NOMCOUNT', row: 14, col: 5 },
	{ field: 'NOMTWIST', row: 15, col: 5 },
	{ field: 'USCODE', row: 17, col: 8 },
	{ field: 'LABORANT', row: 18, col: 5 },
	{ field: 'COMMENT', row: 19, col: 5 },
	{ field: 'LOTE', row: 20, col: 5 },
	{ field: 'TUNAME', row: 24, col: 5 },
	{ field: 'GROUPS', row: 25, col: 5 },
	{ field: 'WITHIN', row: 26, col: 5 },
	{ field: 'TOTAL', row: 27, col: 5 },
	{ field: 'UNSPOOLGROUPS', row: 29, col: 5 },
	{ field: 'LENGTH', row: 30, col: 5 },
	{ field: 'EXTSPEED', row: 31, col: 5 },
	{ field: 'PRETENSION', row: 32, col: 5 },
	{ field: 'CLAMPPRESSURE', row: 33, col: 5 },
	{ field: 'CYCLEFORCELL', row: 34, col: 5 },
	{ field: 'CYCLEFORCEUL', row: 35, col: 5 },
	{ field: 'NMBOFFORCECYCLES', row: 36, col: 5 },
	{ field: 'CYCLELONGLL', row: 37, col: 5 },
	{ field: 'CYCLELONGUL', row: 38, col: 5 },
	{ field: 'NMBOFELONGCYCLES', row: 39, col: 5 },
	{ field: 'FORCEF1REL', row: 40, col: 5 },
	{ field: 'ELONGATIONE1REL', row: 41, col: 5 },
	{ field: 'EVALTIMEREL', row: 42, col: 5 },
	{ field: 'PRELOADCYCLESREL', row: 43, col: 5 },
	{ field: 'FORCEF1RET', row: 44, col: 5 },
	{ field: 'ELONGATIONE1RET', row: 45, col: 5 },
	{ field: 'EVALTIMERET', row: 46, col: 5 },
	{ field: 'PRELOADCYCLESRET', row: 47, col: 5 }
]

// Parse .PAR file and extract all fields according to tensoParFields mapping
function parseParText(text) {
	const data = {}
	if (!text) return data

	for (const fieldDef of tensoParFields) {
		const value = extractTsvCell(text, fieldDef.row, fieldDef.col)
		data[fieldDef.field] = value != null ? String(value).trim() : ''
	}

	return data
}

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

	const totalFound = Object.values(map).length
	// Consultar BD inmediatamente para obtener estado guardado antes de renderizar la lista
	try {
		const backendUrl = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
			? 'http://localhost:3001'
			: ''
		const endpoint = backendUrl + '/api/tensorapid/status'
		const testnrs = Object.values(map).map(it => it.testnr)
		if (testnrs.length > 0) {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ testnrs }),
				credentials: 'include'
			})
			if (response.ok) {
				const data = await response.json()
				const existingSet = new Set(data.existing || [])
				const details = data.details || {}
				// Marcar en el map
				Object.values(map).forEach(item => {
					item.saved = existingSet.has(item.testnr)
					item.isEditing = false // Asegurar que no esté en modo edición
					item.usterTestnr = padUsterTestnr(details[item.testnr]?.usterTestnr || '')
				})
			}
		}
	} catch (err) {
		console.warn('Error checking tensorapid status (pre-assign):', err)
	}

	// ahora asignar la lista ya con flags de "saved"
	tensoScanList.value = Object.values(map).sort((a, b) => a.testnr.localeCompare(b.testnr))
	// estado inicial con números si están disponibles
	const savedCnt = Object.values(map).reduce((acc, it) => acc + (it.saved ? 1 : 0), 0)
	tensoScanStatus.value = formatScanStatus(totalFound, savedCnt, filterMode.value)

	// Verificar cuáles ensayos ya están guardados en la BD
	if (tensoScanList.value.length > 0) {
		try {
			const backendUrl = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
				? 'http://localhost:3001'
				: ''
			const endpoint = backendUrl + '/api/tensorapid/status'
			const testnrs = tensoScanList.value.map(item => item.testnr)

			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ testnrs }),
				credentials: 'include'
			})

			if (response.ok) {
				const data = await response.json()
				const existingSet = new Set(data.existing || [])
				const details = data.details || {}

				// Marcar ensayos guardados y cargar USTER_TESTNR desde BD
				tensoScanList.value.forEach(item => {
					item.saved = existingSet.has(item.testnr)
					item.isEditing = false // Asegurar que no esté en modo edición
					item.usterTestnr = padUsterTestnr(details[item.testnr]?.usterTestnr || '')
				})

				// Actualizar texto de estado con números exactos después de consultar BD
				const total = tensoScanList.value.length
				const savedCount = tensoScanList.value.reduce((acc, it) => acc + (it.saved ? 1 : 0), 0)
				tensoScanStatus.value = formatScanStatus(total, savedCount, filterMode.value)
			}
		} catch (err) {
			console.warn('Error checking tensorapid status:', err)
		}
	}

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
		// Consultar BD inmediatamente para obtener estado guardado antes de asignar
		try {
			const backendUrl = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
				? 'http://localhost:3001'
				: ''
			const endpoint = backendUrl + '/api/tensorapid/status'
			const testnrs = Object.values(map).map(it => it.testnr)
			if (testnrs.length > 0) {
				const response = await fetch(endpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ testnrs }),
					credentials: 'include'
				})
				if (response.ok) {
					const data = await response.json()
					const existingSet = new Set(data.existing || [])
					const details = data.details || {}
					Object.values(map).forEach(item => {
						item.saved = existingSet.has(item.testnr)
						item.isEditing = false // Asegurar que no esté en modo edición
						item.usterTestnr = padUsterTestnr(details[item.testnr]?.usterTestnr || '')
					})
				}
			}
		} catch (err) { console.warn('Error checking tensorapid status (input pre-assign):', err) }

		tensoScanList.value = Object.values(map).sort((a, b) => a.testnr.localeCompare(b.testnr))
		const totalIn = tensoScanList.value.length
		const savedCntIn = tensoScanList.value.reduce((acc, it) => acc + (it.saved ? 1 : 0), 0)
		tensoScanStatus.value = formatScanStatus(totalIn, savedCntIn, filterMode.value)

		// Verificar cuáles ensayos ya están guardados en la BD
		if (tensoScanList.value.length > 0) {
			try {
				const backendUrl = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
					? 'http://localhost:3001'
					: ''
				const endpoint = backendUrl + '/api/tensorapid/status'
				const testnrs = tensoScanList.value.map(item => item.testnr)

				const response = await fetch(endpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ testnrs }),
					credentials: 'include'
				})

				if (response.ok) {
					const data = await response.json()
					const existingSet = new Set(data.existing || [])

					// Marcar ensayos guardados y agregar campo usterTestnr vacío
					tensoScanList.value.forEach(item => {
						item.saved = existingSet.has(item.testnr)
						item.isEditing = false // Asegurar que no esté en modo edición
						item.usterTestnr = ''
					})
				}
			} catch (err) {
				console.warn('Error checking tensorapid status:', err)
			}
		}

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
				tensoScanStatus.value = formatScanStatus(parsed.length, null, filterMode.value)
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
