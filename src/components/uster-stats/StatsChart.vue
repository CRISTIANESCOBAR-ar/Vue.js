<template>
    <div class="w-full h-full">
        <div ref="chartRef" class="w-full h-full" style="min-height:260px;"></div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
    stats: { type: Array, default: () => [] },
    globalMean: { type: Number, required: true },
    globalUcl: { type: Number, required: true },
    globalLcl: { type: Number, required: true },
    variableLabel: { type: String, default: '' },
    standardValue: { type: Number, default: null }
})

const emit = defineEmits(['open-ensayo-detail', 'open-huso-detail'])

const chartRef = ref(null)
let chart = null
const hoveredPoint = ref(null) // Rastrear punto actualmente hovereado

function computeOptimalXLabelRotate(labels) {
    try {
        if (!chartRef.value) return 45
        const container = chartRef.value
        const cw = container.clientWidth || container.offsetWidth || 600
        if (!labels || labels.length <= 1) return 0

        // create canvas for text measurement
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        // try to get computed font of container, fallback to 12px sans-serif
        const style = window.getComputedStyle(container)
        const font = style && style.font ? style.font : '12px sans-serif'
        ctx.font = font

        // measure max label width
        let maxW = 0
        labels.forEach(l => {
            const txt = String(l)
            const w = ctx.measureText(txt).width
            if (w > maxW) maxW = w
        })

        const spacing = cw / labels.length

        // add small padding
        const padded = maxW + 6
        // if fits comfortably within spacing, keep horizontal; if marginally fits use 45deg; otherwise use vertical (90deg)
        if (padded <= spacing) return 0
        if (padded <= spacing * 1.6) return 45
        return 90
    } catch {
        return 45
    }
}

function computeRequiredBottomPx(labels, rotateDeg) {
    try {
        if (!chartRef.value) return 60
        const container = chartRef.value
        const style = window.getComputedStyle(container)
        const font = style && style.font ? style.font : '12px sans-serif'
        // extract font-size in px
        const fontSizeMatch = style && style.fontSize ? style.fontSize.match(/(\d+)(px)?/) : null
        const fontSizePx = fontSizeMatch ? parseInt(fontSizeMatch[1], 10) : 12

        // measure max label width
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        ctx.font = font
        let maxW = 0
        labels.forEach(l => {
            const txt = String(l)
            const w = ctx.measureText(txt).width
            if (w > maxW) maxW = w
        })

        const rad = (rotateDeg || 0) * Math.PI / 180

        // rotated bounding box height approximation: |sin(theta)*textWidth| + |cos(theta)*fontSize|
        const rotatedHeight = Math.abs(Math.sin(rad)) * maxW + Math.abs(Math.cos(rad)) * fontSizePx
        // dynamically estimate legend height by simulating legend item layout
        const legendItems = ['Promedio Día', 'Media Global', 'LCL (-3σ)', 'UCL (+3σ)']
        const containerWidth = container.clientWidth || container.offsetWidth || 800
        // available width for legend is container width minus left/right grid margins (3% each)
        const availableWidth = Math.max(200, Math.floor(containerWidth * (1 - 0.03 - 0.03)))
        // measure each legend item width: marker + gap + text
        const markerW = 14 // approximate marker width
        const gap = 8
        const itemPadd = 12
        const measured = legendItems.map(text => {
            const w = ctx.measureText(text).width
            return Math.ceil(markerW + gap + w + itemPadd)
        })

        // simulate wrapping into rows
        let current = 0
        for (let w of measured) {
            if (current + w > availableWidth) {
                current = w // Eliminado rows++ porque no se usa
            } else {
                current += w
            }
        }

        // Calcular espacio para etiquetas X rotadas + espacio generoso para la leyenda (40px) + padding
        const bottom = Math.ceil(rotatedHeight + 55)
        // enforce reasonable min/max - mínimo 80px para asegurar espacio para leyenda
        return Math.max(80, Math.min(bottom, 150))
    } catch {
        return 60
    }
}

