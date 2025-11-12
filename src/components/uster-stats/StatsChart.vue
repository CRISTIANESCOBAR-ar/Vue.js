<template>
    <div class="w-full h-full">
        <div ref="chartRef" class="w-full h-full"></div>
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

function buildOption(data) {
    const x = data.map(d => d.testnr)
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
        legend: {
            data: ['Media por TESTNR', 'Media Global', 'UCL (+3σ)', 'LCL (-3σ)']
        },
        xAxis: {
            type: 'category',
            data: x,
            name: 'TESTNR',
            axisLabel: { rotate: 45, interval: 0 }
        },
        yAxis: {
            type: 'value',
            name: props.variableLabel,
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
    const opt = buildOption(props.stats)
    chart.setOption(opt)
}

watch(() => [props.stats, props.globalMean, props.globalUcl, props.globalLcl], () => { render() }, { deep: true })

onMounted(() => {
    chart = echarts.init(chartRef.value)
    render()
    window.addEventListener('resize', () => chart && chart.resize())
})

onBeforeUnmount(() => {
    if (chart) chart.dispose()
    window.removeEventListener('resize', () => { })
})
</script>

<style scoped>
.chart-container {
    width: 100%;
    height: 320px
}
</style>
