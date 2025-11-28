<template>
  <div class="w-full h-screen flex flex-col p-1">
    <main class="w-full flex-1 min-h-0 bg-white rounded-2xl shadow-xl px-4 py-3 border border-slate-200 flex flex-col">
      <div class="flex flex-col gap-2 mb-3 flex-shrink-0">
        <div class="flex items-center gap-2">
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-slate-800 whitespace-nowrap">Carga de Stock</h3>
          <div class="flex-1 flex items-center justify-center gap-2 flex-wrap">
            <label class="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-200 bg-white text-slate-700 rounded-md text-sm font-medium shadow-sm hover:shadow-md cursor-pointer">
              <input type="checkbox" v-model="showDirecNormal" class="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span>Normal</span>
            </label>
            <label class="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-200 bg-white text-slate-700 rounded-md text-sm font-medium shadow-sm hover:shadow-md cursor-pointer">
              <input type="checkbox" v-model="showDirec70" class="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span>70</span>
            </label>
            <label class="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-200 bg-white text-slate-700 rounded-md text-sm font-medium shadow-sm hover:shadow-md cursor-pointer">
              <input type="checkbox" v-model="showBloqueados" class="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span>Bloq</span>
            </label>
          </div>
          <div class="flex items-center gap-2">
            <label for="file-input" class="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors duration-150 shadow-sm hover:shadow-md cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4h5l2 3h9a1 1 0 011 1v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5a1 1 0 011-1z" />
              </svg>
              <span>Seleccionar</span>
            </label>
            <input
              id="file-input"
              ref="fileInputRef"
              type="file"
              accept=".xlsx,.xls"
              @change="handleFileSelect"
              class="hidden"
            />
            <button
              @click="processFile"
              :disabled="!selectedFile || isProcessing"
              class="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-colors duration-150"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-3-6.7" />
                <polyline stroke-linecap="round" stroke-linejoin="round" points="21 3 21 9 15 9" />
              </svg>
              <span>{{ isProcessing ? 'Procesando…' : fileData ? 'Reprocesar' : 'Procesar' }}</span>
            </button>
            <button
              @click="refreshData"
              :disabled="isProcessing || (!selectedFile && !fileData)"
              class="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.93 4.93a10 10 0 0114.14 0l.48.48M4.93 19.07a10 10 0 010-14.14l.48-.48M4 4v5h5" />
              </svg>
              <span>Refrescar</span>
            </button>
            <button
              v-if="fileData"
              @click="clearAllData"
              class="inline-flex items-center gap-2 px-3 py-2 border border-red-200 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition-colors duration-150 shadow-sm hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Limpiar</span>
            </button>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span v-if="selectedFile" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z" />
            </svg>
            <span class="font-medium truncate max-w-[12rem] sm:max-w-xs" :title="selectedFile.name">{{ selectedFile.name }}</span>
          </span>
          <span v-if="fileData" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700">
            <span class="font-medium">Hoja:</span>
            <span>{{ fileData.sheetName }}</span>
          </span>
          <span v-if="fileData" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700">
            <span class="font-medium">Registros únicos:</span>
            <span>{{ filteredData.length }}</span>
          </span>
          <span v-if="fileData" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700">
            <span class="font-medium">Total metros:</span>
            <span>{{ totalMetros.toFixed(2) }}</span>
          </span>
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
        <div class="flex items-center justify-between gap-3 mb-3">
          <h2 class="text-lg font-semibold text-slate-800">Datos filtrados (QLD = 1)</h2>
          <span class="text-xs uppercase tracking-[0.3em] text-slate-400">Vista consolidada</span>
        </div>

        <div class="flex flex-col xl:flex-row gap-4 flex-1 min-h-0">
          <div class="flex-1 min-w-[18rem] flex flex-col">
            <div class="overflow-auto _minimal-scroll flex-1 min-h-0 rounded-xl border border-slate-200 shadow-sm">
              <table class="min-w-full table-fixed divide-y divide-slate-200 text-xs">
                <colgroup>
                  <col style="width: 9rem" />
                  <col style="width: 14rem" />
                  <col style="width: 4rem" />
                  <col style="width: 4.5rem" />
                  <col style="width: 6rem" />
                  <col style="width: 6rem" />
                  <col style="width: 6rem" />
                  <col style="width: 6rem" />
                </colgroup>
                <thead class="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-20">
                  <tr>
                    <th class="px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-600 text-center">Artículo</th>
                    <th class="px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-600 text-left">Nombre</th>
                    <th class="px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-600 text-center">Cal</th>
                    <th class="px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-600 text-center">Part.</th>
                    <th class="px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-600 text-right">Metros</th>
                    <th class="px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-600 text-right">Confec.</th>
                    <th class="px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-600 text-right">Mayor.</th>
                    <th class="px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-600 text-right">70</th>
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
                    <td class="px-3 py-2 text-center text-slate-700 truncate">{{ row.ARTIGO }}</td>
                    <td class="px-3 py-2 text-left text-slate-700 truncate" :title="row.NOME_MERCADO">{{ row.NOME_MERCADO }}</td>
                    <td class="px-3 py-2 text-center text-slate-700">{{ row.QLD }}</td>
                    <td class="px-3 py-2 text-center text-slate-700">{{ row.CANTIDAD_PARTIDAS }}</td>
                    <td class="px-3 py-2 text-right text-slate-700">{{ formatMetros(row.METROS) }}</td>
                    <td class="px-3 py-2 text-right text-slate-700">{{ formatMetros(row.CONFECCIONISTA) }}</td>
                    <td class="px-3 py-2 text-right text-slate-700">{{ formatMetros(row.MAYORISTA) }}</td>
                    <td class="px-3 py-2 text-right text-slate-700">{{ formatMetros(row.SETENTA) }}</td>
                  </tr>
                  <tr v-if="filteredData.length === 0">
                    <td colspan="8" class="px-3 py-6 text-center text-slate-500">No se encontraron registros con QLD = 1.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="selectedRow" class="w-full max-w-xs flex flex-col">
            <div class="overflow-auto _minimal-scroll flex-1 rounded-xl border border-slate-200 shadow-sm">
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
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useExcelReader } from '../composables/useExcelReader'
import { useLocalStorage } from '../composables/useLocalStorage'

