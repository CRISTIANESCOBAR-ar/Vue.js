<template>
  <main class="w-full h-screen flex flex-col bg-gray-50 overflow-hidden" style="padding: 4px !important;">
    <div class="w-full flex-1 min-h-0 bg-white rounded-lg shadow-xl border border-slate-200 flex flex-col" style="padding: 12px !important;">
      <div class="flex flex-col gap-2 mb-3 flex-shrink-0">
        <div class="flex items-center gap-3 justify-between">
          <div class="flex items-center gap-2 border border-slate-200 bg-white text-slate-700 rounded-md shadow-sm" style="padding: 0.375rem 1rem;">
            <label class="text-sm font-medium shrink-0">Calidad:</label>
            <select v-model="selectedQLD" class="text-sm border-0 focus:outline-none focus:ring-0 bg-transparent cursor-pointer">
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
            
            <div class="h-4 w-px bg-slate-300 mx-1"></div>
            
            <label class="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="showDirecNormal" class="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span>Normal</span>
            </label>
            
            <label class="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="showDirec70" class="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span>70</span>
            </label>
            
            <label class="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="showBloqueados" class="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span>Bloq</span>
            </label>
          </div>

          <div class="flex items-center gap-3">
            <label class="text-sm font-semibold text-slate-700 shrink-0">Carpeta del archivo de stock:</label>
          
            <div class="w-[100px] shrink-0">
              <div 
                class="border border-slate-300 rounded-lg bg-white text-sm text-slate-800 truncate shadow-sm"
                :title="selectedFolderPath"
                style="padding: 0.5rem 0.75rem;"
              >
                {{ selectedFolderPath || 'Ninguna carpeta seleccionada' }}
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button 
                @click="selectFolder" 
                class="inline-flex items-center gap-2 border border-slate-200 bg-white text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors duration-150 shadow-sm hover:shadow-md"
                style="padding: 0.25rem 0.75rem;"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7a2 2 0 012-2h3l2 3h6a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                </svg>
                Seleccionar
              </button>

              <input
                ref="fileInputRef"
                type="file"
                webkitdirectory
                directory
                multiple
                @change="handleFolderSelectFallback"
                class="hidden"
              />

              <button
                v-if="hasPersistedHandle"
                @click="refreshFolder"
                :disabled="isProcessing"
                class="inline-flex items-center gap-2 border border-slate-200 bg-white text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm hover:shadow-md"
                style="padding: 0.25rem 0.75rem;"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refrescar
              </button>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 text-sm text-slate-600 justify-end">
          <span v-if="lastUpdate" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700">
            <span class="font-medium">Última actualización:</span>
            <span>{{ formatDate(lastUpdate) }}</span>
          </span>
        </div>
      </div>

      <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.29 14.32A2 2 0 003.34 21h17.32a2 2 0 001.71-2.82L14.08 3.86a2 2 0 00-3.46 0z" />
        </svg>
        <span>{{ error }}</span>
      </div>

      <div v-if="fileData" class="flex-1 min-h-0 flex flex-col">
        <div class="flex flex-col xl:flex-row gap-4 flex-1 min-h-0">
          <div class="flex flex-col" style="width: 480px;">
            <div class="overflow-auto _minimal-scroll flex-1 min-h-0 rounded-lg border border-slate-200 shadow-sm">
              <table class="w-full table-fixed divide-y divide-slate-200 text-xs">
                <colgroup>
                  <col style="width: 75px" />
                  <col style="width: 105px" />
                  <col style="width: 25px" />
                  <col style="width: 30px" />
                  <col style="width: 45px" />
                  <col style="width: 45px" />
                  <col style="width: 45px" />
                  <col style="width: 45px" />
                </colgroup>
                <thead class="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-20">
                  <tr>
                    <th class="text-xs font-semibold text-slate-600 text-left" style="padding: 0.25rem 0.5rem 0.25rem 1rem;">Artículo</th>
                    <th class="text-xs font-semibold text-slate-600 text-left" style="padding: 0.25rem 0.75rem;">Nombre</th>
                    <th class="text-xs font-semibold text-slate-600 text-center" style="padding: 0.25rem 0.75rem;">Cal</th>
                    <th class="text-xs font-semibold text-slate-600 text-center" style="padding: 0.25rem 0.75rem;">Part.</th>
                    <th class="text-xs font-semibold text-slate-600 text-right" style="padding: 0.25rem 0.75rem;">Metros</th>
                    <th class="text-xs font-semibold text-slate-600 text-right" style="padding: 0.25rem 0.75rem;">Confe</th>
                    <th class="text-xs font-semibold text-slate-600 text-right" style="padding: 0.25rem 0.75rem;">Mayo</th>
                    <th class="text-xs font-semibold text-slate-600 text-right" style="padding: 0.25rem 0.75rem;">70</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr
                    v-for="(row, rowIndex) in filteredData"
                    :key="rowIndex"
                    @click="selectRow(row)"
                    :class="[
                      'cursor-pointer transition-colors duration-150 hover:bg-blue-50/50',
                      selectedRow && selectedRow.ARTIGO === row.ARTIGO && selectedRow.NOME_MERCADO === row.NOME_MERCADO ? 'bg-blue-50/70 font-semibold text-slate-800' : 'bg-white'
                    ]"
                  >
                    <td class="text-left text-slate-700 truncate" style="padding: 0.25rem 0.5rem 0.25rem 1rem;">{{ formatArticulo(row.ARTIGO) }}</td>
                    <td class="text-left text-slate-700 truncate" style="padding: 0.25rem 0.75rem;" :title="row.NOME_MERCADO">{{ row.NOME_MERCADO }}</td>
                    <td class="text-center text-slate-700" style="padding: 0.25rem 0.75rem;">{{ row.QLD }}</td>
                    <td class="text-center text-slate-700" style="padding: 0.25rem 0.75rem;">{{ row.CANTIDAD_PARTIDAS }}</td>
                    <td class="text-right text-slate-700" style="padding: 0.25rem 0.75rem;">{{ formatMetros(row.METROS) }}</td>
                    <td class="text-right text-slate-700" style="padding: 0.25rem 0.75rem;">{{ formatMetros(row.CONFECCIONISTA) }}</td>
                    <td class="text-right text-slate-700" style="padding: 0.25rem 0.75rem;">{{ formatMetros(row.MAYORISTA) }}</td>
                    <td class="text-right text-slate-700" style="padding: 0.25rem 0.75rem;">{{ formatMetros(row.SETENTA) }}</td>
                  </tr>
                  <tr v-if="filteredData.length === 0">
                    <td colspan="8" class="px-3 py-6 text-center text-slate-500">No se encontraron registros con QLD = {{ selectedQLD }}.</td>
                  </tr>
                </tbody>
                <tfoot v-if="filteredData.length > 0" class="bg-slate-50 border-t-2 border-slate-300">
                  <tr class="font-semibold">
                    <td class="text-left text-slate-700" style="padding: 0.25rem 0.5rem 0.25rem 1rem;"></td>
                    <td class="text-left text-slate-700" style="padding: 0.25rem 0.75rem;">{{ filteredData.length }}</td>
                    <td class="text-center text-slate-700" style="padding: 0.25rem 0.75rem;"></td>
                    <td class="text-center text-slate-700" style="padding: 0.25rem 0.75rem;">{{ totalPartidas }}</td>
                    <td class="text-right text-slate-700" style="padding: 0.25rem 0.75rem;">{{ formatMetros(totalMetros) }}</td>
                    <td class="text-right text-slate-700" style="padding: 0.25rem 0.75rem;">{{ formatMetros(totalConfeccionista) }}</td>
                    <td class="text-right text-slate-700" style="padding: 0.25rem 0.75rem;">{{ formatMetros(totalMayorista) }}</td>
                    <td class="text-right text-slate-700" style="padding: 0.25rem 0.75rem;">{{ formatMetros(totalSetenta) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div v-if="selectedRow" class="w-full max-w-xs flex flex-col">
            <div class="overflow-auto _minimal-scroll flex-1 rounded-lg border border-slate-200 shadow-sm">
              <table class="min-w-full table-fixed divide-y divide-slate-200 text-xs">
                <colgroup>
                  <col style="width: 8.5rem" />
                  <col style="width: 3.5rem" />
                  <col style="width: 5.5rem" />
                </colgroup>
                <thead class="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-10">
                  <tr>
                    <th class="px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-600 text-center">Partida</th>
                    <th class="px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-600 text-center">Dir</th>
                    <th class="px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-600 text-right">Metros</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr
                    v-for="(detail, detailIndex) in partidaDetail"
                    :key="detailIndex"
                    @click="selectPartida(detail)"
                    :class="[
                      'cursor-pointer transition-colors duration-150 hover:bg-blue-50/50',
                      selectedPartida && selectedPartida.PARTIDA === detail.PARTIDA && selectedPartida.DIREC === detail.DIREC ? 'bg-blue-50/70 font-semibold text-slate-800' : 'bg-white'
                    ]"
                  >
                    <td class="px-3 py-2 text-center text-slate-700 truncate">{{ formatPartida(detail.PARTIDA) }}</td>
                    <td class="px-3 py-2 text-center text-slate-700">{{ detail.DIREC || '—' }}</td>
                    <td class="px-3 py-2 text-right text-slate-700">{{ formatMetros(detail.METROS) }}</td>
                  </tr>
                </tbody>
                <tfoot class="bg-slate-50">
                  <tr>
                    <td colspan="2" class="px-3 py-2 text-center text-slate-600 font-semibold uppercase tracking-[0.18em]">Total</td>
                    <td class="px-3 py-2 text-right text-slate-700 font-semibold">{{ formatMetros(totalMetrosPartida) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div v-if="selectedPartida" class="w-full max-w-xs flex flex-col">
            <div class="overflow-auto _minimal-scroll flex-1 rounded-xl border border-slate-200 shadow-sm">
              <table class="min-w-full table-fixed divide-y divide-slate-200 text-xs">
                <colgroup>
                  <col style="width: 7rem" />
                  <col style="width: 5.5rem" />
                </colgroup>
                <thead class="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-10">
                  <tr>
                    <th class="px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-600 text-center">SEQ</th>
                    <th class="px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-600 text-right">Metros</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="(registro, regIndex) in registrosPartida" :key="regIndex" class="bg-white">
                    <td class="px-3 py-2 text-center text-slate-700">{{ registro.SEQ }}</td>
                    <td class="px-3 py-2 text-right text-slate-700">{{ formatMetros(registro.METROS) }}</td>
                  </tr>
                </tbody>
                <tfoot class="bg-slate-50">
                  <tr>
                    <td class="px-3 py-2 text-center text-slate-600 font-semibold uppercase tracking-[0.18em]">Total ({{ registrosPartida.length }})</td>
                    <td class="px-3 py-2 text-right text-slate-700 font-semibold">{{ formatMetros(totalMetrosRegistros) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-1 items-center justify-center text-center text-slate-600">
        <div class="flex flex-col items-center gap-3">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m7-7H5" />
            </svg>
          </div>
          <p class="text-base font-semibold">Selecciona un archivo XLSX para comenzar</p>
          <p class="text-sm text-slate-500">Los datos se guardan automáticamente en tu navegador.</p>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useExcelReader } from '../composables/useExcelReader'
import { useLocalStorage } from '../composables/useLocalStorage'

const { readExcelFile } = useExcelReader()
const { data, loadData, saveData, clearData } = useLocalStorage()

const fileInputRef = ref(null)
const selectedFile = ref(null)
const selectedFolderPath = ref(null)
const selectedDirHandle = ref(null)
const hasPersistedHandle = ref(false)
const fileData = ref(null)
const isProcessing = ref(false)
const error = ref(null)
const lastUpdate = ref(null)
const selectedRow = ref(null)
const selectedPartida = ref(null)

// Filtros de checkbox
const showBloqueados = ref(false)
const showDirec70 = ref(true)
const showDirecNormal = ref(true)
const selectedQLD = ref('1')

// Datos filtrados y agrupados
const filteredData = computed(() => {
  if (!fileData.value || !fileData.value.data || fileData.value.data.length < 2) {
    return []
  }

  const headers = fileData.value.data[0]
  const rows = fileData.value.data.slice(1)

  // Encontrar índices de las columnas
  const artigoIdx = headers.findIndex(h => h === 'ARTIGO')
  const nomeMercadoIdx = headers.findIndex(h => h === 'NOME_MERCADO')
  const qldIdx = headers.findIndex(h => h === 'QLD')
  const direcIdx = headers.findIndex(h => h === 'DIREC')
  const partidaIdx = headers.findIndex(h => h === 'PARTIDA')
  const metrosIdx = headers.findIndex(h => h === 'METROS')
  const pontIdx = headers.findIndex(h => h === 'PONT')
  const bloqIdx = headers.findIndex(h => h === 'BLOQ')

  if (artigoIdx === -1 || nomeMercadoIdx === -1 || qldIdx === -1 || direcIdx === -1 || partidaIdx === -1 || metrosIdx === -1) {
    error.value = 'No se encontraron todas las columnas requeridas: ARTIGO, NOME_MERCADO, QLD, DIREC, PARTIDA, METROS'
    return []
  }

  // Filtrar por QLD = 1, DIREC vacío o 70, BLOQ vacío, y agrupar por ARTIGO + NOME_MERCADO
  const grouped = {}
  
  rows.forEach(row => {
    const qld = row[qldIdx]
    const direc = row[direcIdx]
    const bloq = bloqIdx !== -1 ? row[bloqIdx] : ''
    
    // Filtro: QLD debe coincidir con selectedQLD, aplicar filtro BLOQ según checkbox
    const direcStr = String(direc || '').trim()
    const bloqStr = String(bloq || '').trim()
    
    // Aplicar filtros de checkboxes para DIREC
    const isDirec70 = direcStr === '70'
    const isDirecNormal = direcStr === ''
    
    // Aplicar filtro BLOQ: si showBloqueados es false, solo mostrar registros no bloqueados
    const isBloqueado = bloqStr !== ''
    const passBloqFilter = showBloqueados.value ? true : !isBloqueado
    
    if (qld == selectedQLD.value && 
        passBloqFilter &&
        ((isDirec70 && showDirec70.value) || (isDirecNormal && showDirecNormal.value))) {
      
      const artigo = row[artigoIdx] || ''
      const nomeMercado = row[nomeMercadoIdx] || ''
      const partida = row[partidaIdx] || ''
      const metros = parseFloat(row[metrosIdx]) || 0
      const pont = pontIdx !== -1 ? parseFloat(row[pontIdx]) || 0 : 0

      // Crear clave única para agrupar (ARTIGO + NOME_MERCADO)
      const key = `${artigo}|${nomeMercado}`

      if (!grouped[key]) {
        grouped[key] = {
          ARTIGO: artigo,
          NOME_MERCADO: nomeMercado,
          QLD: qld,
          CANTIDAD_PARTIDAS: 0,
          PARTIDAS: new Set(),
          METROS: 0,
          CONFECCIONISTA: 0,  // METROS >= 50 Y PONT <= 20
          MAYORISTA: 0,        // METROS >= 50 Y PONT > 21
          SETENTA: 0           // METROS >= 50 Y DIREC = '70'
        }
      }

      // Contar partidas únicas
      grouped[key].PARTIDAS.add(partida)
      grouped[key].CANTIDAD_PARTIDAS = grouped[key].PARTIDAS.size
      
      // Sumar metros totales
      grouped[key].METROS += metros

      // Calcular columnas condicionales
      if (metros >= 50) {
        // Columna 70: solo registros con DIREC = "70" y METROS >= 50
        if (direcStr === '70') {
          grouped[key].SETENTA += metros
        }
        
        if (pont <= 20) {
          grouped[key].CONFECCIONISTA += metros
        } else if (pont > 21) {
          grouped[key].MAYORISTA += metros
        }
      }
    }
  })

  // Convertir objeto a array y limpiar el Set de partidas
  return Object.values(grouped).map(item => {
    const { PARTIDAS, ...rest } = item
    return rest
  })
})

// Total de metros
const totalMetros = computed(() => {
  return filteredData.value.reduce((sum, row) => sum + row.METROS, 0)
})

// Total de partidas
const totalPartidas = computed(() => {
  return filteredData.value.reduce((sum, row) => sum + row.CANTIDAD_PARTIDAS, 0)
})

// Total confeccionista
const totalConfeccionista = computed(() => {
  return filteredData.value.reduce((sum, row) => sum + row.CONFECCIONISTA, 0)
})

// Total mayorista
const totalMayorista = computed(() => {
  return filteredData.value.reduce((sum, row) => sum + row.MAYORISTA, 0)
})

// Total setenta
const totalSetenta = computed(() => {
  return filteredData.value.reduce((sum, row) => sum + row.SETENTA, 0)
})

// Detalle por partida de la fila seleccionada
const partidaDetail = computed(() => {
  if (!selectedRow.value || !fileData.value || !fileData.value.data || fileData.value.data.length < 2) {
    return []
  }

  const headers = fileData.value.data[0]
  const rows = fileData.value.data.slice(1)

  const artigoIdx = headers.findIndex(h => h === 'ARTIGO')
  const nomeMercadoIdx = headers.findIndex(h => h === 'NOME_MERCADO')
  const qldIdx = headers.findIndex(h => h === 'QLD')
  const direcIdx = headers.findIndex(h => h === 'DIREC')
  const partidaIdx = headers.findIndex(h => h === 'PARTIDA')
  const metrosIdx = headers.findIndex(h => h === 'METROS')

  if (artigoIdx === -1 || nomeMercadoIdx === -1 || qldIdx === -1 || direcIdx === -1 || partidaIdx === -1 || metrosIdx === -1) {
    return []
  }

  // Filtrar filas que coincidan con la selección y agrupar por PARTIDA y DIREC
  const grouped = {}
  
  rows.forEach(row => {
    const artigo = row[artigoIdx] || ''
    const nomeMercado = row[nomeMercadoIdx] || ''
    const qld = row[qldIdx]
    const direc = row[direcIdx]
    const partida = row[partidaIdx] || ''
    const metros = parseFloat(row[metrosIdx]) || 0

    const direcStr = String(direc || '').trim()
    
    // Filtrar por la fila seleccionada (solo ARTIGO y NOME_MERCADO)
    if (artigo === selectedRow.value.ARTIGO && 
        nomeMercado === selectedRow.value.NOME_MERCADO && 
        qld == 1 &&
        (direcStr === '' || direcStr === '70')) {
      
      // Crear clave única para agrupar por PARTIDA + DIREC
      const key = `${partida}|${direcStr}`

      if (!grouped[key]) {
        grouped[key] = {
          PARTIDA: partida,
          DIREC: direcStr,
          METROS: 0
        }
      }

      grouped[key].METROS += metros
    }
  })

  // Convertir a array y ordenar por PARTIDA
  return Object.values(grouped).sort((a, b) => {
    if (a.PARTIDA < b.PARTIDA) return -1
    if (a.PARTIDA > b.PARTIDA) return 1
    return 0
  })
})

// Total metros de la partida seleccionada
const totalMetrosPartida = computed(() => {
  return partidaDetail.value.reduce((sum, row) => sum + row.METROS, 0)
})

// Detalle de registros individuales de la partida seleccionada
const registrosPartida = computed(() => {
  if (!selectedPartida.value || !selectedRow.value || !fileData.value || !fileData.value.data || fileData.value.data.length < 2) {
    return []
  }

  const headers = fileData.value.data[0]
  const rows = fileData.value.data.slice(1)

  const artigoIdx = headers.findIndex(h => h === 'ARTIGO')
  const nomeMercadoIdx = headers.findIndex(h => h === 'NOME_MERCADO')
  const qldIdx = headers.findIndex(h => h === 'QLD')
  const direcIdx = headers.findIndex(h => h === 'DIREC')
  const partidaIdx = headers.findIndex(h => h === 'PARTIDA')
  const metrosIdx = headers.findIndex(h => h === 'METROS')

  if (artigoIdx === -1 || nomeMercadoIdx === -1 || qldIdx === -1 || direcIdx === -1 || partidaIdx === -1 || metrosIdx === -1) {
    return []
  }

  // Encontrar todas las columnas disponibles
  const allColumns = headers

  // Filtrar registros que coincidan con la fila y partida seleccionadas
  const registros = []
  
  rows.forEach(row => {
    const artigo = row[artigoIdx] || ''
    const nomeMercado = row[nomeMercadoIdx] || ''
    const qld = row[qldIdx]
    const direc = row[direcIdx]
    const partida = row[partidaIdx] || ''
    const metros = parseFloat(row[metrosIdx]) || 0

    const direcStr = String(direc || '').trim()
    
    // Filtrar por la fila y partida seleccionadas
    if (artigo === selectedRow.value.ARTIGO && 
        nomeMercado === selectedRow.value.NOME_MERCADO && 
        qld == selectedRow.value.QLD &&
        partida === selectedPartida.value.PARTIDA &&
        direcStr === selectedPartida.value.DIREC &&
        (direcStr === '' || direcStr === '70')) {
      
      // Crear objeto con todas las columnas
      const registro = {}
      headers.forEach((header, idx) => {
        registro[header] = row[idx]
      })
      
      registros.push(registro)
    }
  })

  return registros
})

// Total metros de los registros de la partida seleccionada
const totalMetrosRegistros = computed(() => {
  return registrosPartida.value.reduce((sum, row) => sum + (parseFloat(row.METROS) || 0), 0)
})

// --- File System Access API + IndexedDB helpers ---
function openDb() {
  return new Promise((resolve, reject) => {
    let req
    try {
      req = window.indexedDB.open('analisis-stock-db')
    } catch (err) {
      return reject(err)
    }
    req.onupgradeneeded = () => {
      const db = req.result
      try {
        if (!db.objectStoreNames.contains('handles')) db.createObjectStore('handles')
      } catch (e) {
        console.warn('openDb onupgradeneeded error', e)
      }
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
    const r = store.put(dirHandle, 'stockDir')
    r.onsuccess = () => resolve(true)
    r.onerror = () => reject(r.error)
  })
}

async function getDirHandleFromIDB() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readonly')
    const store = tx.objectStore('handles')
    const r = store.get('stockDir')
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

async function verifyPermission(handle, mode = 'read') {
  if (!handle) return false
  try {
    const opts = { mode }
    if (await handle.queryPermission(opts) === 'granted') return true
    if (await handle.requestPermission(opts) === 'granted') return true
  } catch (err) {
    console.warn('verifyPermission error', err)
  }
  return false
}

async function selectFolder() {
  try {
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      // Usar File System Access API
      const dirHandle = await window.showDirectoryPicker()
      
      // Guardar el handle en IndexedDB
      try {
        await saveDirHandleToIDB(dirHandle)
        hasPersistedHandle.value = true
      } catch (err) {
        console.warn('saveDirHandleToIDB failed', err)
      }
      
      selectedFolderPath.value = dirHandle.name || 'Carpeta seleccionada'
      selectedDirHandle.value = dirHandle
      
      // Procesar el archivo
      await processFileFromHandle(dirHandle)
      return
    }
  } catch (err) {
    console.warn('selectFolder error', err)
  }
  
  // Fallback: usar input webkitdirectory
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

async function processFileFromHandle(dirHandle) {
  try {
    // Buscar el archivo estoquePecas.xlsx en la carpeta
    let fileHandle = null
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === 'file' && name === 'estoquePecas.xlsx') {
        fileHandle = handle
        break
      }
    }
    
    if (!fileHandle) {
      error.value = 'No se encontró el archivo "estoquePecas.xlsx" en la carpeta seleccionada.'
      return
    }
    
    // Leer el archivo
    const file = await fileHandle.getFile()
    selectedFile.value = file
    error.value = null
    
    await parseAndStore(file)
  } catch (err) {
    error.value = `Error al procesar la carpeta: ${err.message}`
    console.error(err)
  }
}

async function refreshFolder() {
  if (!selectedDirHandle.value) {
    // Intentar cargar desde IndexedDB
    try {
      const dirHandle = await getDirHandleFromIDB()
      if (!dirHandle) {
        error.value = 'No hay carpeta guardada. Por favor, selecciona una carpeta primero.'
        return
      }
      
      const ok = await verifyPermission(dirHandle, 'read')
      if (!ok) {
        error.value = 'No se concedieron permisos de lectura. Por favor, selecciona la carpeta nuevamente.'
        hasPersistedHandle.value = false
        return
      }
      
      selectedDirHandle.value = dirHandle
      selectedFolderPath.value = dirHandle.name || 'Carpeta seleccionada'
      hasPersistedHandle.value = true
    } catch (err) {
      error.value = 'Error al cargar la carpeta guardada. Por favor, selecciona una carpeta nuevamente.'
      console.error(err)
      return
    }
  }
  
  await processFileFromHandle(selectedDirHandle.value)
}

async function handleFolderSelectFallback(event) {
  const files = event.target.files
  if (!files || files.length === 0) return

  // Obtener la ruta de la carpeta desde el primer archivo
  const firstFile = files[0]
  if (firstFile.webkitRelativePath) {
    const parts = firstFile.webkitRelativePath.split('/')
    if (parts.length > 0) {
      selectedFolderPath.value = parts[0]
    }
  }

  // Buscar el archivo estoquePecas.xlsx
  let targetFile = null
  for (let i = 0; i < files.length; i++) {
    if (files[i].name === 'estoquePecas.xlsx') {
      targetFile = files[i]
      break
    }
  }

  if (targetFile) {
    selectedFile.value = targetFile
    error.value = null
    hasPersistedHandle.value = false
    await parseAndStore(targetFile)
  } else {
    error.value = 'No se encontró el archivo "estoquePecas.xlsx" en la carpeta seleccionada.'
    selectedFile.value = null
    selectedFolderPath.value = null
  }
}

onMounted(async () => {
  const savedData = loadData()
  if (savedData) {
    fileData.value = savedData
    lastUpdate.value = savedData.lastUpdate
    if (savedData.folderPath) {
      selectedFolderPath.value = savedData.folderPath
    }
  }
  
  // Intentar cargar el handle persistido
  try {
    const dirHandle = await getDirHandleFromIDB()
    if (dirHandle) {
      const ok = await verifyPermission(dirHandle, 'read')
      if (ok) {
        selectedDirHandle.value = dirHandle
        selectedFolderPath.value = dirHandle.name || selectedFolderPath.value
        hasPersistedHandle.value = true
        
        // Cargar automáticamente el archivo
        await processFileFromHandle(dirHandle)
      } else {
        hasPersistedHandle.value = false
        console.log('La carpeta guardada no tiene permisos de lectura.')
      }
    }
  } catch (err) {
    console.warn('Error al cargar handle guardado:', err)
  }
})

const parseAndStore = async (file) => {
  if (!file) return
  isProcessing.value = true
  error.value = null

  try {
    const result = await readExcelFile(file)
    fileData.value = result

    const dataToSave = {
      ...result,
      fileName: file.name,
      folderPath: selectedFolderPath.value
    }
    const saved = saveData(dataToSave)
    if (saved) {
      lastUpdate.value = data.value?.lastUpdate || new Date().toISOString()
    }
  } catch (err) {
    error.value = `Error al procesar el archivo: ${err.message}`
    console.error(err)
  } finally {
    isProcessing.value = false
  }
}

const clearAllData = () => {
  if (confirm('¿Estás seguro de que deseas eliminar todos los datos guardados?')) {
    clearData()
    fileData.value = null
    selectedFile.value = null
    selectedFolderPath.value = null
    selectedDirHandle.value = null
    hasPersistedHandle.value = false
    lastUpdate.value = null
    selectedRow.value = null
    selectedPartida.value = null
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

const formatMetros = (value) => {
  const rounded = Math.round(value)
  return rounded.toLocaleString('es-ES', { useGrouping: true })
}

const formatArticulo = (artigo) => {
  if (!artigo) return ''
  const str = String(artigo)
  if (str.length > 10) {
    return str.slice(0, 10) + ' ' + str.slice(10)
  }
  return str
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const selectRow = (row) => {
  selectedRow.value = row
  selectedPartida.value = null // Resetear partida seleccionada al cambiar de fila
}

const selectPartida = (partida) => {
  selectedPartida.value = partida
}

const formatPartida = (partida) => {
  if (!partida) return ''
  const partidaStr = String(partida)
  // Quitar el primer carácter (5)
  const withoutFirst = partidaStr.substring(1)
  // Aplicar máscara: #-####.##
  // Ejemplo: 0539018 -> 0-5390.18
  if (withoutFirst.length >= 7) {
    const part1 = withoutFirst[0] // primer dígito
    const part2 = withoutFirst.substring(1, 5) // siguientes 4 dígitos
    const part3 = withoutFirst.substring(5, 7) // últimos 2 dígitos
    return `${part1}-${part2}.${part3}`
  }
  return withoutFirst
}


</script>

<style scoped>
:global(._minimal-scroll) {
  scrollbar-width: thin;
  scrollbar-color: rgba(99, 102, 241, 0.35) transparent;
}

:global(._minimal-scroll::-webkit-scrollbar) {
  width: 8px;
}

:global(._minimal-scroll::-webkit-scrollbar-track) {
  background: transparent;
}

:global(._minimal-scroll::-webkit-scrollbar-thumb) {
  background: rgba(99, 102, 241, 0.35);
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: padding-box;
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.14);
  transition: background 160ms linear, box-shadow 160ms linear;
}

:global(._minimal-scroll::-webkit-scrollbar-thumb:hover) {
  background: rgba(99, 102, 241, 0.65);
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.24);
}

:global(._minimal-scroll::-webkit-scrollbar-thumb:active) {
  box-shadow: 0 0 16px rgba(99, 102, 241, 0.28);
}
</style>
