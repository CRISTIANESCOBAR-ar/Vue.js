<template>
  <div class="max-w-5xl mx-auto bg-white rounded shadow p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium">Resumen de Ensayos</h3>
      <div class="flex items-center gap-2">
        <button @click="loadRows" class="px-3 py-1 bg-blue-600 text-white rounded">Refrescar</button>
      </div>
    </div>

    <div v-if="loading" class="text-sm text-gray-600">Cargando...</div>
    <div v-else>
      <div v-if="rows.length === 0" class="text-sm text-gray-600">No hay ensayos.</div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50 sticky top-0">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">TESTNR</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">NOMCOUNT</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">MASCHNR</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">LOTE</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">LABORANT</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">TIME</th>
              <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr v-for="r in rows" :key="r.TESTNR">
              <td class="px-3 py-2 text-sm">{{ r.TESTNR }}</td>
              <td class="px-3 py-2 text-sm">{{ r.NOMCOUNT }}</td>
              <td class="px-3 py-2 text-sm">{{ r.MASCHNR }}</td>
              <td class="px-3 py-2 text-sm">{{ r.LOTE }}</td>
              <td class="px-3 py-2 text-sm">{{ r.LABORANT }}</td>
              <td class="px-3 py-2 text-sm">{{ formatTime(r.TIME_STAMP) }}</td>
              <td class="px-3 py-2 text-sm text-right">
                <button @click="confirmDelete(r.TESTNR)" class="px-2 py-1 bg-red-600 text-white rounded text-xs">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Swal from 'sweetalert2'

const rows = ref([])
const loading = ref(false)

const backendUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3001' : ''

/**
 * Format TIME_STAMP to dd/mm/yy hh:mm format
 * Input format: "1761445626 26.10.2025 03:27" or similar
 * Output format: "26/10/25 03:27"
 */
function formatTime(timeStamp) {
  if (!timeStamp) return ''
  
  // The TIME_STAMP format appears to be: "timestamp DD.MM.YYYY HH:MM"
  // We need to extract the date and time parts and reformat them
  const parts = String(timeStamp).trim().split(' ')
  
  // If we have at least 3 parts (timestamp, date, time)
  if (parts.length >= 3) {
    const datePart = parts[1] // "26.10.2025"
    const timePart = parts[2] // "03:27"
    
    // Parse the date part (DD.MM.YYYY)
    const dateComponents = datePart.split('.')
    if (dateComponents.length === 3) {
      const day = dateComponents[0]
      const month = dateComponents[1]
      const year = dateComponents[2].slice(-2) // Get last 2 digits of year
      
      return `${day}/${month}/${year} ${timePart}`
    }
  }
  
  // If format doesn't match expected pattern, return original value
  return timeStamp
}

async function loadRows() {
  loading.value = true
  try {
    const res = await fetch(`${backendUrl}/api/uster/list`)
    if (!res.ok) throw new Error(await res.text())
    const payload = await res.json()
    rows.value = Array.isArray(payload.rows) ? payload.rows : []
  } catch (err) {
    console.error('Failed to load rows', err)
    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar la lista de ensayos.' })
  } finally {
    loading.value = false
  }
}

async function confirmDelete(testnr) {
  const result = await Swal.fire({
    title: 'Confirmar eliminación',
    text: `¿Eliminar el ensayo ${testnr}? Esta acción borrará PAR y TBL asociados.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  })
  if (result.isConfirmed) await doDelete(testnr)
}

async function doDelete(testnr) {
  try {
    const res = await fetch(`${backendUrl}/api/uster/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testnr })
    })
    const payload = await res.json()
    if (!res.ok) throw new Error(payload && payload.error ? payload.error : 'Delete failed')
    Swal.fire({ icon: 'success', title: 'Eliminado', text: payload.message || 'Ensayo eliminado' })
    await loadRows()
  } catch (err) {
    console.error('Delete failed', err)
    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el ensayo.' })
  }
}

onMounted(() => {
  loadRows()
})
</script>
