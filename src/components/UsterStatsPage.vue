<template>
    <div class="w-full h-screen flex flex-col p-1 overflow-hidden">
        <!-- Debug badge desarrollo -->
        <div v-if="showDebug"
            class="fixed bottom-2 right-2 z-50 bg-black/70 text-white text-xs px-2 py-1 rounded shadow">
            w: {{ viewportWidth }} | isMobile: {{ isMobile }}
        </div>

        <main
            class="w-full flex-1 min-h-0 bg-white rounded-2xl shadow-xl px-4 py-3 border border-slate-200 flex flex-col overflow-hidden">
            <div v-if="isLoading" class="text-center py-12 flex-1">
                <div class="text-slate-600 text-lg">Cargando datos...</div>
            </div>

            <div v-else-if="error" class="text-center py-12 flex-1">
                <div class="text-red-600 mb-4">Error: {{ error }}</div>
                <button @click="fetchData" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                    Reintentar
                </button>
            </div>

            <!-- Layout móvil (<768px) -->
            <template v-else-if="isMobile">
                <div class="flex flex-col h-full">
                    <!-- Fila 1: Ne (4ch) + Ver (métrica flexible) -->
                    <div class="mb-2 flex items-center gap-3 w-full flex-shrink-0">
                        <span class="text-sm text-slate-600 shrink-0">Ne:</span>
                        <select v-model="selectedNomcount" class="px-1 py-1 border rounded-md text-sm shrink-0"
                            style="width:9.5ch;min-width:9.5ch;max-width:9.5ch;">
                            <option :value="null">-</option>
                            <option v-for="nomcount in availableNomcounts" :key="nomcount" :value="nomcount">
                                {{ nomcount }}
                            </option>
                        </select>
                        <span class="text-sm text-slate-600 shrink-0">OE:</span>
                        <select v-model="selectedOe" :disabled="!selectedNomcount"
                            class="px-1 py-1 border rounded-md text-sm shrink-0"
                            style="width:7ch;min-width:7ch;max-width:7ch;">
                            <option :value="null">Todos</option>
                            <option v-for="oe in availableOes" :key="oe" :value="oe">
                                {{ oe }}
                            </option>
                        </select>
                        <span class="text-sm text-slate-600 shrink-0">Ver:</span>
                        <select v-model="selectedVariable"
                            class="px-1 py-1 border rounded-md text-sm flex-1 min-w-0 max-w-full overflow-hidden text-ellipsis">
                            <option v-for="variable in availableVariables" :key="variable.key" :value="variable.key">
                                {{ variable.label }}
                            </option>
                        </select>
                    </div>
                    <!-- Fila 2: LCL, Prom., UCL -->
                    <div v-if="selectedNomcount"
                        class="mb-3 flex items-center gap-4 text-slate-700 text-xs flex-wrap flex-shrink-0">
                        <div class="whitespace-nowrap"><span class="font-semibold">LCL:</span> <span
                                class="text-blue-600 font-semibold">{{ globalLcl.toFixed(1) }}</span></div>
                        <div class="whitespace-nowrap"><span class="font-semibold">Prom.:</span> {{
                            globalMean.toFixed(1) }}</div>
                        <div class="whitespace-nowrap"><span class="font-semibold">UCL:</span> <span
                                class="text-red-600 font-semibold">{{ globalUcl.toFixed(1) }}</span></div>
                        <div class="whitespace-nowrap"><span class="font-semibold">Ensayos:</span> {{ stats.length }}
                        </div>
                    </div>
                    <!-- Mensaje si no hay Ne seleccionado -->
                    <div v-if="!selectedNomcount" class="text-center py-8 text-slate-500 flex-1">
                        Por favor seleccione un título nominal para ver el gráfico de control
                    </div>
                    <!-- Gráfico maximizado -->
                    <div v-else class="flex-1 flex flex-col min-h-0 overflow-hidden">
                        <div class="flex-1 min-h-0 overflow-hidden">
                            <StatsChart :stats="stats" :globalMean="globalMean" :globalUcl="globalUcl"
                                :globalLcl="globalLcl" :variableLabel="currentVariableLabel" />
                        </div>
                    </div>
                </div>
            </template>

            <!-- Layout escritorio (>=768px) -->
            <div v-else class="flex flex-col h-full">
                <!-- Encabezado con orden: Ne, Ver, LCL, Promedio, UCL, Total de ensayos -->
                <div class="bg-slate-50 rounded shadow-sm px-3 py-2 mb-3 flex-shrink-0 border border-slate-200">
                    <div class="flex flex-wrap items-center gap-3">
                        <!-- Data Source Toggle con iconos + tooltips (oculto en móvil) -->
                        <div class="hidden md:flex items-center gap-1 mr-3 border-r border-slate-200 pr-3">
                            <button @click="changeDataSource('oracle')" :disabled="!isLocalhost"
                                v-tippy="{ content: isLocalhost ? 'Datos desde Oracle (Localhost)' : 'Oracle solo disponible en localhost', placement: 'bottom', theme: 'custom' }"
                                :aria-label="'Cambiar a Oracle'" :class="[
                                    'inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors',
                                    dataSource === 'oracle' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                                    !isLocalhost ? 'opacity-50 cursor-not-allowed' : ''
                                ]">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                    <line x1="8" y1="21" x2="16" y2="21"></line>
                                    <line x1="12" y1="17" x2="12" y2="21"></line>
                                </svg>
                            </button>
                            <button @click="changeDataSource('firebase')"
                                v-tippy="{ content: 'Datos desde Firebase (Producción)', placement: 'bottom', theme: 'custom' }"
                                aria-label="Cambiar a Firebase" :class="[
                                    'inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors',
                                    dataSource === 'firebase' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                ]">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24"
                                    fill="currentColor">
                                    <path
                                        d="M3.89 15.672L6.255.461A.542.542 0 017.27.288l2.543 4.771zm16.794 3.692l-2.25-14a.54.54 0 00-.919-.295L3.316 19.365l7.856 4.427a1.621 1.621 0 001.588 0zM14.3 7.147l-1.82-3.482a.542.542 0 00-.96 0L3.53 17.984z" />
                                </svg>
                            </button>
                        </div>

                        <!-- Orden requerido: Ne, OE, Ver, LCL, Promedio, UCL, Total de ensayos -->
                        <div class="flex items-center gap-2">
                            <span class="text-slate-700 text-sm">Ne</span>
                            <select v-model="selectedNomcount"
                                class="px-2 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold min-w-[7.5rem] w-[8.5rem]">
                                <option v-for="nomcount in availableNomcounts" :key="nomcount" :value="nomcount">
                                    {{ nomcount }}
                                </option>
                            </select>
                            <span class="text-slate-700 text-sm">OE</span>
                            <select v-model="selectedOe" :disabled="!selectedNomcount"
                                class="px-2 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[5rem]">
                                <option :value="null">Todos</option>
                                <option v-for="oe in availableOes" :key="oe" :value="oe">
                                    {{ oe }}
                                </option>
                            </select>
                            <span class="text-slate-700 text-sm">Ver</span>
                            <select v-model="selectedVariable"
                                class="px-2 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option v-for="variable in availableVariables" :key="variable.key"
                                    :value="variable.key">
                                    {{ variable.label }}
                                </option>
                            </select>
                        </div>

                        <template v-if="selectedNomcount">
                            <div class="flex items-center gap-1">
                                <span class="text-slate-600">LCL:</span>
                                <span class="font-semibold text-blue-600">{{ globalLcl.toFixed(1) }}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <span class="text-slate-600">Promedio:</span>
                                <span class="font-semibold">{{ globalMean.toFixed(1) }}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <span class="text-slate-600">UCL:</span>
                                <span class="font-semibold text-red-600">{{ globalUcl.toFixed(1) }}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <span class="text-slate-600">Total de ensayos:</span>
                                <span class="font-semibold">{{ stats.length }}</span>
                            </div>
                        </template>
                    </div>
                </div>

                <!-- Mostrar mensaje si no hay NOMCOUNT seleccionado -->
                <div v-if="!selectedNomcount" class="text-center py-8 text-slate-500 flex-1">
                    Por favor seleccione un título nominal para ver el gráfico de control
                </div>

                <!-- Gráfico maximizado -->
                <div v-else class="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <StatsChart :stats="stats" :globalMean="globalMean" :globalUcl="globalUcl" :globalLcl="globalLcl"
                        :variableLabel="currentVariableLabel" />
                </div>
            </div>
        </main>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import StatsChart from './uster-stats/StatsChart.vue'
