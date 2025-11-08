<template>
  <div class="w-full bg-white rounded-2xl shadow-xl px-4 py-3 border border-slate-200">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-semibold text-slate-800">Visualizador de Ensayos</h3>
      <div class="flex items-center gap-2">
        <label class="text-sm text-slate-600">Métrica:</label>
        <select v-model="metric" class="px-2 py-1 border rounded-md text-sm">
          <option v-for="m in metrics" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="text-sm text-slate-600 py-8 text-center">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-blue-600"></div>
      <p class="mt-2">Cargando datos para graficar...</p>
    </div>

    <div v-else class="h-[48vh] md:h-[60vh] relative">
      <div ref="chartEl" class="w-full h-full"></div>
      <div v-if="noData" class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="bg-white/80 px-4 py-2 rounded-md text-sm text-slate-700">No hay datos numéricos para la métrica seleccionada.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
// NOTE: require installing echarts: `npm install echarts`
import * as echarts from 'echarts'

const loading = ref(false)
const rows = ref([])
const chartEl = ref(null)
let chart = null
const noData = ref(false)

const metrics = [
  { value: 'Tenac.', label: 'Tenacidad (Tenac.)' },
  { value: 'Fuerza B', label: 'Fuerza B' },
  { value: 'Elong. %', label: 'Elong. %' },
  { value: 'CVm %', label: 'CVm %' },
  { value: 'Titulo', label: 'Título (TITULO)' }
]

const metric = ref('Tenac.')

function parseNum(v) {
  if (v == null || v === '') return NaN
  const s = String(v).replace(/,/g, '.') // accept commas as decimals
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : NaN
}

async function loadData() {
  loading.value = true
  noData.value = false
  try {
    const res = await fetch('/api/report/informe-completo')
    if (!res.ok) throw new Error('fetch failed')
    const payload = await res.json()
    rows.value = Array.isArray(payload.rows) ? payload.rows : []
  } catch (err) {
    console.error('Failed to load report for charts', err)
    rows.value = []
  } finally {
    loading.value = false
  }
}

function buildSeries() {
  const x = []
  const y = []
  for (const r of rows.value) {
    const ens = r.Ensayo || r.testnr || r.Testnr || ''
    const raw = r[metric.value] ?? r[metric.value.replace('.', '')]
    const n = parseNum(raw)
    if (!Number.isFinite(n)) continue
    x.push(String(ens))
    y.push(n)
  }
  return { x, y }
}

function renderChart() {
  if (!chartEl.value) return
  if (!chart) chart = echarts.init(chartEl.value)
  const { x, y } = buildSeries()
  noData.value = x.length === 0

  const option = {
    title: { text: metrics.find(m => m.value === metric.value)?.label || metric.value, left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: x, name: 'Ensayo', axisLabel: { rotate: 45 } },
    yAxis: { type: 'value', name: metric.value },
    series: [
      {
        data: y,
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2 }
      }
    ],
    toolbox: { feature: { saveAsImage: {} } },
    grid: { left: 60, right: 30, bottom: 80 }
  }

  chart.setOption(option)
}

onMounted(async () => {
  await loadData()
  await nextTick()
  renderChart()
  window.addEventListener('resize', () => chart && chart.resize())
})

onBeforeUnmount(() => {
  try { window.removeEventListener('resize', () => chart && chart.resize()) } catch { /* ignore */ }
  try { chart && chart.dispose() } catch { /* ignore */ }
})

watch(metric, () => {
  renderChart()
})

</script>

<style scoped>
.echarts-hidden { display: none }
</style>
