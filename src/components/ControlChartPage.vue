<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Gráfico de Control</h1>
    <ControlChart
      :testnrLabels="testnrLabels"
      :meanValues="meanValues"
      :globalMean="globalMean"
      :ucl="ucl"
      :lcl="lcl"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ControlChart from './ControlChart.vue';

// Simulated data for testing
const testnrLabels = ref([]);
const meanValues = ref([]);
const globalMean = ref(50);
const ucl = ref(70);
const lcl = ref(30);

onMounted(() => {
  // Simulate fetching data
  testnrLabels.value = Array.from({ length: 24 }, (_, i) => `TESTNR ${i + 1}`);
  meanValues.value = Array.from({ length: 24 }, () => Math.random() * 40 + 30);
});
</script>

<style scoped>
/* Add any specific styles here */
</style>