import { fetchAllStatsData, setDataSource } from '../services/dataService'

// Data fetched from backend
const usterTbl = ref([])
const usterPar = ref([])
const tensorapidTbl = ref([])
const tensorapidPar = ref([])
const isLoading = ref(false)
const error = ref(null)
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
const dataSource = ref(isLocalhost ? 'oracle' : 'firebase') // Forzar firebase en producción

// Runtime flag para layout móvil (<768px) con matchMedia
const showDebug = ref(import.meta?.env?.DEV === true)
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 0)
const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
let mq = null
if (typeof window !== 'undefined') {
    mq = window.matchMedia('(max-width: 767px)')
    isMobile.value = mq.matches
}
function updateIsMobile() {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024
    const mediaMatch = mq ? mq.matches : (width < 768)
    isMobile.value = mediaMatch
}
function handleResize() {
    updateIsMobile()
    viewportWidth.value = typeof window !== 'undefined' ? window.innerWidth : 0
}

// Selected NOMCOUNT and variable
const selectedNomcount = ref(null)
const selectedVariable = ref('TITULO')
const selectedOe = ref(null)

// Available variables for selection
const availableVariables = [
    { key: 'TITULO', label: 'Titulo Ne', source: 'uster' },
    { key: 'CVM_PERCENT', label: 'CVM%', source: 'uster' },
    { key: 'DELG_MINUS30_KM', label: 'Delg -30% (km)', source: 'uster' },
    { key: 'DELG_MINUS40_KM', label: 'Delg -40% (km)', source: 'uster' },
    { key: 'DELG_MINUS50_KM', label: 'Delg -50% (km)', source: 'uster' },
    { key: 'GRUE_35_KM', label: 'Grue +35% (km)', source: 'uster' },
    { key: 'GRUE_50_KM', label: 'Grue +50% (km)', source: 'uster' },
    { key: 'NEPS_140_KM', label: 'Neps +140% (km)', source: 'uster' },
    { key: 'NEPS_280_KM', label: 'Neps +280% (km)', source: 'uster' },
    { key: 'FUERZA_B', label: 'Fuerza B (cN/tex)', source: 'tensorapid' },
    { key: 'ELONGACION', label: 'Elongación (%)', source: 'tensorapid' },
    { key: 'TENACIDAD', label: 'Tenacidad (cN/tex)', source: 'tensorapid' },
    { key: 'TRABAJO', label: 'Trabajo (N*mm)', source: 'tensorapid' }
]

