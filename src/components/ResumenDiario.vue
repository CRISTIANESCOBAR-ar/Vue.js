<template>
    <div class="w-full h-screen flex flex-col p-4 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
        <!-- Header -->
        <header class="flex items-center justify-between mb-4 pb-3 border-b border-slate-300">
            <div class="flex items-center gap-4">
                <h1 class="text-2xl font-bold text-slate-800">📊 Resumen Diario - Control de Calidad</h1>
                <div v-if="selectedDate" class="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold">
                    {{ formatDateDisplay(selectedDate) }}
                </div>
            </div>
            
            <div class="flex items-center gap-3">
                <!-- Date selector -->
                <div class="flex items-center gap-2">
                    <label class="text-sm font-medium text-slate-700">Fecha:</label>
                    <input 
                        type="date" 
                        v-model="selectedDate"
                        class="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>
        </header>

        <!-- Loading state -->
        <div v-if="isLoading" class="flex-1 flex items-center justify-center">
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p class="text-slate-600">Cargando datos...</p>
            </div>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="flex-1 flex items-center justify-center">
            <div class="text-center bg-red-50 border border-red-200 rounded-lg p-6">
                <svg class="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-red-800 font-semibold mb-2">Error al cargar datos</p>
                <p class="text-red-600 text-sm">{{ error }}</p>
            </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="groupedData.length === 0" class="flex-1 flex items-center justify-center">
            <div class="text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-8">
                <svg class="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="text-slate-600 font-semibold mb-2">No hay datos para esta fecha</p>
                <p class="text-slate-500 text-sm">Selecciona otra fecha o verifica que haya ensayos registrados</p>
            </div>
        </div>

        <!-- Main content -->
        <div v-else class="flex-1 min-h-0 overflow-hidden flex flex-col">
            <!-- Summary stats -->
            <div class="grid grid-cols-4 gap-3 mb-4">
                <div class="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                    <div class="text-xs text-slate-600 mb-1">Total Ensayos</div>
                    <div class="text-2xl font-bold text-slate-900">{{ totalEnsayos }}</div>
                </div>
                <div class="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                    <div class="text-xs text-slate-600 mb-1">Dentro de Rango</div>
                    <div class="text-2xl font-bold text-green-600">{{ withinRange }}</div>
                </div>
                <div class="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                    <div class="text-xs text-slate-600 mb-1">Fuera de Rango</div>
                    <div class="text-2xl font-bold text-red-600">{{ outOfRange }}</div>
                </div>
                <div class="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                    <div class="text-xs text-slate-600 mb-1">% Conformidad</div>
                    <div class="text-2xl font-bold" :class="conformityPercentage >= 95 ? 'text-green-600' : 'text-orange-600'">
                        {{ conformityPercentage.toFixed(1) }}%
                    </div>
                </div>
            </div>

            <!-- Table container -->
            <div class="flex-1 min-h-0 overflow-auto bg-white rounded-lg border border-slate-200 shadow-sm">
                <table class="w-full text-sm">
                    <thead class="bg-slate-100 sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                            <th class="px-4 py-3 text-left font-semibold text-slate-700 w-24">OE</th>
                            <th class="px-4 py-3 text-left font-semibold text-slate-700 w-28">Ne Estándar</th>
                            <th class="px-4 py-3 text-center font-semibold text-slate-700 w-28">Ne Min (-1.5%)</th>
                            <th class="px-4 py-3 text-center font-semibold text-slate-700 w-28">Ne Max (+1.5%)</th>
                            <th class="px-4 py-3 text-center font-semibold text-slate-700 w-32">Valor Medido</th>
                            <th class="px-4 py-3 text-center font-semibold text-slate-700 w-28">Desviación %</th>
                            <th class="px-4 py-3 text-center font-semibold text-slate-700 w-24">Estado</th>
                            <th class="px-4 py-3 text-left font-semibold text-slate-700">Ensayo</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="(group, idx) in groupedData" :key="idx">
                            <!-- Group header row (OE + Ne) -->
                            <tr class="bg-slate-50 border-t-2 border-slate-300">
                                <td colspan="8" class="px-4 py-2">
                                    <div class="flex items-center gap-3">
                                        <span class="font-bold text-slate-800">OE {{ group.oe }}</span>
                                        <span class="text-slate-600">•</span>
                                        <span class="font-semibold text-slate-700">Ne {{ group.ne }}</span>
                                        <span class="ml-auto text-xs text-slate-600">{{ group.ensayos.length }} ensayo(s)</span>
                                    </div>
                                </td>
                            </tr>
                            <!-- Data rows -->
                            <tr 
                                v-for="ensayo in group.ensayos" 
                                :key="ensayo.testnr"
                                class="border-b border-slate-100 hover:bg-blue-50 transition-colors cursor-pointer"
                                @click="openEnsayoDetail(ensayo.testnr)"
                            >
                                <td class="px-4 py-3 text-slate-600">{{ group.oe }}</td>
                                <td class="px-4 py-3 font-semibold text-slate-800">{{ group.ne }}</td>
                                <td class="px-4 py-3 text-center text-orange-600 font-medium">
                                    {{ formatValue(ensayo.neMin) }}
                                </td>
                                <td class="px-4 py-3 text-center text-orange-600 font-medium">
                                    {{ formatValue(ensayo.neMax) }}
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <span 
                                        class="inline-block px-3 py-1 rounded-lg font-bold text-base"
                                        :class="getStatusClasses(ensayo.status)"
                                    >
                                        {{ formatValue(ensayo.avgTitulo) }}
                                    </span>
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <span 
                                        class="inline-block font-semibold"
                                        :class="ensayo.deviation > 0 ? 'text-red-600' : ensayo.deviation < 0 ? 'text-blue-600' : 'text-slate-600'"
                                    >
                                        {{ ensayo.deviation > 0 ? '+' : '' }}{{ ensayo.deviation.toFixed(2) }}%
                                    </span>
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <span 
                                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold"
                                        :class="getStatusBadgeClasses(ensayo.status)"
                                    >
                                        {{ getStatusText(ensayo.status) }}
                                    </span>
                                </td>
                                <td class="px-4 py-3 text-slate-700 font-mono text-xs">
                                    {{ ensayo.testnr }}
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { fetchAllStatsData } from '../services/dataService'

