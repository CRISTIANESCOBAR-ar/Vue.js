<template>
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog"
        aria-modal="true">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm z-40"
            @click="$emit('close')" aria-hidden="true"></div>

        <!-- Modal content -->
        <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col p-4 z-50 relative"
            style="height: 600px;" role="document" ref="modalRef">
            <header class="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 flex-shrink-0">
                <div class="flex flex-col gap-1">
                    <h3 class="text-xl font-bold text-slate-800">Detalle por Huso - {{ variableLabel }}</h3>
                    <div class="flex items-center gap-4 text-sm text-slate-600">
                        <span>Ensayo: <span class="font-semibold text-slate-900">{{ testnr }}</span></span>
                        <span v-if="timestamp">Fecha: <span class="font-semibold text-slate-900">{{ timestamp
                                }}</span></span>
                        <span v-if="oe">OE: <span class="font-semibold text-slate-900">{{ oe }}</span></span>
                        <span v-if="standardNe">Ne Estándar: <span class="font-semibold text-slate-900">{{ standardNe }}</span></span>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <!-- Copy as image button -->
                    <button @click="copyAsImage" type="button"
                        v-tippy="{ content: 'Copiar como imagen para WhatsApp', placement: 'bottom', theme: 'custom' }"
                        class="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-all duration-200 group shadow-sm hover:shadow-md"
                        aria-label="Copiar como imagen">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>

                    <!-- Close button -->
                    <button @click="$emit('close')" type="button"
                        class="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:border-red-400 hover:bg-red-50 flex items-center justify-center text-slate-600 hover:text-red-600 transition-all duration-200 shadow-sm hover:shadow-md"
                        aria-label="Cerrar">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </header>

            <!-- Stats cards -->
            <div class="grid grid-cols-4 gap-3 mb-4 flex-shrink-0">
                <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                    <div class="text-xs text-slate-600 mb-1">Promedio</div>
                    <div class="text-lg font-bold text-slate-900">{{ formatValue(stats.mean) }}</div>
                </div>
                <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                    <div class="text-xs text-slate-600 mb-1">Desv. Est. (σ)</div>
                    <div class="text-lg font-bold text-slate-900">{{ formatValue(stats.sd) }}</div>
                </div>
                <div class="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-200">
                    <div class="text-xs text-slate-600 mb-1">CV %</div>
                    <div class="text-lg font-bold text-slate-900">{{ formatValue(stats.cv) }}</div>
                </div>
                <div class="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-200">
                    <div class="text-xs text-slate-600 mb-1">Rango</div>
                    <div class="text-lg font-bold text-slate-900">{{ formatValue(stats.range) }}</div>
                </div>
            </div>

            <!-- Chart -->
            <div class="flex-1 min-h-0 border border-slate-200 rounded-xl p-3 bg-slate-50 overflow-hidden">
                <div ref="chartRef" class="w-full h-full"></div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { toPng } from 'html-to-image'
import Swal from 'sweetalert2'

const props = defineProps({
    visible: { type: Boolean, default: false },
    values: { type: Array, default: () => [] },
    husoNumbers: { type: Array, default: () => [] },
    testnr: { type: String, default: '' },
    timestamp: { type: String, default: '' },
    oe: { type: String, default: '' },
    variableLabel: { type: String, default: '' },
    standardNe: { type: [String, Number], default: '' }
})

const emit = defineEmits(['close'])

const chartRef = ref(null)
const modalRef = ref(null)
let chart = null

// Calculate statistics
const stats = ref({
    mean: 0,
    sd: 0,
    cv: 0,
    lcl: 0,
    ucl: 0,
    min: 0,
    max: 0,
    range: 0
})

function calculateStats() {
    if (!props.values || props.values.length === 0) {
        stats.value = { mean: 0, sd: 0, cv: 0, lcl: 0, ucl: 0, min: 0, max: 0, range: 0 }
        return
    }

    const n = props.values.length
    const mean = props.values.reduce((sum, v) => sum + v, 0) / n
    const variance = props.values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n
    const sd = Math.sqrt(variance)
    const cv = mean !== 0 ? (sd / mean) * 100 : 0
    const min = Math.min(...props.values)
    const max = Math.max(...props.values)
    const range = max - min

    stats.value = {
        mean,
        sd,
        cv,
        lcl: mean - 3 * sd,
        ucl: mean + 3 * sd,
        min,
        max,
        range
    }
}

function formatValue(val) {
    if (val == null || isNaN(val)) return '—'
    return val.toFixed(2)
}