// Fetch data from backend (Oracle or Firebase)
async function fetchData() {
    isLoading.value = true
    error.value = null
    try {
        setDataSource(dataSource.value)
        const data = await fetchAllStatsData()

        usterTbl.value = data.usterTbl || []
        usterPar.value = data.usterPar || []
        tensorapidTbl.value = data.tensorapidTbl || []
        tensorapidPar.value = data.tensorapidPar || []

        console.log(`✅ Datos cargados desde ${data.source}:`, {
            usterPar: usterPar.value.length,
            usterTbl: usterTbl.value.length,
            tensorapidPar: tensorapidPar.value.length,
            tensorapidTbl: tensorapidTbl.value.length
        })
    } catch (err) {
        console.error('Error fetching data:', err)
        error.value = err.message
    } finally {
        isLoading.value = false
    }
}

// Change data source and reload
function changeDataSource(newSource) {
    if (!isLocalhost && newSource === 'oracle') {
        // No permitir cambiar a oracle en producción
        console.warn('La fuente Oracle solo está disponible en entorno local.')
        return
    }
    dataSource.value = newSource
    fetchData()
}

// Get current variable label for display
const currentVariableLabel = computed(() => {
    const variable = availableVariables.find(v => v.key === selectedVariable.value)
    return variable ? variable.label : selectedVariable.value
})