const isLoading = ref(false)
const error = ref(null)
const selectedDate = ref(getTodayDate())
const usterTbl = ref([])
const usterPar = ref([])

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

// Format date for display (DD/MM/YYYY)
function formatDateDisplay(dateStr) {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
}

// Parse date from various formats
function parseDate(dateValue) {
    if (!dateValue) return null
    
    if (dateValue instanceof Date) {
        return dateValue
    }
    
    if (typeof dateValue === 'string') {
        // Try dd/mm/yyyy format
        const m = dateValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
        if (m) {
            const day = Number(m[1])
            const mon = Number(m[2]) - 1
            let year = Number(m[3])
            if (year < 100) year += 2000
            return new Date(year, mon, day)
        }
        
        // Try ISO format
        const d = new Date(dateValue)
        if (!isNaN(d.getTime())) return d
    }
    
    if (typeof dateValue === 'number') {
        return dateValue > 1000000000000 ? new Date(dateValue) : new Date(dateValue * 1000)
    }
    
    return null
}

// Check if date matches selected date
function dateMatches(dateValue, targetDateStr) {
    const parsed = parseDate(dateValue)
    if (!parsed || isNaN(parsed.getTime())) return false
    
    const [targetYear, targetMonth, targetDay] = targetDateStr.split('-').map(Number)
    
    return (
        parsed.getFullYear() === targetYear &&
        parsed.getMonth() + 1 === targetMonth &&
        parsed.getDate() === targetDay
    )
}

// Format OE (remove leading zeros, extract letters)
function formatOe(oe) {
    if (!oe) return ''
    const str = String(oe).trim()
    const match = str.match(/^(\d+)\s*([A-Za-z]+)?/)
    if (!match) return str
    const numPart = parseInt(match[1], 10)
    const letterPart = match[2] ? match[2].substring(0, 2).toUpperCase() : ''
    return letterPart ? `${numPart} ${letterPart}` : String(numPart)
}

// Fetch data from backend
async function fetchData() {
    isLoading.value = true
    error.value = null
    
    try {
        const data = await fetchAllStatsData()
        usterTbl.value = data.usterTbl || []
        usterPar.value = data.usterPar || []
    } catch (err) {
        error.value = err.message
        console.error('Error fetching data:', err)
    } finally {
        isLoading.value = false
    }
}