function buildOption(data, xLabelRotate = 45) {
    // Use formatted timestamp (dd/mm/yy) as x axis label when available; fallback to TESTNR
    const x = data.map(d => (d.timestampFmt ? d.timestampFmt : d.testnr))
    const y = data.map(d => d.mean)

    // Use global limits (constant across all TESTNR)
    const ucl = Array(x.length).fill(props.globalUcl)
    const lcl = Array(x.length).fill(props.globalLcl)
    const globalMeanLine = Array(x.length).fill(props.globalMean)

    // Calculate Y-axis range considering means and control limits
    const allValues = [...y, props.globalUcl, props.globalLcl, props.globalMean]
    if (props.standardValue != null) {
        allValues.push(props.standardValue)
    }
    let yMin = Math.min(...allValues)
    let yMax = Math.max(...allValues)
    yMin = yMin - 0.1
    yMax = yMax + 0.1

    const isVertical = xLabelRotate === 90

    return {
        tooltip: {
            trigger: 'axis',
            formatter: (params) => {
                if (!params || params.length === 0) return ''

                // Obtener el índice del punto para acceder a los datos originales
                const dataIndex = params[0].dataIndex
                const pointData = data[dataIndex]

                // Fecha formateada y OE (primera línea en negrita)
                const dateLabel = pointData?.timestampFmt || params[0].axisValue
                const oe = pointData?.oe ? ` | OE: ${pointData.oe}` : ''
                let result = `<div style="font-weight: bold; margin-bottom: 4px;">${dateLabel}${oe}</div>`

                // Mostrar cada serie con su color, nombre y valor
                params.forEach(item => {
                    const value = typeof item.value === 'number' ? item.value.toFixed(2) : item.value
                    result += `<div style="display: flex; align-items: center; margin: 2px 0;">
                        ${item.marker} 
                        <span style="margin-left: 4px;">${item.seriesName}: ${value}</span>
                    </div>`
                })

                return result
            }
        },
        // Leyenda centrada y reordenada
        legend: {
            data: ['Promedio Día', 'Media Global', 'LCL (-3σ)', 'UCL (+3σ)', 
                   ...(props.standardValue != null ? ['Ne Estándar', 'Ne Min (-1.5%)', 'Ne Max (+1.5%)'] : [])],
            bottom: 0,
            left: 'center',
            selectedMode: true // Allow clicking legend to show/hide series
        },
        // Grid ajustado para usar todo el alto disponible del contenedor
        grid: { left: '3%', right: '3%', top: '6%', bottom: 90, containLabel: false },
        xAxis: {
            type: 'category',
            data: x,
            axisLabel: { rotate: xLabelRotate, interval: 0, align: isVertical ? 'right' : 'center', margin: 10 }
        },
        yAxis: {
            type: 'value',
            min: yMin,
            max: yMax,
            axisLabel: {
                formatter: (value) => value.toFixed(1)
            }
        },
        series: [
            {
                name: 'Promedio Día',
                type: 'line',
                data: y,
                smooth: false,
                symbol: 'circle',
                symbolSize: 8,
                itemStyle: { color: '#3b82f6' },
                lineStyle: { width: 2 }
            },
            {
                name: 'Media Global',
                type: 'line',
                data: globalMeanLine,
                lineStyle: { type: 'solid', color: '#10b981', width: 2 },
                showSymbol: false
            },
            {
                name: 'LCL (-3σ)',
                type: 'line',
                data: lcl,
                lineStyle: { type: 'dashed', color: '#ef4444', width: 2 },
                showSymbol: false
            },
            {
                name: 'UCL (+3σ)',
                type: 'line',
                data: ucl,
                lineStyle: { type: 'dashed', color: '#ef4444', width: 2 },
                showSymbol: false
            },
            {
                name: 'Ne Estándar',
                type: 'line',
                data: props.standardValue != null ? Array(x.length).fill(props.standardValue) : [],
                lineStyle: { type: 'solid', color: '#f59e0b', width: 2.5 },
                showSymbol: false,
                z: 10,
                // Hide from legend when no data
                silent: props.standardValue == null
            },
            {
                name: 'Ne Min (-1.5%)',
                type: 'line',
                data: props.standardValue != null ? Array(x.length).fill(props.standardValue * 0.985) : [],
                lineStyle: { type: 'dashed', color: '#fb923c', width: 2 },
                showSymbol: false,
                z: 9,
                silent: props.standardValue == null
            },
            {
                name: 'Ne Max (+1.5%)',
                type: 'line',
                data: props.standardValue != null ? Array(x.length).fill(props.standardValue * 1.015) : [],
                lineStyle: { type: 'dashed', color: '#fb923c', width: 2 },
                showSymbol: false,
                z: 9,
                silent: props.standardValue == null
            }
        ]
    }
}

function render() {
    if (!chart || !props.stats || chart.isDisposed()) return

    // compute labels and optimal rotation
    const labels = props.stats.map(d => (d.timestampFmt ? d.timestampFmt : d.testnr))
    const rotate = computeOptimalXLabelRotate(labels)
    // initial estimate (may be refined by chart.finished handler)
    const bottomPx = computeRequiredBottomPx(labels, rotate)
    const opt = buildOption(props.stats, rotate, bottomPx)
    chart.setOption(opt)
}

watch(() => [props.stats, props.globalMean, props.globalUcl, props.globalLcl, props.standardValue], () => { render() }, { deep: true })

