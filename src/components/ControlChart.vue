<template>
  <div class="control-chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const chartCanvas = ref(null);
const chartInstance = ref(null);

// Props for dynamic data
const props = defineProps({
  testnrLabels: {
    type: Array,
    required: true,
  },
  meanValues: {
    type: Array,
    required: true,
  },
  globalMean: {
    type: Number,
    required: true,
  },
  ucl: {
    type: Number,
    required: true,
  },
  lcl: {
    type: Number,
    required: true,
  },
});

// Watch for prop changes to update the chart dynamically
watch(
  () => [props.testnrLabels, props.meanValues, props.globalMean, props.ucl, props.lcl],
  () => {
    if (chartInstance.value) {
      chartInstance.value.destroy();
    }
    createChart();
  }
);

onMounted(() => {
  createChart();
});

function createChart() {
  if (!chartCanvas.value) return;

  chartInstance.value = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels: props.testnrLabels,
      datasets: [
        {
          label: 'Media por TESTNR',
          data: props.meanValues,
          borderColor: 'blue',
          backgroundColor: 'rgba(0, 0, 255, 0.1)',
          borderWidth: 2,
          pointRadius: 4,
        },
        {
          label: 'Media Global',
          data: Array(props.testnrLabels.length).fill(props.globalMean),
          borderColor: 'green',
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
        },
        {
          label: 'UCL',
          data: Array(props.testnrLabels.length).fill(props.ucl),
          borderColor: 'red',
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
        },
        {
          label: 'LCL',
          data: Array(props.testnrLabels.length).fill(props.lcl),
          borderColor: 'red',
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        title: {
          display: true,
          text: 'Gráfico de Control',
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.raw;
              const label = context.dataset.label;
              return `${label}: ${value}`;
            },
          },
        },
      },
      layout: {
        padding: {
          bottom: 50,
        },
      },
      scales: {
        x: {
          ticks: {
            autoSkip: false,
            maxRotation: 90,
            minRotation: 90,
          },
        },
        y: {
          beginAtZero: false,
        },
      },
    },
  });
}
</script>

<style scoped>
.control-chart-container {
  position: relative;
  height: 400px;
  width: 100%;
}
</style>