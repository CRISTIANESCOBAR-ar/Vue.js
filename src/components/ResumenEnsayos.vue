<template>
  <div class="w-full">
    <div class="bg-white rounded shadow p-3 md:p-4 mt-2 mb-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-800">Resumen de Ensayos</h2>
        <button
          @click="fetchRecords"
          :disabled="loading"
          class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg
            v-if="loading"
            class="animate-spin h-4 w-4 text-white"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span>{{ loading ? 'Cargando...' : 'Actualizar' }}</span>
        </button>
      </div>

      <!-- Error message -->
      <div v-if="error" class="mb-4 p-3 bg-red-100 text-red-700 rounded">
        {{ error }}
      </div>

      <!-- Records count -->
      <div v-if="!loading && records.length > 0" class="mb-3 text-sm text-gray-600">
        Mostrando {{ records.length }} de {{ totalRecords }} registros (Página {{ currentPage }} de {{ totalPages }})
      </div>

      <!-- Table -->
      <div class="overflow-x-auto border rounded">
        <div class="max-h-[70vh] overflow-y-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                  @click="changeSort('TESTNR')"
                >
                  <div class="flex items-center gap-1">
                    <span>Test Nr</span>
                    <span v-if="sortBy === 'TESTNR'">{{ sortOrder === 'ASC' ? '▲' : '▼' }}</span>
                  </div>
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                  @click="changeSort('NOMCOUNT')"
                >
                  <div class="flex items-center gap-1">
                    <span>Nom Count</span>
                    <span v-if="sortBy === 'NOMCOUNT'">{{ sortOrder === 'ASC' ? '▲' : '▼' }}</span>
                  </div>
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                  @click="changeSort('MASCHNR')"
                >
                  <div class="flex items-center gap-1">
                    <span>Máquina</span>
                    <span v-if="sortBy === 'MASCHNR'">{{ sortOrder === 'ASC' ? '▲' : '▼' }}</span>
                  </div>
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                  @click="changeSort('LOTE')"
                >
                  <div class="flex items-center gap-1">
                    <span>Lote</span>
                    <span v-if="sortBy === 'LOTE'">{{ sortOrder === 'ASC' ? '▲' : '▼' }}</span>
                  </div>
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                  @click="changeSort('LABORANT')"
                >
                  <div class="flex items-center gap-1">
                    <span>Laborante</span>
                    <span v-if="sortBy === 'LABORANT'">{{ sortOrder === 'ASC' ? '▲' : '▼' }}</span>
                  </div>
                </th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="loading">
                <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                  <div class="flex items-center justify-center gap-2">
                    <svg
                      class="animate-spin h-5 w-5 text-blue-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    <span>Cargando registros...</span>
                  </div>
                </td>
              </tr>
              <tr v-else-if="records.length === 0">
                <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                  No hay registros disponibles
                </td>
              </tr>
              <tr v-for="record in records" :key="record.TESTNR" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ record.TESTNR }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ record.NOMCOUNT || '-' }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ record.MASCHNR || '-' }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ record.LOTE || '-' }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ record.LABORANT || '-' }}</td>
                <td class="px-4 py-3 text-center">
                  <button
                    @click="confirmDelete(record.TESTNR)"
                    class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    title="Eliminar ensayo"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="!loading && totalPages > 1" class="mt-4 flex items-center justify-between">
        <div class="text-sm text-gray-600">
          Página {{ currentPage }} de {{ totalPages }}
        </div>
        <div class="flex gap-2">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Swal from 'sweetalert2'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

const records = ref([])
const loading = ref(false)
const error = ref(null)
const currentPage = ref(1)
const totalPages = ref(1)
const totalRecords = ref(0)
const sortBy = ref('TESTNR')
const sortOrder = ref('DESC')
const pageLimit = ref(50)

async function fetchRecords() {
  loading.value = true
  error.value = null

  try {
    const queryParams = `page=${encodeURIComponent(currentPage.value)}&limit=${encodeURIComponent(pageLimit.value)}&sortBy=${encodeURIComponent(sortBy.value)}&sortOrder=${encodeURIComponent(sortOrder.value)}`
    const response = await fetch(`${API_BASE}/api/uster/list?${queryParams}`)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`Error al cargar registros: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    records.value = data.records || []
    totalPages.value = data.totalPages || 1
    totalRecords.value = data.total || 0
  } catch (err) {
    console.error('Error fetching records:', err)
    error.value = err.message || 'Error al cargar los registros'
  } finally {
    loading.value = false
  }
}

function changeSort(field) {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    sortBy.value = field
    sortOrder.value = 'ASC'
  }
  fetchRecords()
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchRecords()
  }
}

async function confirmDelete(testnr) {
  const result = await Swal.fire({
    title: '¿Eliminar ensayo?',
    html: `¿Está seguro de eliminar el ensayo <strong>${testnr}</strong>?<br><br>Esta acción eliminará todos los datos asociados y no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  })

  if (result.isConfirmed) {
    await deleteRecord(testnr)
  }
}

async function deleteRecord(testnr) {
  try {
    const response = await fetch(`${API_BASE}/api/uster/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ testnr })
    })

    if (!response.ok) {
      let errorMessage = 'Error al eliminar el registro'
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        // If response is not JSON, use the default error message
        errorMessage = `${errorMessage} (${response.status})`
      }
      throw new Error(errorMessage)
    }

    await Swal.fire({
      title: '¡Eliminado!',
      text: `El ensayo ${testnr} ha sido eliminado correctamente.`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    })

    // Refresh the list
    await fetchRecords()
  } catch (err) {
    console.error('Error deleting record:', err)
    await Swal.fire({
      title: 'Error',
      text: err.message || 'Error al eliminar el registro',
      icon: 'error'
    })
  }
}

onMounted(() => {
  fetchRecords()
})
</script>