function renderChart() {
    if (!chart || !props.values || props.values.length === 0) return

    const xData = props.husoNumbers.length > 0 
        ? props.husoNumbers.map(n => `Huso ${n}`)
        : props.values.map((_, i) => `Huso ${i + 1}`)
    const yData = props.values

    // Check if this is Titulo Ne variable
    const isTituloNe = props.variableLabel && props.variableLabel.toLowerCase().includes('titulo')
    const neStandard = props.standardNe ? parseFloat(props.standardNe) : null

    // Calculate y-axis range dynamically
    let allValues = [...yData, stats.value.lcl, stats.value.ucl]
    
    // Add Ne standard values to range calculation if applicable
    if (isTituloNe && neStandard) {
        allValues.push(neStandard, neStandard * 0.985, neStandard * 1.015)
    }
    
    const minValue = Math.min(...allValues)
    const maxValue = Math.max(...allValues)
    const range = maxValue - minValue
    const padding = range * 0.15 // 15% padding
    const yMin = minValue - padding
    const yMax = maxValue + padding

    // Build legend data
    const legendData = ['Valor', 'Promedio', 'LCL (-3σ)', 'UCL (+3σ)']
    if (isTituloNe && neStandard) {
        legendData.push('Ne Estándar', 'Ne Min (-1.5%)', 'Ne Max (+1.5%)')
    }

    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: (params) => {
                const param = params[0]
                return `${param.name}<br/>${props.variableLabel}: <strong>${param.value.toFixed(2)}</strong>`
            }
        },
        legend: {
            data: legendData,
            bottom: 0,
            left: 'center'
        },
        grid: { left: '8%', right: '4%', top: '8%', bottom: 60, containLabel: false },
        xAxis: {
            type: 'category',
            data: xData,
            axisLabel: { rotate: 0, interval: 0 }
        },
        yAxis: {
            type: 'value',
            min: yMin,
            max: yMax,
            axisLabel: {
                formatter: (value) => value.toFixed(2)
            }
        },
        series: [
            {
                name: 'Valor',
                type: 'line',
                data: yData,
                smooth: false,
                symbol: 'circle',
                symbolSize: 10,
                itemStyle: { color: '#3b82f6' },
                lineStyle: { width: 2.5 }
            },
            {
                name: 'Promedio',
                type: 'line',
                data: Array(xData.length).fill(stats.value.mean),
                lineStyle: { type: 'solid', color: '#10b981', width: 2 },
                showSymbol: false
            },
            {
                name: 'LCL (-3σ)',
                type: 'line',
                data: Array(xData.length).fill(stats.value.lcl),
                lineStyle: { type: 'dashed', color: '#ef4444', width: 2 },
                showSymbol: false
            },
            {
                name: 'UCL (+3σ)',
                type: 'line',
                data: Array(xData.length).fill(stats.value.ucl),
                lineStyle: { type: 'dashed', color: '#ef4444', width: 2 },
                showSymbol: false
            }
        ]
    }

    // Add Ne Estándar lines only for Titulo Ne
    if (isTituloNe && neStandard) {
        option.series.push(
            {
                name: 'Ne Estándar',
                type: 'line',
                data: Array(xData.length).fill(neStandard),
                lineStyle: { type: 'solid', color: '#8b5cf6', width: 2.5 },
                showSymbol: false,
                z: 3
            },
            {
                name: 'Ne Min (-1.5%)',
                type: 'line',
                data: Array(xData.length).fill(neStandard * 0.985),
                lineStyle: { type: 'dashed', color: '#f59e0b', width: 2 },
                showSymbol: false,
                z: 2
            },
            {
                name: 'Ne Max (+1.5%)',
                type: 'line',
                data: Array(xData.length).fill(neStandard * 1.015),
                lineStyle: { type: 'dashed', color: '#f59e0b', width: 2 },
                showSymbol: false,
                z: 2
            }
        )
    }

    chart.setOption(option)
}

async function copyAsImage() {
    try {
        if (!modalRef.value) return

        // Hide buttons temporarily
        const copyBtn = modalRef.value.querySelector('[aria-label="Copiar como imagen"]')
        const closeBtn = modalRef.value.querySelector('[aria-label="Cerrar"]')

        const originalCopyVis = copyBtn ? copyBtn.style.visibility : ''
        const originalCloseVis = closeBtn ? closeBtn.style.visibility : ''

        if (copyBtn) copyBtn.style.visibility = 'hidden'
        if (closeBtn) closeBtn.style.visibility = 'hidden'

        await new Promise(resolve => setTimeout(resolve, 100))

        const dataUrl = await toPng(modalRef.value, {
            quality: 1.0,
            pixelRatio: 2,
            backgroundColor: '#ffffff'
        })

        // Restore buttons
        if (copyBtn) copyBtn.style.visibility = originalCopyVis
        if (closeBtn) closeBtn.style.visibility = originalCloseVis

        // Convert to blob and copy
        const blob = await (await fetch(dataUrl)).blob()
        await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
        ])

        Swal.fire({
            icon: 'success',
            title: '¡Copiado!',
            text: 'La imagen se copió al portapapeles. Puedes pegarla en WhatsApp.',
            timer: 2000,
            showConfirmButton: false
        })
    } catch (err) {
        console.error('Error copying image:', err)
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo copiar la imagen.'
        })
    }
}

watch(() => props.visible, async (newVal) => {
    if (newVal) {
        calculateStats()
        await nextTick()
        
        // Wait for DOM to be fully rendered with dimensions
        const tryInitChart = async (retries = 5) => {
            for (let i = 0; i < retries; i++) {
                await nextTick()
                if (chartRef.value && chartRef.value.clientWidth > 0 && chartRef.value.clientHeight > 0) {
                    if (!chart) {
                        chart = echarts.init(chartRef.value)
                    }
                    renderChart()
                    return
                }
                await new Promise(resolve => setTimeout(resolve, 50))
            }
            console.warn('[HusoDetailModal] Could not initialize chart after retries')
        }
        
        tryInitChart()
    }
})

watch(() => props.values, () => {
    if (props.visible) {
        calculateStats()
        renderChart()
    }
}, { deep: true })

onMounted(() => {
    if (props.visible && chartRef.value) {
        chart = echarts.init(chartRef.value)
        calculateStats()
        renderChart()
    }
})

onBeforeUnmount(() => {
    if (chart) {
        chart.dispose()
        chart = null
    }
})
</script>

<style scoped>
/* Modal styles are inherited from parent */
</style>