const { readExcelFile } = useExcelReader()
const { data, loadData, saveData, clearData } = useLocalStorage()

const fileInputRef = ref(null)
const selectedFile = ref(null)
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
    
    // Filtro: QLD debe ser 1, aplicar filtro BLOQ según checkbox
    const direcStr = String(direc || '').trim()
    const bloqStr = String(bloq || '').trim()
    
    // Aplicar filtros de checkboxes para DIREC
    const isDirec70 = direcStr === '70'
    const isDirecNormal = direcStr === ''
    
    // Aplicar filtro BLOQ: si showBloqueados es false, solo mostrar registros no bloqueados
    const isBloqueado = bloqStr !== ''
    const passBloqFilter = showBloqueados.value ? true : !isBloqueado
    
    if (qld == 1 && 
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

onMounted(() => {
  const savedData = loadData()
  if (savedData) {
    fileData.value = savedData
    lastUpdate.value = savedData.lastUpdate
  }
})

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    error.value = null
  }
}

const parseAndStore = async (file) => {
  if (!file) return
  isProcessing.value = true
  error.value = null

  try {
    const result = await readExcelFile(file)
    fileData.value = result

    const saved = saveData(result)
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

const processFile = async () => {
  if (!selectedFile.value || isProcessing.value) return
  await parseAndStore(selectedFile.value)
}

const refreshData = async () => {
  if (isProcessing.value) return
  if (selectedFile.value) {
    await parseAndStore(selectedFile.value)
  } else {
    const savedData = loadData()
    if (savedData) {
      fileData.value = savedData
      lastUpdate.value = savedData.lastUpdate
    }
  }
}

const clearAllData = () => {
  if (confirm('¿Estás seguro de que deseas eliminar todos los datos guardados?')) {
    clearData()
    fileData.value = null
    selectedFile.value = null
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
