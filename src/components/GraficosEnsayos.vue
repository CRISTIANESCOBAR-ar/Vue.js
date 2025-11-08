<template>
  <div class="w-full bg-white rounded-2xl shadow-xl px-4 py-3 border border-slate-200">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-semibold text-slate-800">Visualizador de Ensayos</h3>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <label class="text-sm text-slate-600">Métrica:</label>
            <select v-model="metric" class="px-2 py-1 border rounded-md text-sm">
              <option v-for="m in metrics" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
          </div>

          <!-- Filtros OE / Ne compactos -->
          <div class="flex items-center gap-2">
            <input v-model="oe" placeholder="OE" class="w-20 px-2 py-1 border rounded text-sm" />
            <input v-model="ne" placeholder="Ne" class="w-20 px-2 py-1 border rounded text-sm" />
            <button @click="applyFilters" class="px-2 py-1 bg-blue-600 text-white rounded text-sm">Aplicar</button>
            <button @click="clearFilters" class="px-2 py-1 bg-white border rounded text-sm">Limpiar</button>
          </div>
        </div>
    </div>

    <div v-if="loading" class="text-sm text-slate-600 py-8 text-center">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-blue-600"></div>
      <p class="mt-2">Cargando datos para graficar...</p>
    </div>

    <div v-else>
      <div v-if="fetchError" class="mb-3 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="font-semibold">Error cargando datos</div>
            <div class="mt-1">{{ fetchError }}</div>
          </div>
          <div class="flex items-center gap-2">
            <button @click="loadData()" class="px-3 py-1 bg-white border rounded text-sm">Reintentar</button>
            <button @click="loadSampleData()" class="px-3 py-1 bg-blue-600 text-white rounded text-sm">Usar datos de ejemplo</button>
          </div>
        </div>
      </div>

      <div class="mb-3 text-sm text-slate-600">
        <template v-if="appliedOe || appliedNe">
          <span class="mr-2">Filtros aplicados:</span>
          <span v-if="appliedOe" class="inline-block mr-2 px-2 py-0.5 bg-slate-100 text-slate-700 rounded">OE: {{ appliedOe }}</span>
          <span v-if="appliedNe" class="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded">Ne: {{ appliedNe }}</span>
        </template>
      </div>

      <div class="h-[48vh] md:h-[60vh] relative">
        <div ref="chartEl" class="w-full h-full"></div>
        <div v-if="noData" class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="bg-white/80 px-4 py-2 rounded-md text-sm text-slate-700">No hay datos numéricos para la métrica seleccionada.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
// NOTE: require installing echarts: `npm install echarts`
import * as echarts from 'echarts'

// Use backendUrl when running locally (same heuristic as other components)
const backendUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3001' : ''

const loading = ref(false)
const rows = ref([])
const chartEl = ref(null)
let chart = null
  const noData = ref(false)
  const fetchError = ref(null)

// filtros OE / Ne (inputs) y filtros aplicados
const oe = ref('')
const ne = ref('')
const appliedOe = ref('')
const appliedNe = ref('')

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
    const res = await fetch(`${backendUrl}/api/report/informe-completo`)
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status} ${res.statusText} - ${txt.slice(0, 400)}`)
    }

    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('application/json')) {
      // if server returned HTML (likely index.html or error page), include first part in message
      const txt = await res.text().catch(() => '')
      throw new Error(`Respuesta inesperada (no JSON): ${txt.slice(0, 400)}`)
    }

    const payload = await res.json()
    rows.value = Array.isArray(payload.rows) ? payload.rows : []
  } catch (err) {
    console.error('Failed to load report for charts', err)
    rows.value = []
    fetchError.value = String(err && err.message ? err.message : err) || 'Error desconocido al obtener datos'
  } finally {
    loading.value = false
  }
}

function loadSampleData() {
  // Small synthetic dataset to preview charts locally
  rows.value = Array.from({ length: 12 }).map((_, i) => {
    return {
      Ensayo: 1000 + i,
      'Tenac.': (20 + i * 0.8).toFixed(2),
      'Fuerza B': (150 + i * 2).toFixed(2),
      'Elong. %': (5 + i * 0.2).toFixed(2),
      'CVm %': (2 + (i % 3) * 0.5).toFixed(2),
      TITULO: (30 + i).toFixed(2)
    }
  })
  fetchError.value = null
  // mantener filtros aplicados al usar datos de ejemplo
  nextTick(() => renderChart())
}

function buildSeries() {
  const x = []
  const y = []

  // helper: try to find a field value for OE/Ne in the row (case-insensitive key match)
  function findField(row, needle) {
    const lk = needle.toLowerCase()
    for (const k of Object.keys(row)) {
      if (k && k.toLowerCase().includes(lk)) return row[k]
    }
    return undefined
  }

  const source = rows.value.filter(r => {
    if (appliedOe.value) {
      const v = findField(r, 'oe')
      if (!v || String(v).toLowerCase().indexOf(appliedOe.value.toLowerCase()) === -1) return false
    }
    if (appliedNe.value) {
      const v = findField(r, 'ne')
      if (!v || String(v).toLowerCase().indexOf(appliedNe.value.toLowerCase()) === -1) return false
    }
    return true
  })

  for (const r of source) {
    const ens = r.Ensayo || r.testnr || r.Testnr || r.Ens || ''
    const raw = r[metric.value] ?? r[metric.value.replace('.', '')]
    const n = parseNum(raw)
    if (!Number.isFinite(n)) continue
    x.push(String(ens))
    y.push(n)
  }
  return { x, y }
}

function applyFilters() {
  appliedOe.value = oe.value ? oe.value.trim() : ''
  appliedNe.value = ne.value ? ne.value.trim() : ''
  // re-render chart with filters
  renderChart()
}

function clearFilters() {
  oe.value = ''
  ne.value = ''
  appliedOe.value = ''
  appliedNe.value = ''
  renderChart()
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