// Filter and group data by OE and Ne
const groupedData = computed(() => {
    if (!selectedDate.value || !usterPar.value.length) return []
    
    // Filter ensayos by selected date
    const ensayosForDate = usterPar.value.filter(par => {
        return dateMatches(par.TIME_STAMP, selectedDate.value)
    })
    
    if (ensayosForDate.length === 0) return []
    
    // Calculate average TITULO for each ensayo
    const ensayosWithAvg = ensayosForDate.map(par => {
        const testnr = par.TESTNR
        const rows = usterTbl.value.filter(row => row.TESTNR === testnr)
        
        const titulos = rows
            .map(row => parseFloat(row.TITULO))
            .filter(v => !isNaN(v))
        
        const avgTitulo = titulos.length > 0
            ? titulos.reduce((sum, v) => sum + v, 0) / titulos.length
            : null
        
        const neStandard = par.NOMCOUNT ? parseFloat(par.NOMCOUNT) : null
        const neMin = neStandard ? neStandard * 0.985 : null
        const neMax = neStandard ? neStandard * 1.015 : null
        
        let status = 'unknown'
        let deviation = 0
        
        if (avgTitulo !== null && neStandard !== null) {
            deviation = ((avgTitulo - neStandard) / neStandard) * 100
            
            if (avgTitulo < neMin) {
                status = 'below'
            } else if (avgTitulo > neMax) {
                status = 'above'
            } else {
                status = 'ok'
            }
        }
        
        return {
            testnr,
            oe: formatOe(par.MASCHNR || par.OE),
            ne: par.NOMCOUNT || '',
            avgTitulo,
            neStandard,
            neMin,
            neMax,
            status,
            deviation
        }
    }).filter(e => e.avgTitulo !== null && e.neStandard !== null)
    
    // Group by OE and Ne
    const groups = {}
    
    for (const ensayo of ensayosWithAvg) {
        const key = `${ensayo.oe}|${ensayo.ne}`
        if (!groups[key]) {
            groups[key] = {
                oe: ensayo.oe,
                ne: ensayo.ne,
                ensayos: []
            }
        }
        groups[key].ensayos.push(ensayo)
    }
    
    // Convert to array and sort by OE then Ne
    const result = Object.values(groups)
    
    result.sort((a, b) => {
        // Sort by OE (numeric part)
        const oeA = parseInt(a.oe) || 0
        const oeB = parseInt(b.oe) || 0
        if (oeA !== oeB) return oeA - oeB
        
        // Then by Ne
        const neA = parseFloat(a.ne) || 0
        const neB = parseFloat(b.ne) || 0
        return neA - neB
    })
    
    return result
})

// Summary statistics
const totalEnsayos = computed(() => {
    return groupedData.value.reduce((sum, group) => sum + group.ensayos.length, 0)
})

const withinRange = computed(() => {
    let count = 0
    for (const group of groupedData.value) {
        for (const ensayo of group.ensayos) {
            if (ensayo.status === 'ok') count++
        }
    }
    return count
})

const outOfRange = computed(() => {
    let count = 0
    for (const group of groupedData.value) {
        for (const ensayo of group.ensayos) {
            if (ensayo.status === 'below' || ensayo.status === 'above') count++
        }
    }
    return count
})

const conformityPercentage = computed(() => {
    if (totalEnsayos.value === 0) return 0
    return (withinRange.value / totalEnsayos.value) * 100
})

// Formatting helpers
function formatValue(val) {
    if (val == null || isNaN(val)) return '—'
    return val.toFixed(2)
}

function getStatusClasses(status) {
    switch (status) {
        case 'ok':
            return 'bg-green-100 text-green-800 border border-green-300'
        case 'below':
            return 'bg-blue-100 text-blue-800 border border-blue-300'
        case 'above':
            return 'bg-red-100 text-red-800 border border-red-300'
        default:
            return 'bg-slate-100 text-slate-600 border border-slate-300'
    }
}

function getStatusBadgeClasses(status) {
    switch (status) {
        case 'ok':
            return 'bg-green-100 text-green-800'
        case 'below':
            return 'bg-blue-100 text-blue-800'
        case 'above':
            return 'bg-red-100 text-red-800'
        default:
            return 'bg-slate-100 text-slate-600'
    }
}

function getStatusText(status) {
    switch (status) {
        case 'ok':
            return '✓ OK'
        case 'below':
            return '↓ Bajo'
        case 'above':
            return '↑ Alto'
        default:
            return '?'
    }
}

function openEnsayoDetail(testnr) {
    console.log('TODO: Open detail for', testnr)
    // TODO: Implementar navegación o modal de detalle
}

// Watch date changes
watch(selectedDate, () => {
    // Data is already loaded, just recompute groupedData
})

onMounted(() => {
    fetchData()
})
</script>

<style scoped>
/* Custom scrollbar for table */
.overflow-auto::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

.overflow-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
}

.overflow-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
</style>
