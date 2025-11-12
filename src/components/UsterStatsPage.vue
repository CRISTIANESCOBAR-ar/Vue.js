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
            <!-- Encabezado con selector y estadísticas en una línea -->
            <div class="bg-white rounded shadow px-4 py-3 mb-3 flex-shrink-0">
                <div class="flex flex-wrap items-center gap-4">
                    <div class="flex items-center gap-2">
                        <span class="font-semibold text-lg">Gráfico de Control de Titulo Ne:</span>
                        <select v-model="selectedNomcount"
                            class="px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold">
                            <option :value="null">-- Seleccione --</option>
                            <option v-for="nomcount in availableNomcounts" :key="nomcount" :value="nomcount">
                                {{ nomcount }}
                            </option>
                        </select>
                    </div>

                    <template v-if="selectedNomcount">
                        <div class="flex items-center gap-1">
                            <span class="text-slate-600">TESTNR:</span>
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
                    variableLabel="TITULO" />
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
const isLoading = ref(false)
const error = ref(null)

// Selected NOMCOUNT
const selectedNomcount = ref(null)

// Fetch data from backend
async function fetchData() {
    isLoading.value = true
    error.value = null
    try {
        const backendUrl = (typeof window !== 'undefined' && window.location.hostname === 'localhost') ? 'http://localhost:3001' : ''

        const [usterTblRes, usterParRes] = await Promise.all([
            fetch(backendUrl + '/api/uster/tbl', { credentials: 'include' }),
            fetch(backendUrl + '/api/uster/par', { credentials: 'include' })
        ])

        if (!usterTblRes.ok || !usterParRes.ok) throw new Error('Error al cargar datos')

        const usterTblData = await usterTblRes.json()
        const usterParData = await usterParRes.json()

        usterTbl.value = usterTblData.rows || []
        usterPar.value = usterParData.rows || []
    } catch (err) {
        console.error('Error fetching data:', err)
        error.value = err.message
    } finally {
        isLoading.value = false
    }
}

// Get unique NOMCOUNT values
const availableNomcounts = computed(() => {
    const nomcounts = new Set()
    for (const row of usterPar.value) {
        if (row.NOMCOUNT != null && row.NOMCOUNT !== '') {
            nomcounts.add(row.NOMCOUNT)
        }
    }
    return Array.from(nomcounts).sort((a, b) => {
        const numA = parseFloat(a)
        const numB = parseFloat(b)
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB
        return String(a).localeCompare(String(b))
    })
})

// Get TESTNRs for selected NOMCOUNT
const filteredTestnrs = computed(() => {
    if (!selectedNomcount.value) return []
    return usterPar.value
        .filter(row => row.NOMCOUNT === selectedNomcount.value)
        .map(row => row.TESTNR)
        .filter(Boolean)
})

// Process data: group by TESTNR and compute stats for TITULO (filtered by selected NOMCOUNT)
const stats = computed(() => {
    if (!selectedNomcount.value) return []

    // Filter TESTNR based on selected NOMCOUNT
    const validTestnrs = new Set(filteredTestnrs.value)

    // Group rows by TESTNR (only for TESTNRs matching selected NOMCOUNT)
    const grouped = {}

    for (const row of usterTbl.value) {
        const testnr = row.TESTNR
        if (!testnr || !validTestnrs.has(testnr)) continue

        // Parse TITULO as number
        const titulo = parseFloat(row.TITULO)
        if (isNaN(titulo)) continue

        if (!grouped[testnr]) {
            grouped[testnr] = []
        }
        grouped[testnr].push(titulo)
    }

    // Compute mean for each TESTNR
    const result = []
    for (const [testnr, values] of Object.entries(grouped)) {
        if (values.length === 0) continue

        const mean = values.reduce((sum, v) => sum + v, 0) / values.length

        result.push({
            testnr,
            n: values.length,
            mean,
            values
        })
    }

    // Sort by TESTNR
    result.sort((a, b) => String(a.testnr).localeCompare(String(b.testnr)))

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
