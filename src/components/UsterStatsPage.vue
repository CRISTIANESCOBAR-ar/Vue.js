<template>
    <div class="p-4 h-screen flex flex-col">
        <div v-if="isLoading" class="text-center py-12">
            <div class="text-slate-600 text-lg">Cargando datos...</div>
        </div>

        <div v-else-if="error" class="text-center py-12">
            <div class="text-red-600 mb-4">Error: {{ error }}</div>
            <button @click="fetchData" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                Reintentar
            </button>
        </div>

        <div v-else class="flex flex-col h-full">
            <!-- Encabezado con selectores y estadísticas en una línea -->
            <div class="bg-white rounded shadow px-4 py-3 mb-3 flex-shrink-0">
                <div class="flex flex-wrap items-center gap-4">
                    <div class="flex items-center gap-2">
                        <span class="font-semibold text-lg">Gráfico de Control de {{ currentVariableLabel }}:</span>
                        <select v-model="selectedNomcount"
                            class="px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold">
                            <option :value="null">-- Seleccione NOMCOUNT --</option>
                            <option v-for="item in availableNomcounts" :key="item.display" :value="item">
                                {{ item.display }}
                            </option>
                        </select>
                        <select v-model="selectedVariable"
                            class="px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option v-for="variable in availableVariables" :key="variable.key" :value="variable.key">
                                {{ variable.label }}
                            </option>
                        </select>
                    </div>

                    <template v-if="selectedNomcount">
                        <div class="flex items-center gap-1">
                            <span class="text-slate-600">Ensayos:</span>
                            <span class="font-semibold">{{ stats.length }}</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="text-slate-600">Media Global:</span>
                            <span class="font-semibold">{{ globalMean.toFixed(1) }}</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="text-slate-600">UCL:</span>
                            <span class="font-semibold text-red-600">{{ globalUcl.toFixed(1) }}</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="text-slate-600">LCL:</span>
                            <span class="font-semibold text-blue-600">{{ globalLcl.toFixed(1) }}</span>
                        </div>
                    </template>
                </div>
            </div>

            <!-- Mostrar mensaje si no hay NOMCOUNT seleccionado -->
            <div v-if="!selectedNomcount" class="text-center py-8 text-slate-500">
                Por favor seleccione un título nominal para ver el gráfico de control
            </div>

            <!-- Gráfico maximizado -->
            <div v-else class="bg-white rounded shadow p-4 flex-1 flex flex-col min-h-0">
                <StatsChart :stats="stats" :globalMean="globalMean" :globalUcl="globalUcl" :globalLcl="globalLcl"
                    :variableLabel="currentVariableLabel" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import StatsChart from './uster-stats/StatsChart.vue'

// Data fetched from backend
const usterTbl = ref([])
const usterPar = ref([])
const tensorapidTbl = ref([])
const tensorapidPar = ref([])
const isLoading = ref(false)
const error = ref(null)

// Selected NOMCOUNT and variable
// selectedNomcount is now an object: { display: '9.5F', nomcount: 9.5, matclass: 'Hilo de fantasia' } or { display: '9', nomcount: 9, matclass: null }
const selectedNomcount = ref(null)
const selectedVariable = ref('TITULO')

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
    { key: 'FUERZA_B', label: 'Fuerza B', source: 'tensorapid' },
    { key: 'ELONGACION', label: 'Elongación %', source: 'tensorapid' },
    { key: 'TENACIDAD', label: 'Tenacidad', source: 'tensorapid' },
    { key: 'TRABAJO', label: 'Trabajo', source: 'tensorapid' }
]

// Fetch data from backend
async function fetchData() {
    isLoading.value = true
    error.value = null
    try {
        const backendUrl = (typeof window !== 'undefined' && window.location.hostname === 'localhost') ? 'http://localhost:3001' : ''

        const [usterTblRes, usterParRes, tensorapidTblRes, tensorapidParRes] = await Promise.all([
            fetch(backendUrl + '/api/uster/tbl', { credentials: 'include' }),
            fetch(backendUrl + '/api/uster/par', { credentials: 'include' }),
            fetch(backendUrl + '/api/tensorapid/tbl', { credentials: 'include' }),
            fetch(backendUrl + '/api/tensorapid/par', { credentials: 'include' })
        ])

        if (!usterTblRes.ok || !usterParRes.ok) throw new Error('Error al cargar datos')

        const usterTblData = await usterTblRes.json()
        const usterParData = await usterParRes.json()

        usterTbl.value = usterTblData.rows || []
        usterPar.value = usterParData.rows || []

        // Load TENSORAPID data (optional, may not exist for all cases)
        if (tensorapidTblRes.ok) {
            const tensorapidTblData = await tensorapidTblRes.json()
            tensorapidTbl.value = tensorapidTblData.rows || []
        }
        
        if (tensorapidParRes.ok) {
            const tensorapidParData = await tensorapidParRes.json()
            tensorapidPar.value = tensorapidParData.rows || []
        }
    } catch (err) {
        console.error('Error fetching data:', err)
        error.value = err.message
    } finally {
        isLoading.value = false
    }
}

// Get current variable label for display
const currentVariableLabel = computed(() => {
    const variable = availableVariables.find(v => v.key === selectedVariable.value)
    return variable ? variable.label : selectedVariable.value
})