let _resizeHandler = null
let _keydownHandler = null
let _isUpdatingFromFinished = false // Flag para evitar loop de setOption
onMounted(() => {
    chart = echarts.init(chartRef.value)
    render()

    // Rastrear punto hovereado para tooltip
    chart.on('updateAxisPointer', (event) => {
        const dataIndex = event.axesInfo?.[0]?.value
        if (dataIndex != null && props.stats[dataIndex]) {
            hoveredPoint.value = props.stats[dataIndex]
        }
    })

    // Limpiar punto hovereado cuando el tooltip se oculta
    chart.on('globalout', () => {
        hoveredPoint.value = null
    })

    // Listener de teclado para Ctrl y Shift
    _keydownHandler = (e) => {
        if (!hoveredPoint.value) return

        // Ctrl/Cmd: abrir detalle completo del ensayo
        if ((e.ctrlKey || e.metaKey) && hoveredPoint.value.testnr) {
            e.preventDefault()
            emit('open-ensayo-detail', hoveredPoint.value.testnr)
        }
        
        // Shift: abrir detalle de husos
        if (e.shiftKey && hoveredPoint.value.testnr) {
            e.preventDefault()
            emit('open-huso-detail', hoveredPoint.value)
        }
    }
    window.addEventListener('keydown', _keydownHandler)

    // on resize, resize chart and re-render to recompute rotation
    _resizeHandler = () => {
        if (chart && !chart.isDisposed()) {
            chart.resize()
            render()
        }
    }
    window.addEventListener('resize', _resizeHandler)
    // register finished handler to measure the legend DOM after echarts has finished layout
    const finishedHandler = () => {
        // Prevenir recursión infinita o uso de instancia destruida
        if (_isUpdatingFromFinished || !chart || chart.isDisposed()) return

        try {
            const root = chartRef.value
            if (!root || !props.stats) return
            const labels = props.stats.map(d => (d.timestampFmt ? d.timestampFmt : d.testnr))
            const rotate = computeOptimalXLabelRotate(labels)

            // attempt to find legend element inside chart DOM
            let legendEl = root.querySelector('.echarts-legend') || root.querySelector('.ec-legend') || root.querySelector('[class*="legend"]')
            if (!legendEl) {
                const els = root.querySelectorAll('[class*="legend"]')
                if (els && els.length) legendEl = els[0]
            }

            if (legendEl) {
                Math.ceil(legendEl.getBoundingClientRect().height || 0) // Eliminado uso de legendHeight
            }

            // recompute rotatedHeight like computeRequiredBottomPx (use canvas)
            const style = window.getComputedStyle(root)
            const font = style && style.font ? style.font : '12px sans-serif'
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            ctx.font = font
            let maxW = 0
            labels.forEach(l => {
                const w = ctx.measureText(String(l)).width
                if (w > maxW) maxW = w
            })
            const fontSizeMatch = style && style.fontSize ? style.fontSize.match(/(\d+)(px)?/) : null
            const fontSizePx = fontSizeMatch ? parseInt(fontSizeMatch[1], 10) : 12
            const rad = (rotate || 0) * Math.PI / 180
            const rotatedHeight = Math.abs(Math.sin(rad)) * maxW + Math.abs(Math.cos(rad)) * fontSizePx
            // Espacio para etiquetas X + espacio para leyenda
            const refinedBottom = Math.max(80, Math.min(Math.ceil(rotatedHeight + 55), 150))

            // if difference is meaningful, reapply option with refined bottom
            const currentBottom = chart.getOption().grid && chart.getOption().grid[0] && chart.getOption().grid[0].bottom ? chart.getOption().grid[0].bottom : null
            // note: chart.getOption().grid may return px or percent; we compare numerically when possible
            if (!currentBottom || Math.abs(refinedBottom - (Number(currentBottom) || 0)) > 6) {
                _isUpdatingFromFinished = true
                const opt2 = buildOption(props.stats, rotate, refinedBottom)
                // Use setTimeout to avoid "setOption should not be called during main process" warning
                setTimeout(() => {
                    if (chart && !chart.isDisposed()) {
                        chart.setOption(opt2)
                    }
                    _isUpdatingFromFinished = false
                }, 0)
            }
        } catch {
            // ignore
            _isUpdatingFromFinished = false
        }
    }
    chart.on('finished', finishedHandler)
})

onBeforeUnmount(() => {
    if (chart && !chart.isDisposed()) {
        chart.off('updateAxisPointer')
        chart.off('globalout')
        chart.off('finished')
        chart.dispose()
    }
    chart = null
    if (_resizeHandler) window.removeEventListener('resize', _resizeHandler)
    if (_keydownHandler) window.removeEventListener('keydown', _keydownHandler)
})
</script>

<style scoped>
.chart-container {
    width: 100%;
    height: 320px
}
</style>
