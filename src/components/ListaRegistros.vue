<template>
  <div>
    <!-- Buscador y selector de tamaño de página -->
    <div class="mb-4 flex items-center justify-between gap-3">
      <div class="flex items-center w-full max-w-xl">
        <label for="searchTerm" class="mr-3 text-sm font-medium text-gray-700">Buscar</label>
        <input
          id="searchTerm"
          v-model="searchTerm"
          type="text"
          placeholder="Filtrar por rolada, base, color, metros u observaciones..."
          class="flex-1 px-3 py-2 border rounded focus:outline-none"
        />
      </div>

<div class="flex items-center gap-2 min-w-[180px]">
  <label for="pageSize" class="text-sm text-gray-600 whitespace-nowrap">Registros por página</label>
  <select
    id="pageSize"
    v-model.number="pageSize"
    class="px-2 py-1 border rounded min-w-[80px] text-sm"
  >
    <option :value="5">5</option>
    <option :value="10">10</option>
    <option :value="20">20</option>
    <option :value="50">50</option>
  </select>
</div>
    </div>

    <div class="overflow-x-auto">
      <table class="registro-table table-fixed w-full border-collapse">
        <colgroup>
          <col style="width:6%;" />
          <col style="width:12%;" />
          <col style="width:5%;" />
          <col style="width:7%;" />
          <col style="width:60%;" />
          <col style="width:10%;" />
        </colgroup>

        <thead class="bg-gray-200">
          <tr>
            <th @click="setSort('rolada')" class="px-3 py-2 text-left cursor-pointer select-none">Rolada</th>
            <th @click="setSort('base')"   class="px-3 py-2 text-left cursor-pointer select-none">Base</th>
            <th @click="setSort('color')"  class="px-3 py-2 text-left cursor-pointer select-none">Color</th>
            <th @click="setSort('metros')" class="px-3 py-2 text-right cursor-pointer select-none">Metros</th>
            <th class="px-3 py-2 text-left">Observaciones</th>
            <th class="px-3 py-2 text-right">Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="item in paginatedRegs" :key="item.__idx" class="odd:bg-white even:bg-gray-50">
            <td class="px-3 py-1"><div class="cell">{{ item.rolada }}</div></td>
            <td class="px-3 py-1"><div class="cell">{{ item.base }}</div></td>
            <td class="px-3 py-1"><div class="cell">{{ item.color }}</div></td>
            <td class="px-3 py-1 text-right"><div class="cell">{{ formatMetros(item.metros) }}</div></td>
            <td class="px-3 py-1"><div class="cell-observ">{{ item.observaciones }}</div></td>
            <td class="px-3 py-1">
              <div class="actions">
<button
  @click="editar(item.__idx)"
  class="btn btn-edit"
  aria-label="Editar"
  v-tippy="'Editar este registro'"
>
                  <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828zM6 12.414V15h2.586L16.9 6.686l-2.586-2.586L6 12.414z"/>
                  </svg>
                </button>
<button
  @click="eliminar(item.__idx)"
  class="btn btn-delete"
  aria-label="Eliminar"
  v-tippy="'Eliminar este registro'"
>
                  <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H3a1 1 0 100 2h14a1 1 0 100-2h-2V3a1 1 0 00-1-1H6zm2 6a1 1 0 00-2 0v7a1 1 0 102 0V8zm4 0a1 1 0 10-2 0v7a1 1 0 102 0V8z" clip-rule="evenodd"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="paginatedRegs.length === 0">
            <td class="px-3 py-2 text-center text-gray-500" :colspan="6">No hay registros</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    <div class="mt-4 flex items-center justify-center gap-3">
      <button @click="prevPage" :disabled="currentPage===1" class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">Anterior</button>
      <span class="text-sm text-gray-700">Página {{ currentPage }} de {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage===totalPages" class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">Siguiente</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  registros: { type: Array, required: true }
})
const emit = defineEmits(['editar', 'eliminar'])

const searchTerm = ref('')
const sortKey = ref(null)
const sortAsc = ref(true)

function setSort(key) {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value
  else {
    sortKey.value = key
    sortAsc.value = true
  }
}

const displayedRegs = computed(() => {
  const term = String(searchTerm.value || '').toLowerCase().trim()
  const arr = (props.registros || []).map((r, i) => ({ ...r, __idx: i }))

  const filtered = arr.filter(r => {
    if (!term) return true
    return [r.rolada, r.base, r.color, r.observaciones, r.metros]
      .some(f => String(f ?? '').toLowerCase().includes(term))
  })

  if (!sortKey.value) return filtered
  return filtered.slice().sort((a, b) => {
    const A = String(a[sortKey.value] ?? '').toLowerCase()
    const B = String(b[sortKey.value] ?? '').toLowerCase()
    return sortAsc.value ? A.localeCompare(B) : B.localeCompare(A)
  })
})

const currentPage = ref(1)
const pageSize = ref(10)

const totalPages = computed(() => Math.max(1, Math.ceil(displayedRegs.value.length / pageSize.value)))

const paginatedRegs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return displayedRegs.value.slice(start, start + pageSize.value)
})

watch([searchTerm, sortKey, sortAsc, pageSize], () => { currentPage.value = 1 })

function formatMetros(v) {
  const n = Number(v ?? 0)
  return n === 0 ? '' : n.toLocaleString('es-AR')
}

function editar(idx) { emit('editar', idx) }
function eliminar(idx) { emit('eliminar', idx) }
function prevPage() { if (currentPage.value > 1) currentPage.value-- }
function nextPage() { if (currentPage.value < totalPages.value) currentPage.value++ }
</script>

<style scoped>
/* Asegura que todo respete el ancho del contenedor */
.registro-table,
.registro-table * {
  box-sizing: border-box;
}

/* Control de layout: tabla fija con colgroup */
.registro-table {
  table-layout: fixed;
  width: 100%;
  border-collapse: collapse;
}

/* Evita que las columnas impongan mínimo */
.registro-table col {
  min-width: 0;
}

/* Celdas compactas */
.registro-table td {
  padding: 6px 6px;
  vertical-align: middle;
  min-width: 0;
}

/* Contenido truncado por defecto */
.registro-table td > div,
.registro-table th > div {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Observaciones puede hacer wrap si es necesario */
.cell-observ {
  white-space: normal;
  word-break: break-word;
}

/* Fuente unificada en todas las celdas */
.cell {
  font-family: inherit;
  font-size: 0.95rem;
  line-height: 1.2;
}

/* Metros: alineación numérica */
.cell-metros {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* Acciones: solo iconos, alineados a la derecha */
.actions {
  display: inline-flex;
  gap: 0.25rem;
  align-items: center;
  justify-content: flex-end;
  white-space: nowrap;
  overflow: hidden;
}

/* Botones compactos */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 3px 6px;
  font-size: 0.78rem;
  border-radius: 6px;
  line-height: 1;
  flex: 0 0 auto;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: none;
  cursor: pointer;
}

/* Iconos dentro del botón */
.btn .icon {
  width: 1em;
  height: 1em;
  flex: 0 0 1em;
}

/* Colores de botones */
.btn-edit {
  background: #2563eb;
  color: #fff;
}
.btn-delete {
  background: #dc2626;
  color: #fff;
}
.btn-edit:hover {
  background: #1e40af;
}
.btn-delete:hover {
  background: #b91c1c;
}

/* Responsive: en pantallas pequeñas, aún más compacto */
@media (max-width: 900px) {
  .btn {
    padding: 3px 5px;
    font-size: 0.72rem;
  }
  .registro-table {
    table-layout: auto;
  }
}
</style>