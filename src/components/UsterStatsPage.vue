<template>
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-3">Uster - Estadísticas por TESTNR</h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="md:col-span-1">
        <VariableSelector :variables="variables" v-model="selectedVar" />
        <div class="text-sm text-slate-600 mb-2">Muestra: {{ stats.length }} TESTNR</div>
        <StatsTable :stats="stats" />
      </div>
      <div class="md:col-span-2">
        <StatsChart :stats="stats" :variableLabel="selectedVarLabel" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import VariableSelector from './uster-stats/VariableSelector.vue'
import StatsChart from './uster-stats/StatsChart.vue'
import StatsTable from './uster-stats/StatsTable.vue'
import { groupByTestnr, extractNumericValues, computeStatsPerTest } from '../utils/dataProcessing'

// Props: the page expects a data object with four arrays or you can fetch inside the page
const props = defineProps({ data: { type: Object, default: () => ({ uster_par: [], uster_tbl: [], tensorapid_par: [], tensorapid_tbl: [] }) } })

// Define available variables – label/value where value maps to a field name in the tables
const variables = [
  { label: 'TITULO', value: 'TITULO' },
  { label: 'CVM_PERCENT', value: 'CVM_PERCENT' },
  { label: 'DELG_MINUS30_KM', value: 'DELG_MINUS30_KM' },
  { label: 'DELG_MINUS40_KM', value: 'DELG_MINUS40_KM' },
  { label: 'DELG_MINUS50_KM', value: 'DELG_MINUS50_KM' },
  { label: 'GRUE_35_KM', value: 'GRUE_35_KM' },
  { label: 'GRUE_50_KM', value: 'GRUE_50_KM' },
  { label: 'NEPS_140_KM', value: 'NEPS_140_KM' },
  { label: 'NEPS_280_KM', value: 'NEPS_280_KM' },
  { label: 'FUERZA_B', value: 'FUERZA_B' },
  { label: 'ELONGACION', value: 'ELONGACION' },
  { label: 'TENACIDAD', value: 'TENACIDAD' },
  { label: 'TRABAJO', value: 'TRABAJO' }
]

const selectedVar = ref(variables[0].value)

const selectedVarLabel = computed(() => variables.find(v => v.value === selectedVar.value)?.label || selectedVar.value)

// Process data
const map = computed(() => groupByTestnr(props.data.uster_tbl || [], props.data.tensorapid_tbl || []))

const numericRows = computed(() => extractNumericValues(map.value, selectedVar.value))

const stats = computed(() => computeStatsPerTest(numericRows.value))

// Validate numeric data: if any testnr has no numeric values, warn
watch(selectedVar, (nv) => {
  const missing = numericRows.value.filter(r => !r.values || r.values.length === 0)
  if (missing.length) {
    console.warn(`Variable ${nv} no tiene valores numéricos para ${missing.length} TESTNR`) // show warnings in console
  }
})

</script>

<style scoped>
/* Basic responsive tweaks; the layout uses CSS grid for responsiveness */
</style>
