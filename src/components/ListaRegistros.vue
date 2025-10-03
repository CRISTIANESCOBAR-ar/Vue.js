<template>
  <!-- Buscador (igual que antes) -->
  <div class="mb-4 flex items-center">
    <label for="searchTerm" class="w-24 text-sm font-medium text-gray-700">
      Buscar:
    </label>
    <input
      id="searchTerm"
      v-model="searchTerm"
      type="text"
      placeholder="Filtrar..."
      class="flex-1 px-3 py-2 border rounded focus:outline-none"
    />
  </div>

  <!-- Selector de tamaño de página -->
  <div class="mb-2 flex items-center space-x-2">
    <label for="pageSize" class="text-sm text-gray-600">Registros por página:</label>
    <select
      id="pageSize"
      v-model.number="pageSize"
      class="flex-none w-auto min-w-[4rem] px-3 py-1 border rounded focus:outline-none"
    >
      <option :value="5">5</option>
      <option :value="10">10</option>
      <option :value="20">20</option>
      <option :value="50">50</option>
    </select>
  </div>

  <table class="table-fixed w-full border-collapse">
    <colgroup>
      <col class="w-1/6" />
      <col class="w-1/6" />
      <col class="w-1/6" />
      <col class="w-1/3" />
      <col class="w-1/6" />
    </colgroup>

    <thead class="bg-gray-200">
      <tr>
        <th @click="setSort('rolada')" class="px-4 py-2 text-left cursor-pointer select-none">
          Rolada
          <svg v-if="sortKey==='rolada'" xmlns="http://www.w3.org/2000/svg"
               class="inline-block h-4 w-4 ml-1 text-gray-600"
               fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path v-if="sortAsc" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M5 15l7-7 7 7" />
            <path v-else     stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 9l-7 7-7-7" />
          </svg>
        </th>
        <th @click="setSort('base')" class="px-4 py-2 text-left cursor-pointer select-none">
          Base
          <svg v-if="sortKey==='base'" xmlns="http://www.w3.org/2000/svg"
               class="inline-block h-4 w-4 ml-1 text-gray-600"
               fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path v-if="sortAsc" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M5 15l7-7 7 7" />
            <path v-else     stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 9l-7 7-7-7" />
          </svg>
        </th>
        <th @click="setSort('color')" class="px-4 py-2 text-left cursor-pointer select-none">
          Color
          <svg v-if="sortKey==='color'" xmlns="http://www.w3.org/2000/svg"
               class="inline-block h-4 w-4 ml-1 text-gray-600"
               fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path v-if="sortAsc" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M5 15l7-7 7 7" />
            <path v-else     stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 9l-7 7-7-7" />
          </svg>
        </th>
        <th class="px-4 py-2 text-left">Observaciones</th>
        <th class="px-4 py-2 text-right">Acciones</th>
      </tr>
    </thead>

    <tbody>
      <tr
        v-for="item in paginatedRegs"
        :key="item.__idx"
        class="odd:bg-white even:bg-gray-50"
      >
        <td class="px-4 py-2">{{ item.rolada }}</td>
        <td class="px-4 py-2">{{ item.base }}</td>
        <td class="px-4 py-2">{{ item.color }}</td>
        <td class="px-4 py-2 break-words whitespace-normal">
          {{ item.observaciones }}
        </td>
        <td class="px-4 py-2 text-right">
          <button
            @click="editar(item.__idx)"
            class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
          >
            Editar
          </button>
          <button
            @click="eliminar(item.__idx)"
            class="ml-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none"
          >
            Eliminar
          </button>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Controles de paginación -->
  <div class="mt-4 flex items-center justify-center space-x-3">
    <button
      @click="currentPage--"
      :disabled="currentPage===1"
      class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
    >
      Anterior
    </button>

    <span class="text-sm text-gray-700">
      Página {{ currentPage }} de {{ totalPages }}
    </span>

    <button
      @click="currentPage++"
      :disabled="currentPage===totalPages"
      class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
    >
      Siguiente
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  registros: { type: Array, required: true }
})
const emit = defineEmits(['editar', 'eliminar'])

// 1) Búsqueda y ordenamiento (igual que antes)
const searchTerm = ref('')
const sortKey    = ref(null)
const sortAsc    = ref(true)

function setSort(key) {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value
  else {
    sortKey.value = key
    sortAsc.value = true
  }
}

const displayedRegs = computed(() => {
  const term = searchTerm.value.toLowerCase().trim()
  const arr = props.registros
    .map((r, i) => ({ ...r, __idx: i }))
    .filter(r => {
      if (!term) return true
      return [r.rolada, r.base, r.color, r.observaciones]
        .some(f => String(f).toLowerCase().includes(term))
    })

  if (!sortKey.value) return arr
  return arr.sort((a, b) => {
    const A = String(a[sortKey.value]).toLowerCase()
    const B = String(b[sortKey.value]).toLowerCase()
    return sortAsc.value ? A.localeCompare(B) : B.localeCompare(A)
  })
})

// 2) Paginación
const currentPage = ref(1)
const pageSize    = ref(10)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(displayedRegs.value.length / pageSize.value))
)

const paginatedRegs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return displayedRegs.value.slice(start, start + pageSize.value)
})

// 3) Si cambia filtro/orden/tamaño, volvemos a la página 1
watch(
  [searchTerm, sortKey, sortAsc, pageSize],
  () => { currentPage.value = 1 }
)

// 4) Emisión de eventos
function editar(idx)  { emit('editar', idx) }
function eliminar(idx){ emit('eliminar', idx) }
</script>