// Helper: formatear Ne con 'Flame' si es hilo de fantasía
function formatNe(nomcount, matclass) {
    if (nomcount == null || nomcount === '') return ''
    let ne = String(nomcount).trim()
    if (matclass && String(matclass).toLowerCase() === 'hilo de fantasia') {
        return ne + 'Flame'
    }
    return ne
}

// Format OE: remove leading zeros and extract first 2 letters
// Example: "0012ABCD" -> "12 AB", "5XY" -> "5 XY", "003 LP" -> "3 LP"
function formatOe(oe) {
    if (!oe) return oe
    const str = String(oe).trim()
    if (!str) return str
    
    // Separar números y letras (con o sin espacio intermedio)
    const match = str.match(/^(\d+)\s*([A-Za-z]+)?/)
    if (!match) return str
    
    const numPart = parseInt(match[1], 10) // Quita ceros a la izquierda
    const letterPart = match[2] ? match[2].substring(0, 2).toUpperCase() : ''
    
    return letterPart ? `${numPart} ${letterPart}` : String(numPart)
}

// Get unique NOMCOUNT values
const availableNomcounts = computed(() => {
    const nomcounts = new Set()
    for (const row of usterPar.value) {
        if (row.NOMCOUNT != null && row.NOMCOUNT !== '') {
            const formattedNe = formatNe(row.NOMCOUNT, row.MATCLASS)
            nomcounts.add(formattedNe)
        }
    }
    return Array.from(nomcounts).sort((a, b) => {
        const numA = parseFloat(a)
        const numB = parseFloat(b)
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB
        return String(a).localeCompare(String(b))
    })
})

// Get unique OEs for selected NOMCOUNT
const availableOes = computed(() => {
    if (!selectedNomcount.value) return []
    const oes = new Set()
    for (const row of usterPar.value) {
        const formattedNe = formatNe(row.NOMCOUNT, row.MATCLASS)
        if (formattedNe === selectedNomcount.value) {
            const oe = row.MASCHNR || row.OE || row.OE_NRO || null
            if (oe != null && oe !== '') {
                oes.add(formatOe(oe))
            }
        }
    }
    return Array.from(oes).sort((a, b) => {
        // Extraer parte numérica para ordenar correctamente
        const numA = parseInt(a) || 0
        const numB = parseInt(b) || 0
        if (numA !== numB) return numA - numB
        return a.localeCompare(b)
    })
})

// Reset selectedOe when selectedNomcount changes
watch(selectedNomcount, () => {
    selectedOe.value = null
})

// Get TESTNRs for selected NOMCOUNT and OE
const filteredTestnrs = computed(() => {
    if (!selectedNomcount.value) return []
    return usterPar.value
        .filter(row => {
            const formattedNe = formatNe(row.NOMCOUNT, row.MATCLASS)
            if (formattedNe !== selectedNomcount.value) return false

            // Si hay OE seleccionado, filtrar por OE
            if (selectedOe.value) {
                const rawOe = row.MASCHNR || row.OE || row.OE_NRO || null
                return formatOe(rawOe) === selectedOe.value
            }
            return true
        })
        .map(row => row.TESTNR)
        .filter(Boolean)
})

