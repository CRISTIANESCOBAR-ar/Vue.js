<template>
  <div class="w-full">
    <div ref="chartRef" style="width:100%;height:320px"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({ stats: { type: Array, default: () => [] }, variableLabel: { type: String, default: '' } })
const chartRef = ref(null)
let chart = null

function buildOption(data) {
  const x = data.map(d => d.testnr)
  const y = data.map(d => d.mean)
  const ucl = data.map(d => d.ucl)
  const lcl = data.map(d => d.lcl)

  return {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: x, name: 'TESTNR' },
    yAxis: { type: 'value', name: props.variableLabel },
    series: [
      { name: 'Media', type: 'line', data: y, smooth: false, symbol: 'circle' },
      { name: 'UCL', type: 'line', data: ucl, lineStyle: { type: 'dashed' }, showSymbol: false },
      { name: 'LCL', type: 'line', data: lcl, lineStyle: { type: 'dashed' }, showSymbol: false }
    ]
  }
}

function render() {
  if (!chart || !props.stats) return
  const opt = buildOption(props.stats)
  chart.setOption(opt)
}

watch(() => props.stats, () => { render() }, { deep: true })

onMounted(() => {
  chart = echarts.init(chartRef.value)
  render()
  window.addEventListener('resize', () => chart && chart.resize())
})

onBeforeUnmount(() => {
  if (chart) chart.dispose()
  window.removeEventListener('resize', () => {})
})
</script>

<style scoped>
.chart-container { width:100%; height:320px }
</style>
