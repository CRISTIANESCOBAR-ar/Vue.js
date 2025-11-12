<template>
  <div class="overflow-auto">
    <table class="w-full table-auto text-sm border">
      <thead>
        <tr class="bg-slate-50">
          <th class="px-2 py-1">TESTNR</th>
          <th class="px-2 py-1">n</th>
          <th class="px-2 py-1">Media</th>
          <th class="px-2 py-1">SD</th>
          <th class="px-2 py-1">LCL</th>
          <th class="px-2 py-1">UCL</th>
          <th class="px-2 py-1">Out of control</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in stats" :key="s.testnr">
          <td class="px-2 py-1">{{ s.testnr }}</td>
          <td class="px-2 py-1">{{ s.count }}</td>
          <td class="px-2 py-1">{{ s.mean }}</td>
          <td class="px-2 py-1">{{ s.sd }}</td>
          <td class="px-2 py-1">{{ s.lcl }}</td>
          <td class="px-2 py-1">{{ s.ucl }}</td>
          <td class="px-2 py-1">
            <span v-if="s.outOfControl && s.outOfControl.length">Sí ({{ s.outOfControl.length }})</span>
            <span v-else>No</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const props = defineProps({ stats: { type: Array, default: () => [] } })
</script>

<style scoped>
table { border-collapse: collapse }
th, td { border: 1px solid #e6e9ef }
</style>