// Process data: group by TESTNR and compute stats (filtered by selected NOMCOUNT)
const stats = computed(() => {
    if (!selectedNomcount.value) return []

    // Detect if current variable is from TENSORAPID
    const currentVar = availableVariables.find(v => v.key === selectedVariable.value)
    const isTensorapid = currentVar?.source === 'tensorapid'

    // Filter TESTNR based on selected NOMCOUNT
    const validTestnrs = new Set(filteredTestnrs.value)

    // Group rows by TESTNR (only for TESTNRs matching selected NOMCOUNT)
    const grouped = {}

    if (isTensorapid) {
        // For TENSORAPID variables: map USTER_TESTNR -> TENSORAPID_TESTNR(s)
        const usterToTensorMap = new Map()
        for (const tpar of tensorapidPar.value) {
            const usterTestnr = tpar.USTER_TESTNR
            const tensorTestnr = tpar.TESTNR
            if (!usterTestnr || !tensorTestnr) continue

            if (!usterToTensorMap.has(usterTestnr)) {
                usterToTensorMap.set(usterTestnr, [])
            }
            usterToTensorMap.get(usterTestnr).push(tensorTestnr)
        }

        // For each USTER TESTNR in validTestnrs, find corresponding TENSORAPID TESTNRs
        for (const usterTestnr of validTestnrs) {
            const tensorTestnrs = usterToTensorMap.get(usterTestnr) || []

            for (const row of tensorapidTbl.value) {
                if (!tensorTestnrs.includes(row.TESTNR)) continue

                const variableValue = parseFloat(row[selectedVariable.value])
                if (isNaN(variableValue)) continue

                // Group by USTER_TESTNR (not TENSORAPID TESTNR) for consistent display
                if (!grouped[usterTestnr]) {
                    grouped[usterTestnr] = { values: [], timestamps: [], oe: null }
                }
                grouped[usterTestnr].values.push(variableValue)

                // Get timestamp and OE from USTER_PAR (for consistency across all variables)
                const parRow = usterPar.value.find(p => p.TESTNR === usterTestnr)
                if (parRow) {
                    if (parRow.TIME_STAMP) {
                        grouped[usterTestnr].timestamps.push(parRow.TIME_STAMP)
                    }
                    if (!grouped[usterTestnr].oe) {
                        const rawOe = parRow.MASCHNR || parRow.OE || parRow.OE_NRO || null
                        grouped[usterTestnr].oe = formatOe(rawOe)
                    }
                }
            }
        }
    } else {
        // For USTER variables: process normally
        for (const row of usterTbl.value) {
            const testnr = row.TESTNR
            if (!testnr || !validTestnrs.has(testnr)) continue

            // Parse selected variable as number
            const variableValue = parseFloat(row[selectedVariable.value])
            if (isNaN(variableValue)) continue

            if (!grouped[testnr]) {
                grouped[testnr] = { values: [], timestamps: [], oe: null }
            }
            grouped[testnr].values.push(variableValue)
            // collect TIME_STAMP (if available) for later selection
            let ts = row.TIME_STAMP
            // if TIME_STAMP not present or not parseable, try to fallback to USTER_PAR entry for this TESTNR
            if (!ts) {
                const parRow = usterPar.value.find(p => p.TESTNR === testnr)
                if (parRow && parRow.TIME_STAMP) ts = parRow.TIME_STAMP
            }
            if (ts) grouped[testnr].timestamps.push(ts)
            // Get OE from USTER_PAR if not already set
            if (!grouped[testnr].oe) {
                const parRow = usterPar.value.find(p => p.TESTNR === testnr)
                if (parRow) {
                    const rawOe = parRow.MASCHNR || parRow.OE || parRow.OE_NRO || null
                    grouped[testnr].oe = formatOe(rawOe)
                }
            }
        }
    }

    // helper: robust date parsing from various DB formats
    function parseDateValue(t) {
        if (!t) return null
        if (t instanceof Date) return t
        // numbers -> epoch
        if (typeof t === 'number') return new Date(t)
        const s = String(t).trim()
        if (/^\d+$/.test(s)) {
            const n = Number(s)
            // if looks like epoch seconds or ms
            if (n > 1000000000000) return new Date(n) // ms
            if (n > 1000000000) return new Date(n * 1000) // seconds
        }

        // PRIORITY 1: explicit dd/mm/yyyy HH:mm or dd/mm/yy patterns (European format with optional time)
        let m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s+\d{1,2}:\d{2})?$/)
        if (m) {
            const part1 = Number(m[1])
            const part2 = Number(m[2])
            let year = Number(m[3])
            if (year < 100) year += 2000

            // Disambiguate formats:
            // - if first part > 12 => it's day (dd/mm)
            // - else if second part > 12 => it's day is second (mm/dd)
            // - else ambiguous -> assume European dd/mm (user preference)
            let day, mon
            if (part1 > 12) {
                day = part1
                mon = part2 - 1
            } else if (part2 > 12) {
                // treat as mm/dd
                day = part2
                mon = part1 - 1
            } else {
                // ambiguous: default to European dd/mm
                day = part1
                mon = part2 - 1
            }
            return new Date(year, mon, day)
        }
        // PRIORITY 2: DD-MON-YY like 05-NOV-25 (Oracle format)
        m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/i)
        if (m) {
            const monNames = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 }
            const monStr = m[2].toUpperCase()
            const monIdx = monNames[monStr]
            if (monIdx !== undefined) {
                let year = Number(m[3])
                if (year < 100) year += 2000
                return new Date(year, monIdx, Number(m[1]))
            }
        }

        // PRIORITY 3: ISO formats and other recognized formats (may interpret as American mm/dd)
        // Only use as fallback after explicit European formats checked
        let d = new Date(s)
        if (!isNaN(d.getTime())) return d

        return null
    }

    // Compute mean for each TESTNR
    const result = []
    for (const [testnr, payload] of Object.entries(grouped)) {
        const values = payload.values || []
        if (values.length === 0) continue

        const mean = values.reduce((sum, v) => sum + v, 0) / values.length

        // choose a representative timestamp for this TESTNR: pick earliest available after robust parsing
        let chosenTs = null
        if (payload.timestamps && payload.timestamps.length > 0) {
            const dates = payload.timestamps
                .map(t => parseDateValue(t))
                .filter(Boolean)
            if (dates.length > 0) {
                dates.sort((a, b) => a - b)
                chosenTs = dates[0]
            }
        }

        // format timestamp as dd/mm/yy for display (fallback to TESTNR if missing)
        let timestampFmt = null
        let timestampISO = null
        if (chosenTs) {
            const dd = String(chosenTs.getDate()).padStart(2, '0')
            const mm = String(chosenTs.getMonth() + 1).padStart(2, '0')
            const yy = String(chosenTs.getFullYear()).slice(-2)
            timestampFmt = `${dd}/${mm}/${yy}`
            timestampISO = chosenTs.toISOString()
        }

        result.push({
            testnr,
            n: values.length,
            mean,
            values,
            timestampISO,
            timestampFmt,
            oe: payload.oe || null
        })
    }

    // Sort by timestamp if available, otherwise by TESTNR
    result.sort((a, b) => {
        if (a.timestampISO && b.timestampISO) return String(a.timestampISO).localeCompare(String(b.timestampISO))
        return String(a.testnr).localeCompare(String(b.testnr))
    })

    return result
})