// Get unique NOMCOUNT values with "F" suffix for "Hilo de fantasia"
const availableNomcounts = computed(() => {
    // Map to store unique combinations of NOMCOUNT + MATCLASS
    const map = new Map()

    for (const row of usterPar.value) {
        if (row.NOMCOUNT == null || row.NOMCOUNT === '') continue

        const nomcount = row.NOMCOUNT
        const matclass = row.MATCLASS || null
        const isFantasia = matclass && String(matclass).toLowerCase().includes('fantasia')

        // Create a unique key: nomcount + matclass (or empty for non-fantasia)
        const key = isFantasia ? `${nomcount}|${matclass}` : `${nomcount}|`

        if (!map.has(key)) {
            const display = isFantasia ? `${nomcount}F` : String(nomcount)
            map.set(key, { display, nomcount, matclass: isFantasia ? matclass : null })
        }
    }

    // Sort by numeric value of nomcount
    return Array.from(map.values()).sort((a, b) => {
        const numA = parseFloat(a.nomcount)
        const numB = parseFloat(b.nomcount)
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB
        return String(a.nomcount).localeCompare(String(b.nomcount))
    })
})

// Get TESTNRs for selected NOMCOUNT (with MATCLASS filter for "Hilo de fantasia")
const filteredTestnrs = computed(() => {
    if (!selectedNomcount.value) return []

    const selected = selectedNomcount.value
    const nomcountValue = selected.nomcount
    const matclassValue = selected.matclass

    return usterPar.value
        .filter(row => {
            // Match NOMCOUNT
            if (row.NOMCOUNT !== nomcountValue) return false

            // If matclass is specified (fantasia), also match MATCLASS
            if (matclassValue) {
                const rowMatclass = row.MATCLASS || ''
                return String(rowMatclass).toLowerCase().includes('fantasia')
            }

            // For non-fantasia, no additional filter needed
            return true
        })
        .map(row => row.TESTNR)
        .filter(Boolean)
})

// Process data: group by TESTNR and compute stats (handles both USTER and TENSORAPID variables)
const stats = computed(() => {
    if (!selectedNomcount.value) return []

    // Determine if the selected variable is from TENSORAPID
    const currentVar = availableVariables.find(v => v.key === selectedVariable.value)
    const isTensorapid = currentVar && currentVar.source === 'tensorapid'

    // Filter TESTNR based on selected NOMCOUNT
    const validTestnrs = new Set(filteredTestnrs.value)

    // Build USTER_TESTNR to TENSORAPID_TESTNR mapping
    const usterToTensorMap = new Map()
    if (isTensorapid) {
        console.log('🔍 TENSORAPID mode activated')
        console.log('validTestnrs:', Array.from(validTestnrs))
        console.log('tensorapidPar.value length:', tensorapidPar.value.length)
        console.log('tensorapidTbl.value length:', tensorapidTbl.value.length)
        
        for (const parRow of tensorapidPar.value) {
            if (parRow.USTER_TESTNR && parRow.TESTNR) {
                if (!usterToTensorMap.has(parRow.USTER_TESTNR)) {
                    usterToTensorMap.set(parRow.USTER_TESTNR, [])
                }
                usterToTensorMap.get(parRow.USTER_TESTNR).push(parRow.TESTNR)
            }
        }
        console.log('usterToTensorMap size:', usterToTensorMap.size)
        console.log('usterToTensorMap sample:', Array.from(usterToTensorMap.entries()).slice(0, 3))
    }

    // Group rows by TESTNR
    const grouped = {}

    if (isTensorapid) {
        // For TENSORAPID variables: iterate over USTER TESTNRs, find corresponding TENSORAPID TESTNRs
        console.log('🔎 Processing TENSORAPID data...')
        for (const usterTestnr of validTestnrs) {
            const tensorTestnrs = usterToTensorMap.get(usterTestnr) || []
            console.log(`USTER ${usterTestnr} → TENSOR ${tensorTestnrs}`)
            
            for (const tensorTestnr of tensorTestnrs) {
                // Find all TENSORAPID_TBL rows for this TESTNR
                const tensorRows = tensorapidTbl.value.filter(r => r.TESTNR === tensorTestnr)
                console.log(`  TENSOR ${tensorTestnr}: found ${tensorRows.length} rows`)
                
                for (const row of tensorRows) {
                    const variableValue = parseFloat(row[selectedVariable.value])
                    console.log(`    ${selectedVariable.value} = ${row[selectedVariable.value]} → ${variableValue}`)
                    if (isNaN(variableValue)) continue

                    // Group by USTER_TESTNR (not TENSORAPID TESTNR) to align with dates
                    if (!grouped[usterTestnr]) {
                        grouped[usterTestnr] = { values: [], timestamps: [] }
                    }
                    grouped[usterTestnr].values.push(variableValue)
                }
            }
            
            // Get timestamp from USTER_PAR
            const parRow = usterPar.value.find(p => p.TESTNR === usterTestnr)
            if (parRow && parRow.TIME_STAMP && grouped[usterTestnr]) {
                grouped[usterTestnr].timestamps.push(parRow.TIME_STAMP)
            }
        }
        console.log('✅ Grouped data:', Object.keys(grouped).length, 'TESTNRs')
    } else {
        // For USTER variables: use existing logic
        for (const row of usterTbl.value) {
            const testnr = row.TESTNR
            if (!testnr || !validTestnrs.has(testnr)) continue

            // Parse selected variable as number
            const variableValue = parseFloat(row[selectedVariable.value])
            if (isNaN(variableValue)) continue

            if (!grouped[testnr]) {
                grouped[testnr] = { values: [], timestamps: [] }
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
            timestampFmt
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
})

</script>

<style scoped>
/* Basic responsive tweaks; the layout uses CSS grid for responsiveness */
</style>
