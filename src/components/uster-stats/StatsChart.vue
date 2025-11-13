<template>
    <div class="w-full h-full">
        <!-- altura dinámica: resta espacio del header (aprox 60px) y deja margen para leyenda -->
        <div ref="chartRef" class="w-full" style="min-height:400px; height:calc(100vh - 200px);"></div>
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
    variableLabel: { type: String, default: '' }
})
const chartRef = ref(null)
let chart = null

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
        const legendItems = ['Media por TESTNR', 'Media Global', 'UCL (+3σ)', 'LCL (-3σ)']
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
    let yMin = Math.min(...allValues)
    let yMax = Math.max(...allValues)
    yMin = yMin - 0.1
    yMax = yMax + 0.1

    const isVertical = xLabelRotate === 90

    return {
        tooltip: {
            trigger: 'axis',
            formatter: (params) => {
                let result = `<b>${params[0].axisValue}</b><br/>`
                params.forEach(item => {
                    result += `${item.marker} ${item.seriesName}: ${item.value.toFixed(2)}<br/>`
                })
                return result
            }
        },
        // always place legend at the bottom; if labels are vertical, increase bottom space so labels fit
        legend: { data: ['Media por TESTNR', 'Media Global', 'UCL (+3σ)', 'LCL (-3σ)'], bottom: 0, left: 'center' },
        // adjust grid to use more horizontal and vertical space; use fixed 90px bottom for legend + labels
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
                name: 'Media por TESTNR',
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
                name: 'UCL (+3σ)',
                type: 'line',
                data: ucl,
                lineStyle: { type: 'dashed', color: '#ef4444', width: 2 },
                showSymbol: false
            },
            {
                name: 'LCL (-3σ)',
                type: 'line',
                data: lcl,
                lineStyle: { type: 'dashed', color: '#ef4444', width: 2 },
                showSymbol: false
            }
        ]
    }
}

function render() {
    if (!chart || !props.stats) return

    // compute labels and optimal rotation
    const labels = props.stats.map(d => (d.timestampFmt ? d.timestampFmt : d.testnr))
    const rotate = computeOptimalXLabelRotate(labels)
    // initial estimate (may be refined by chart.finished handler)
    const bottomPx = computeRequiredBottomPx(labels, rotate)
    const opt = buildOption(props.stats, rotate, bottomPx)
    chart.setOption(opt)
}

watch(() => [props.stats, props.globalMean, props.globalUcl, props.globalLcl], () => { render() }, { deep: true })

let _resizeHandler = null
onMounted(() => {
    chart = echarts.init(chartRef.value)
    render()
    // on resize, resize chart and re-render to recompute rotation
    _resizeHandler = () => {
        chart && chart.resize()
        render()
    }
    window.addEventListener('resize', _resizeHandler)
    // register finished handler to measure the legend DOM after echarts has finished layout
    const finishedHandler = () => {
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
                const opt2 = buildOption(props.stats, rotate, refinedBottom)
                chart.setOption(opt2)
            }
        } catch {
            // ignore
        }
    }
    chart.on('finished', finishedHandler)
})

onBeforeUnmount(() => {
    if (chart) chart.dispose()
    if (_resizeHandler) window.removeEventListener('resize', _resizeHandler)
    try {
        chart && chart.off && chart.off('finished')
    } catch {
        // ignore cleanup errors
    }
})
</script>

<style scoped>
.chart-container {
    width: 100%;
    height: 320px
}
</style>