// Compute global statistics over all values
const globalStats = computed(() => {
    const allValues = stats.value.flatMap(s => s.values)

    if (allValues.length === 0) {
        return { mean: 0, sd: 0, ucl: 0, lcl: 0 }
    }

    const mean = allValues.reduce((sum, v) => sum + v, 0) / allValues.length

    const variance = allValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / allValues.length
    const sd = Math.sqrt(variance)

    const ucl = mean + 3 * sd
    const lcl = mean - 3 * sd

    return { mean, sd, ucl, lcl }
})

const globalMean = computed(() => globalStats.value.mean)
const globalUcl = computed(() => globalStats.value.ucl)
const globalLcl = computed(() => globalStats.value.lcl)

onMounted(() => {
    fetchData()
    window.addEventListener('resize', handleResize)
    console.log('[UsterStatsPage] mount width=', viewportWidth.value, 'isMobile=', isMobile.value)
    if (mq) {
        try {
            mq.addEventListener('change', (e) => {
                isMobile.value = e.matches
                viewportWidth.value = typeof window !== 'undefined' ? window.innerWidth : 0
                console.log('[UsterStatsPage] matchMedia change width=', viewportWidth.value, 'isMobile=', isMobile.value)
            })
        } catch { /* ignore */ }
    }
})

onBeforeUnmount(() => {
    try { window.removeEventListener('resize', handleResize) } catch { /* ignore */ }
})

</script>

<style scoped>
/* Basic responsive tweaks; the layout uses CSS grid for responsiveness */
</style>
