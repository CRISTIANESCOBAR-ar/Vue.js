<template>
  <div class="w-full" :data-view="windowView">
    <!-- Contenedor visual (similar a Carga de Datos): buscador + selector + lista -->
    <div ref="containerSentinelTop" aria-hidden="true"></div>
    <div ref="wrapperRef" class="bg-white rounded shadow p-3 md:p-4 mt-2 mb-4">
      <!-- Buscador y selector visibles en todas las vistas -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <!-- Buscador -->
        <div class="flex items-center w-full md:max-w-lg">
          <label for="searchTerm" class="mr-3 text-sm font-medium text-gray-700">Buscar</label>
          <input id="searchTerm" v-model="searchTerm" type="text"
            placeholder="Filtrar por rolada, base, color, metros u observaciones..."
            class="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>

        <!-- Selector de registros por página -->
        <div class="flex items-center gap-3">
          <label for="pageSize" class="text-sm text-gray-700 whitespace-nowrap">Registros por página</label>
          <select id="pageSize" v-model.number="pageSize"
            class="px-3 py-2 pr-8 border border-gray-300 rounded-md bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option :value="5">5 registros</option>
            <option :value="10">10 registros</option>
            <option :value="20">20 registros</option>
            <option :value="50">50 registros</option>
          </select>
        </div>
      </div>

      <!-- Vista móvil (ahora decidida por isCardView) -->
      <div v-if="isCardView" class="h-[70vh] overflow-y-auto border rounded">
        <div class="space-y-3 py-3">
          <div v-for="item in paginatedRegs" :key="item.__idx" class="border rounded p-3 shadow-sm bg-white">
            <template v-if="editingRealIndex(getRealIndex(item)) === true">
              <div class="text-sm flex gap-2 items-center min-w-0">
                <label class="w-20 md:w-24 font-medium">Rolada</label>
                <input data-field="rolada" v-model="editModel.rolada" @input="onInlineRoladaInput" inputmode="numeric"
                  maxlength="4" :ref="el => setInputRef(el, getRealIndex(item), 'rolada')"
                  class="px-1 py-1 border rounded w-[6ch] min-w-0 box-border text-center" />
              </div>
              <div class="text-sm flex gap-2 items-center mt-2 min-w-0">
                <label class="w-20 md:w-24 font-medium">Base</label>
                <input data-field="base" v-model="editModel.base" @input="onInlineBaseInput" maxlength="10"
                  :ref="el => setInputRef(el, getRealIndex(item), 'base')"
                  class="px-2 py-1 border rounded w-[10ch] min-w-0" />
              </div>
              <div class="text-sm flex gap-2 items-center mt-2 min-w-0">
                <label class="w-20 md:w-24 font-medium">Color</label>
                <input data-field="color" v-model="editModel.color" @input="onInlineColorInput" maxlength="4"
                  :ref="el => setInputRef(el, getRealIndex(item), 'color')"
                  class="px-1 py-1 border rounded w-[6ch] min-w-0 box-border text-center" />
              </div>
              <div class="text-sm flex gap-2 items-center mt-2 min-w-0">
                <label class="w-20 md:w-24 font-medium">Metros</label>
                <input data-field="metros"
                  :value="(editModel.metros || editModel.metros === 0) ? formatMetros(editModel.metros) : ''"
                  @input="onInlineMetrosInput" inputmode="numeric"
                  :ref="el => setInputRef(el, getRealIndex(item), 'metros')"
                  class="px-2 py-1 border rounded w-[6ch] text-right min-w-0" />
              </div>
              <div class="text-sm flex gap-2 items-center mt-2 min-w-0">
                <label class="w-20 md:w-24 font-medium">Observaciones</label>
                <div class="flex-1 min-w-0">
                  <input data-field="observaciones" v-model="editModel.observaciones"
                    :ref="el => setInputRef(el, getRealIndex(item), 'observaciones')"
                    class="w-full px-2 py-1 border rounded min-w-0" />
                </div>
              </div>

              <div class="flex justify-end gap-2 mt-3">
                <button @click="saveEdit(getRealIndex(item))"
                  class="px-3 py-1 bg-green-100 text-green-800 rounded">Guardar</button>
                <button @click="cancelEdit()" class="px-3 py-1 bg-gray-100 rounded">Cancelar</button>
              </div>
            </template>
            <template v-else>
              <div class="text-sm"><strong>Rolada:</strong> {{ item.rolada }}</div>
              <div class="text-sm"><strong>Base:</strong> {{ item.base }}</div>
              <div class="text-sm"><strong>Color:</strong> {{ item.color }}</div>
              <div class="text-sm"><strong>Metros:</strong> {{ formatMetros(item.metros) }}</div>
              <div class="text-sm"><strong>Observaciones:</strong> {{ item.observaciones }}</div>
              <div class="flex justify-end gap-2 mt-2">
                <button @click="handleEditClick(getRealIndex(item), item)" class="text-blue-600 text-sm hover:underline"
                  v-tippy="'Editar este registro'">Editar</button>
                <button @click="emit('eliminar', getRealIndex(item))" class="text-red-600 text-sm hover:underline"
                  v-tippy="'Eliminar este registro'">Eliminar</button>
              </div>
            </template>
          </div>
          <div v-if="paginatedRegs.length === 0" class="text-center text-gray-500 text-sm">
            No hay registros
          </div>
        </div>
      </div>

      <!-- Vista tabla (compact o desktop) -->
      <div v-else class="overflow-x-auto mt-3">
        <div ref="listScrollRef" class="list-scroll overflow-y-auto border rounded">
          <div ref="tableSentinel" class="table-sentinel" aria-hidden="true"></div>
          <table ref="tableRef" class="registro-table table-auto w-full border-collapse text-sm">
            <colgroup>
              <!-- Rolada: mostrar 4 dígitos (+padding). Ajustado a 8ch para asegurar visibilidad -->
              <col style="width:8ch" />
              <!-- Base: 10 caracteres máximo. Reservamos 13ch para asegurar visibilidad + padding -->
              <col style="width:13ch" />
              <!-- Color: 4 caracteres (mostrar completos) -->
              <col style="width:7ch" />
              <!-- Metros: 5 dígitos + separador de miles (ej: 55.000) -> reservar 7ch -->
              <col style="width:7ch" />
              <!-- Observaciones: flexible (ocupa espacio restante) -->
              <col style="width:auto" />
              <!-- Acciones: espacio para iconos/buttons -->
              <col style="width:80px" />
            </colgroup>
            <thead class="bg-gray-200 text-sm text-gray-800">
              <tr>
                <th @click="setSort('rolada')"
                  class="sticky top-0 z-10 bg-gray-200 px-3 py-2 text-left cursor-pointer select-none">
                  <div class="flex items-center gap-1">
                    <span :class="{ 'font-semibold': sortKey === 'rolada' }">Rolada</span>
                    <span v-if="sortKey === 'rolada'">
                      <ChevronUpIcon v-if="sortAsc === true" class="w-4 h-4 text-gray-600" />
                      <ChevronDownIcon v-else-if="sortAsc === false" class="w-4 h-4 text-gray-600" />
                      <ArrowsUpDownIcon v-else class="w-4 h-4 text-gray-400" />
                    </span>
                  </div>
                </th>

                <th @click="setSort('base')"
                  class="sticky top-0 z-10 bg-gray-200 px-3 py-2 text-left cursor-pointer select-none">
                  <div class="flex items-center gap-1">
                    <span :class="{ 'font-semibold': sortKey === 'base' }">Base</span>
                    <span v-if="sortKey === 'base'">
                      <ChevronUpIcon v-if="sortAsc === true" class="w-4 h-4 text-gray-600" />
                      <ChevronDownIcon v-else-if="sortAsc === false" class="w-4 h-4 text-gray-600" />
                      <ArrowsUpDownIcon v-else class="w-4 h-4 text-gray-400" />
                    </span>
                  </div>
                </th>

                <th @click="setSort('color')"
                  class="sticky top-0 z-10 bg-gray-200 px-3 py-2 text-left cursor-pointer select-none">
                  <div class="flex items-center gap-1">
                    <span :class="{ 'font-semibold': sortKey === 'color' }">Color</span>
                    <span v-if="sortKey === 'color'">
                      <ChevronUpIcon v-if="sortAsc === true" class="w-4 h-4 text-gray-600" />
                      <ChevronDownIcon v-else-if="sortAsc === false" class="w-4 h-4 text-gray-600" />
                      <ArrowsUpDownIcon v-else class="w-4 h-4 text-gray-400" />
                    </span>
                  </div>
                </th>

                <th @click="setSort('metros')"
                  class="sticky top-0 z-10 bg-gray-200 px-3 py-2 text-right cursor-pointer select-none">
                  <div class="flex items-center justify-end gap-1">
                    <span :class="{ 'font-semibold': sortKey === 'metros' }">Metros</span>
                    <span v-if="sortKey === 'metros'">
                      <ChevronUpIcon v-if="sortAsc === true" class="w-4 h-4 text-gray-600" />
                      <ChevronDownIcon v-else-if="sortAsc === false" class="w-4 h-4 text-gray-600" />
                      <ArrowsUpDownIcon v-else class="w-4 h-4 text-gray-400" />
                    </span>
                  </div>
                </th>

                <th class="sticky top-0 z-10 bg-gray-200 px-3 py-2 text-left">Observaciones</th>
                <th class="sticky top-0 z-10 bg-gray-200 px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in paginatedRegs" :key="idx" :class="[
                'odd:bg-white even:bg-gray-50 transition-colors duration-300',
                editingRealIndex(getRealIndex(item)) ? 'bg-yellow-500 is-editing' : ''
              ]">
                <td class=" px-3 py-1">
                  <template v-if="editingRealIndex(getRealIndex(item)) === true">
                    <input v-model="editModel.rolada" @input="onInlineRoladaInput" inputmode="numeric" maxlength="4"
                      data-field="rolada" :ref="el => setInputRef(el, getRealIndex(item), 'rolada')"
                      class="w-full px-2 py-1 border rounded" />
                  </template>
                  <template v-else>
                    {{ item.rolada }}
                  </template>
                </td>
                <td class="px-3 py-1 pr-4">
                  <template v-if="editingRealIndex(getRealIndex(item)) === true">
                    <input v-model="editModel.base" @input="onInlineBaseInput" data-field="base" maxlength="10"
                      :ref="el => setInputRef(el, getRealIndex(item), 'base')"
                      class="w-full px-2 py-1 border rounded" />
                  </template>
                  <template v-else>
                    {{ item.base }}
                  </template>
                </td>
                <td class="px-3 py-1">
                  <template v-if="editingRealIndex(getRealIndex(item)) === true">
                    <input v-model="editModel.color" @input="onInlineColorInput" data-field="color" maxlength="4"
                      :ref="el => setInputRef(el, getRealIndex(item), 'color')"
                      class="w-full px-2 py-1 border rounded" />
                  </template>
                  <template v-else>
                    {{ item.color }}
                  </template>
                </td>
                <td class="px-3 py-1 text-right">
                  <template v-if="editingRealIndex(getRealIndex(item)) === true">
                    <input :value="(editModel.metros || editModel.metros === 0) ? formatMetros(editModel.metros) : ''"
                      @input="onInlineMetrosInput" data-field="metros" inputmode="numeric"
                      :ref="el => setInputRef(el, getRealIndex(item), 'metros')"
                      class="w-full text-right px-2 py-1 border rounded" />
                    <div
                      v-if="(editModel.metros === null || editModel.metros === undefined || Number(editModel.metros) <= 0)"
                      class="text-[10px] text-red-500 mt-1">Los metros no pueden ser nulos ni cero</div>
                  </template>
                  <template v-else>
                    {{ formatMetros(item.metros) }}
                  </template>
                </td>
                <td class="px-3 py-1 observ-td">
                  <template v-if="editingRealIndex(getRealIndex(item)) === true">
                    <div class="observ-wrapper w-full">
                      <input v-model="editModel.observaciones" data-field="observaciones"
                        :ref="el => setInputRef(el, getRealIndex(item), 'observaciones')"
                        class="w-full px-2 py-1 border rounded" />
                    </div>
                  </template>
                  <template v-else>
                    <div class="observ-wrapper cell-observ">{{ item.observaciones }}</div>
                  </template>
                </td>
                <td class="px-2 py-1 text-right whitespace-nowrap actions-td">
                  <div class="flex flex-col items-end gap-2 actions">
                    <div class="flex items-center gap-3">
                      <div v-if="props.mostrarEditar">
                        <template v-if="editingRealIndex(getRealIndex(item)) !== true">
                          <button @click="handleEditClick(getRealIndex(item), item)"
                            class="p-1 rounded hover:bg-blue-100" v-tippy="'Editar registro'">
                            <img src="/icons/edit.svg" alt="Editar" class="h-5 w-5" />
                          </button>
                        </template>
                        <template v-else>
                          <div class="inline-flex items-center gap-2">
                            <button @click="saveEdit(getRealIndex(item))"
                              class="btn px-2 py-1 rounded bg-green-100 hover:bg-green-200 text-green-800">Guardar</button>
                            <button @click="cancelEdit()"
                              class="btn px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Cancelar</button>
                          </div>
                        </template>
                      </div>
                      <button v-if="!editingRealIndex(getRealIndex(item))" @click="emit('eliminar', getRealIndex(item))"
                        class="p-1 rounded hover:bg-red-100" v-tippy="'Eliminar registro'">
                        <img src="/icons/delete.svg" alt="Eliminar" class="h-5 w-5" />
                      </button>
                    </div>
                    <div class="text-[10px] text-gray-500 leading-tight">
                    </div>
                  </div>
                </td>
              </tr>
              <tr v-if="paginatedRegs.length === 0">
                <td class="px-3 py-2 text-center text-gray-500" :colspan="6">No hay registros</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Paginación -->
    <div class="mt-4 flex items-center justify-center gap-3">
      <button @click="prevPage" :disabled="currentPage === 1"
        class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">Anterior</button>
      <span class="text-sm text-gray-700">Página {{ currentPage }} de {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages"
        class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">Siguiente</button>
    </div>

    <!-- Resumen -->
    <p class="text-sm text-gray-600 mt-2 text-center">
      Mostrando {{ startIndex + 1 }}–{{ endIndex }} de {{ totalRegistros }} registros
    </p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ChevronUpIcon, ChevronDownIcon, ArrowsUpDownIcon } from '@heroicons/vue/24/solid'
import { useRegistroStore } from '@/stores/registro'
import Swal from 'sweetalert2'




const props = defineProps({
  registros: Array,
  editIndex: Number,
  mostrarEditar: {
    type: Boolean,
    default: true
  },
  delegateEditToParent: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['editar', 'eliminar', 'actualizar'])

// --- Responsive: detectar ancho de ventana y decidir vista ---
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

function handleResize() {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

// Computeds para decidir la vista
const isCardView = computed(() => windowWidth.value < 640)
// compute a string view name for easier CSS hooks: 'card' | 'compact' | 'desktop'
const windowView = computed(() => {
  if (windowWidth.value < 640) return 'card'
  if (windowWidth.value < 901) return 'compact'
  return 'desktop'
})

// helper to know whether parent listens to 'editar'

// parentHandlesEditar removed: using explicit prop `delegateEditToParent` instead

function handleEditClick(idx, item) {
  // If parent explicitly requested delegation, delegate to parent (FormRegistro uses this)
  if (props.delegateEditToParent) {
    emit('editar', idx)
    return
  }
  // Otherwise start inline edit
  beginEdit(idx, item)
}

// Inline edit state
const editingIdx = ref(null) // real index in the registros array
const editModel = ref({ rolada: '', base: '', color: '', metros: 0, observaciones: '' })

function editingRealIndex(idx) {
  return editingIdx.value === idx
}

// Map to store refs to inputs per row and field: key = `${idx}-${field}`
const inputRefs = ref({})

function setInputRef(el, idx, field) {
  const key = `${idx}-${field}`
  if (!el) {
    // cleanup when component unmounts or v-if removes the input
    if (inputRefs.value[key]) delete inputRefs.value[key]
    return
  }
  inputRefs.value[key] = el
}

function focusEditField(idx, field = 'rolada') {
  // focus after DOM updates
  nextTick(() => {
    const key = `${idx}-${field}`
    const el = inputRefs.value[key]
    if (el && typeof el.focus === 'function') {
      try {
        el.focus()
        // position cursor at end for text inputs
        if (typeof el.setSelectionRange === 'function') {
          const len = (el.value || '').length
          el.setSelectionRange(len, len)
        }
      } catch {
        // ignore focus errors
      }
    }
  })
}

async function beginEdit(idx, item) {
  editingIdx.value = idx
  editModel.value = {
    rolada: item.rolada,
    base: item.base,
    color: item.color,
    metros: item.metros,
    observaciones: item.observaciones
  }
  // Esperar a que Vue actualice el DOM y luego enfocar el primer input (rolada)
  await nextTick()
  focusEditField(idx, 'rolada')
}

function saveEdit(idx) {
  try {
    const nuevo = { ...editModel.value }
    // Validaciones equivalentes a FormRegistro.vue
    if (!nuevo.rolada || String(nuevo.rolada).replace(/\D/g, '').length !== 4) {
      Swal.fire('Error', 'La rolada debe tener 4 dígitos', 'error')
      return
    }
    if (!nuevo.base || String(nuevo.base).trim().length === 0) {
      Swal.fire('Error', 'La base no puede estar vacía', 'error')
      return
    }
    if (!nuevo.color || String(nuevo.color).trim().length === 0) {
      Swal.fire('Error', 'El color no puede estar vacío', 'error')
      return
    }
    const metrosNum = Number(String(nuevo.metros).toString().replace(/\D/g, ''))
    if (Number.isNaN(metrosNum) || metrosNum <= 0) {
      Swal.fire('Error', 'Los metros no pueden ser nulos ni cero', 'error')
      return
    }
    // Normalize fields similar to the form
    nuevo.rolada = String(nuevo.rolada).replace(/\D/g, '').slice(0, 4)
    nuevo.base = String(nuevo.base).toUpperCase().slice(0, 10)
    nuevo.color = String(nuevo.color).toUpperCase().slice(0, 4)
    nuevo.metros = metrosNum
    // update store directly for immediate effect
    const store = useRegistroStore()
    store.actualizar(idx, nuevo)
    // emit for parent if it wants to react
    emit('actualizar', { idx, nuevo })
    // show toast
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Registro actualizado', showConfirmButton: false, timer: 1500, timerProgressBar: true })
  } catch (err) {
    console.error('Error saving edit', err)
    Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Error al actualizar', showConfirmButton: false, timer: 1500, timerProgressBar: true })
  } finally {
    editingIdx.value = null
  }
}

function cancelEdit() {
  editingIdx.value = null
}

// Manejo de input para rolada en edición inline: solo dígitos y max 4; si llega a 4, enfocar base
function onInlineRoladaInput(e) {
  try {
    const el = e.target
    let val = String(el.value || '')
    val = val.replace(/\D/g, '').slice(0, 4)
    // Actualizar el modelo reactivo
    editModel.value.rolada = val
    // Si llegó a 4 dígitos, mover foco al input base dentro de la misma fila
    if (val.length === 4) {
      // buscar el siguiente input con data-field="base" en el mismo row
      const row = el.closest('tr') || el.closest('div')
      if (row) {
        const next = row.querySelector('input[data-field="base"]')
        if (next) next.focus()
      }
    }
  } catch (err) {
    console.warn('onInlineRoladaInput error', err)
  }
}

// Manejo de input para base en edición inline: uppercase, max 10, si llega a 10 enfocar color
function onInlineBaseInput(e) {
  try {
    const el = e.target
    let val = String(el.value || '')
    val = val.toUpperCase().slice(0, 10)
    editModel.value.base = val
    if (val.length === 10) {
      const row = el.closest('tr') || el.closest('div')
      if (row) {
        const next = row.querySelector('input[data-field="color"]')
        if (next) next.focus()
      }
    }
  } catch (err) {
    console.warn('onInlineBaseInput error', err)
  }
}

// Manejo de input para color en edición inline: uppercase, max 4, si llega a 4 enfocar metros
function onInlineColorInput(e) {
  try {
    const el = e.target
    let val = String(el.value || '')
    val = val.toUpperCase().slice(0, 4)
    editModel.value.color = val
    if (val.length === 4) {
      const row = el.closest('tr') || el.closest('div')
      if (row) {
        const next = row.querySelector('input[data-field="metros"]')
        if (next) next.focus()
      }
    }
  } catch (err) {
    console.warn('onInlineColorInput error', err)
  }
}

// Metros inline: aceptar solo dígitos (máx 5), guardar número en editModel.metros,
// mostrar con separador de miles y, cuando el raw alcance 5, enfocar observaciones
function onInlineMetrosInput(e) {
  try {
    const el = e.target
    // obtener valor sin formato (quitar todo lo que no sea dígito)
    const raw = String(el.value || '').replace(/\D/g, '').slice(0, 5)
    const num = raw ? Number(raw) : null
    editModel.value.metros = num
    // actualizar display: reemplazamos el valor visible por el formateado
    el.value = num === null || Number.isNaN(num) ? '' : formatMetros(num)
    // si raw llegó a 5 dígitos, saltar a observaciones
    if (raw.length === 5) {
      const row = el.closest('tr') || el.closest('div')
      if (row) {
        const next = row.querySelector('input[data-field="observaciones"]')
        if (next) next.focus()
      }
    }
  } catch (err) {
    console.warn('onInlineMetrosInput error', err)
  }
}

const searchTerm = ref('')
const pageSize = ref(10)
const currentPage = ref(1)
const sortKey = ref('')
const sortAsc = ref(true)


// Obtener el índice real en el array original
function getRealIndex(item) {
  return props.registros.findIndex(r =>
    r.rolada === item.rolada &&
    r.base === item.base &&
    r.color === item.color &&
    r.metros === item.metros &&
    r.observaciones === item.observaciones
  )
}

// Ordenamiento
function setSort(key) {
  if (sortKey.value === key) {
    if (sortAsc.value === null) {
      sortAsc.value = true
    } else if (sortAsc.value === true) {
      sortAsc.value = false
    } else {
      sortAsc.value = null
    }
  } else {
    sortKey.value = key
    sortAsc.value = true
  }
}


// Filtrado por término de búsqueda
const filteredRegs = computed(() => {
  if (!searchTerm.value.trim()) return props.registros
  const term = searchTerm.value.toLowerCase()
  return props.registros.filter(item =>
    [item.rolada, item.base, item.color, item.metros, item.observaciones]
      .some(field => String(field).toLowerCase().includes(term))
  )
})


const sortedRegs = computed(() => {
  if (!sortKey.value || sortAsc.value === null) return filteredRegs.value
  return [...filteredRegs.value].sort((a, b) => {
    const valA = a[sortKey.value]
    const valB = b[sortKey.value]
    return sortAsc.value
      ? String(valA).localeCompare(String(valB), undefined, { numeric: true })
      : String(valB).localeCompare(String(valA), undefined, { numeric: true })
  })
})

// Paginación
const totalRegistros = computed(() => sortedRegs.value.length)
const totalPages = computed(() => Math.ceil(totalRegistros.value / pageSize.value))
const startIndex = computed(() => (currentPage.value - 1) * pageSize.value)
const endIndex = computed(() =>
  Math.min(startIndex.value + pageSize.value, totalRegistros.value)
)

const paginatedRegs = computed(() => {
  return sortedRegs.value.slice(startIndex.value, endIndex.value)
})

watch(() => props.registros.length, () => {
  currentPage.value = 1
})

/* eslint-env browser */
/* global document */
// Sticky header: dynamic top calculation and intersection observer
const listScrollRef = ref(null)
const tableRef = ref(null)
const tableSentinel = ref(null)
let headerObserver = null
const containerSentinelTop = ref(null)
const wrapperRef = ref(null)
let affixObserver = null
const wrapperPlaceholder = ref(null)
let updateAffix = null

function computeStickyTop() {
  try {
    // If there is a fixed header (global), measure its height
    const globalHeader = document.querySelector('header')
    const top = globalHeader ? globalHeader.getBoundingClientRect().height : 0
    if (listScrollRef.value && listScrollRef.value.style) {
      listScrollRef.value.style.setProperty('--sticky-top', `${top}px`)
    }
  } catch {
    /* noop */
  }
}

function attachHeaderObserver() {
  if (!tableSentinel.value || !listScrollRef.value || !tableRef.value) return
  // compute initial top
  computeStickyTop()
  // observe resize of header and container
  try {
    /* global IntersectionObserver */
    headerObserver = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const isVisible = e.isIntersecting
        if (tableRef.value && tableRef.value.classList) {
          if (!isVisible) tableRef.value.classList.add('is-stuck')
          else tableRef.value.classList.remove('is-stuck')
        }
      }
    }, { root: listScrollRef.value, threshold: [0, 1] })
    headerObserver.observe(tableSentinel.value)
  } catch {
    /* noop */
  }
}

onMounted(() => {
  // attach observer after nextTick to ensure DOM nodes present
  nextTick(() => {
    try { attachHeaderObserver() } catch { /* noop */ }
    // recompute on window resize
    window.addEventListener('resize', computeStickyTop)
    // attach affix observer for the top of the wrapper
    try {
      if (containerSentinelTop.value && wrapperRef.value) {
        const applyAffix = () => {
          if (!wrapperRef.value) return
          const rect = wrapperRef.value.getBoundingClientRect()
          const globalHeader = document.querySelector('header')
          const headerTop = globalHeader ? globalHeader.getBoundingClientRect().height : 0
          // create placeholder if missing
          if (!wrapperPlaceholder.value) {
            const ph = document.createElement('div')
            ph.style.height = `${rect.height}px`
            wrapperRef.value.parentNode.insertBefore(ph, wrapperRef.value)
            wrapperPlaceholder.value = ph
          }
          // apply fixed positioning inline to match original flow
          wrapperRef.value.style.position = 'fixed'
          wrapperRef.value.style.top = `${headerTop}px`
          wrapperRef.value.style.left = `${rect.left}px`
          wrapperRef.value.style.width = `${rect.width}px`
          wrapperRef.value.style.zIndex = '60'
          wrapperRef.value.classList.add('is-affixed')
        }

        const removeAffix = () => {
          if (!wrapperRef.value) return
          wrapperRef.value.classList.remove('is-affixed')
          try {
            wrapperRef.value.style.position = ''
            wrapperRef.value.style.top = ''
            wrapperRef.value.style.left = ''
            wrapperRef.value.style.width = ''
            wrapperRef.value.style.zIndex = ''
          } catch { /* noop */ }
          if (wrapperPlaceholder.value) {
            try { wrapperPlaceholder.value.remove() } catch { /* noop */ }
            wrapperPlaceholder.value = null
          }
        }

        affixObserver = new IntersectionObserver((entries) => {
          for (const e of entries) {
            const visible = e.isIntersecting
            if (!visible) {
              applyAffix()
            } else {
              removeAffix()
            }
          }
        }, { root: null, threshold: 0 })

        affixObserver.observe(containerSentinelTop.value)

        // keep affixed element positioned correctly on resize/scroll
        updateAffix = () => {
          if (!wrapperRef.value || !wrapperRef.value.classList.contains('is-affixed')) return
          try {
            const rect = wrapperPlaceholder.value ? wrapperPlaceholder.value.getBoundingClientRect() : wrapperRef.value.getBoundingClientRect()
            const globalHeader = document.querySelector('header')
            const headerTop = globalHeader ? globalHeader.getBoundingClientRect().height : 0
            wrapperRef.value.style.left = `${rect.left}px`
            wrapperRef.value.style.width = `${rect.width}px`
            wrapperRef.value.style.top = `${headerTop}px`
          } catch { /* noop */ }
        }

        window.addEventListener('resize', updateAffix)
        window.addEventListener('scroll', updateAffix, true)
      }
    } catch { /* noop */ }
  })
})

onBeforeUnmount(() => {
  try { if (headerObserver) headerObserver.disconnect() } catch { /* noop */ }
  try { window.removeEventListener('resize', computeStickyTop) } catch { /* noop */ }
  try { if (affixObserver) affixObserver.disconnect() } catch { /* noop */ }
  try { if (updateAffix) window.removeEventListener('resize', updateAffix) } catch { /* noop */ }
  try { if (updateAffix) window.removeEventListener('scroll', updateAffix, true) } catch { /* noop */ }
  try { if (wrapperPlaceholder.value) wrapperPlaceholder.value.remove() } catch { /* noop */ }
})

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

// Resetear página al cambiar filtros
watch([searchTerm, pageSize], () => {
  currentPage.value = 1
})

// Formato de metros
function formatMetros(value) {
  return Number(value).toLocaleString('es-AR', {
    maximumFractionDigits: 0,
    useGrouping: true
  })
}

// Emitir eventos (eliminar se usa directamente desde la template)

watch(() => props.registros.length, () => {
  currentPage.value = 1
})

</script>

<style scoped>
/* Asegura que todo respete el ancho del contenedor */
.registro-table,
.registro-table * {
  box-sizing: border-box;
}

/* Control de layout: tabla fija con colgroup */
.registro-table {
  /* por defecto usamos layout automático para que la tabla no reserve espacio fijo para acciones */
  table-layout: auto;
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
.registro-table th>div {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Para las celdas de contenido (td) permitimos overflow visible en columnas de acciones */
.registro-table td>div {
  /* por defecto ocultamos overflow, pero las celdas de acciones usarán clase específica */
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
  gap: 0.35rem;
  align-items: center;
  justify-content: flex-end;
  white-space: nowrap;
  /* permitir que el contenido pueda mostrarse completo */
  overflow: visible;
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
  /* permitir mostrar texto completo en botones compactos */
  overflow: visible;
  text-overflow: unset;
  white-space: nowrap;
  border: none;
  cursor: pointer;
  min-width: 56px;
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
    table-layout: fixed;
    /* en móviles mantenemos compacto */
  }
}

/* Asegurar que la celda de acciones no recorte su contenido (para anchos intermedios) */
.actions-td {
  overflow: visible !important;
}

/* Observaciones: limitar ancho máximo y usar un wrapper flex para controlar el espacio ocupado */
.observ-td {
  min-width: 0;
  /* permitir que reduzca */
}

.observ-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
}

/* Inline edit input sizing by data-field to ensure all chars are visible on desktop */
@media (min-width: 900px) {
  input[data-field="rolada"] {
    width: 6.5ch !important;
    /* espacio para 4 dígitos + padding */
    text-align: center;
  }

  input[data-field="color"] {
    width: 6ch !important;
    /* 4 chars comfortably */
    text-align: center;
  }

  input[data-field="metros"] {
    width: 7.5ch !important;
    /* 5 digits + thousands separator */
    text-align: right;
  }

  input[data-field="base"] {
    width: 13ch !important;
    /* up to 10 chars + padding */
    text-align: left;
    box-sizing: border-box;
  }

  /* Ensure table columns don't collapse below intended width on desktop */
  .registro-table {
    table-layout: fixed;
  }

  .registro-table td {
    overflow: visible;
  }
}

/* Make the table header sticky inside the scrolling container */
.list-scroll .registro-table thead th {
  position: sticky;
  top: 0;
  z-index: 40;
  /* above table rows */
  background: #f3f4f6;
  /* match .bg-gray-200 */
}

.list-scroll .registro-table thead th>div {
  background: transparent;
  /* avoid double backgrounds */
}

.list-scroll .registro-table thead th {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.observ-wrapper input,
.observ-wrapper textarea {
  width: 100%;
  min-width: 0;
}

/* En móviles la observación puede extenderse */
@media (max-width: 900px) {
  .observ-wrapper {
    max-width: 100%;
  }

  /* Permitir que los encabezados hagan wrap y no se corten en pantallas pequeñas */
  .registro-table thead th>div {
    white-space: normal;
    line-height: 1.05;
  }
}

/* Si una fila está en edición, reducir el ancho de la observación para dejar espacio a acciones */
/* No forzamos un corte rígido en la fila editada; usamos flexibilidad gradual */
.is-editing .observ-wrapper {
  max-width: none;
}

/* Responsive list height: use most of the viewport on desktop */
.list-scroll {
  /* mobile: allow natural height */
  max-height: 60vh;
}

@media (min-width: 1024px) {

  /* On desktop, reserve space for header/footer/sidebar (approx 8rem) */
  .list-scroll {
    max-height: calc(100vh - 8rem);
  }
}

/* position the scroll container so sticky headers stick relative to it */
.list-scroll {
  position: relative;
}

.list-scroll .registro-table thead {
  position: sticky;
  top: var(--sticky-top, 0px);
  z-index: 50;
  transition: box-shadow 180ms ease, transform 180ms ease;
}

.list-scroll .registro-table thead {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

/* Elevation animation when header becomes stuck */
.registro-table.is-stuck thead {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}

.vue3-select {
  font-size: 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 6px 8px;
  background-color: white;
  color: #111827;
  width: 7rem;
}

.vue3-select .dropdown {
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.vue3-select .dropdown-item {
  color: #111827;
  padding: 6px 10px;
}

.vue3-select .dropdown-item:hover {
  background-color: #f3f4f6;
}

.custom-select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: none;
  /* oculta flecha nativa en algunos navegadores */
}

tr {
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

tr {
  transition: background-color 0.3s ease;
}

/* Desktop: usar layout flex por fila para que Observaciones sea flexible y acciones tengan ancho fijo */
/* Aplicamos este layout solo a partir de 901px para evitar conflictos con las reglas de <=900px */
@media (min-width: 901px) {

  /* Treat the table as block so flex rows can control layout precisely */
  .registro-table {
    display: block;
    width: 100%;
  }

  .registro-table thead,
  .registro-table tbody {
    display: block;
  }

  .registro-table thead tr,
  .registro-table tbody tr {
    display: flex;
    align-items: center;
    width: 100%;
    /* ensure the flex row stretches the full table width */
  }

  .registro-table thead th,
  .registro-table tbody td {
    display: block;
    /* cada celda será un bloque dentro del flex row */
    padding: 6px 8px;
    box-sizing: border-box;
    min-width: 0;
  }

  /* Anchos por columna (coinciden con el orden de columnas) */
  /* Flex-basis aproximado por columna según max chars (px aproximados para consistencia) */
  .registro-table tbody td:nth-child(1),
  .registro-table thead th:nth-child(1) {
    flex: 0 0 60px;
  }

  /* Rolada 4 */
  .registro-table tbody td:nth-child(2),
  .registro-table thead th:nth-child(2) {
    flex: 0 0 140px;
  }

  /* Base 10 */
  .registro-table tbody td:nth-child(3),
  .registro-table thead th:nth-child(3) {
    flex: 0 0 56px;
  }

  /* Color 4 */
  .registro-table tbody td:nth-child(4),
  .registro-table thead th:nth-child(4) {
    flex: 0 0 72px;
  }

  /* Metros 5 */
  /* Observaciones: flexible y toma el espacio restante (desde 901px en adelante) */
  .registro-table tbody td:nth-child(5),
  .registro-table thead th:nth-child(5) {
    flex: 1 1 0%;
    min-width: 140px;
  }

  /* Acciones: espacio para iconos y botones; tamaño fijo razonable para mantener alineación */
  .registro-table tbody td:nth-child(6),
  .registro-table thead th:nth-child(6) {
    flex: 0 0 80px;
    max-width: 120px;
    min-width: 56px;
    text-align: right;
  }

  /* Asegurar que los botones estén pegados a la derecha dentro de la celda de acciones */
  .actions {
    justify-content: flex-end;
  }

  /* --- Edición inline: cuando una fila está en modo edición, reducir el ancho de Observaciones
     para dejar espacio a los botones 'Guardar / Cancelar' y permitir que la celda de acciones crezca --- */
  .registro-table tbody tr.is-editing td:nth-child(5) {
    /* Observaciones se hace más estricta en edición */
    flex: 1 1 0%;
    min-width: 60px;
    /* Reservar espacio para las columnas fijas (aprox.): rolada+base+color+metros+acciones (~420px)
       Ajusta este valor si quieres más/menos espacio para observaciones */
    max-width: calc(100% - 420px);
    overflow: hidden;
  }

  .registro-table tbody tr.is-editing td:nth-child(5) .observ-wrapper input {
    width: 100%;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    /* mostrar en una línea para evitar que el input haga la fila más alta */
  }

  .registro-table tbody tr.is-editing td:nth-child(6) {
    /* Permitir que la celda de acciones crezca para mostrar botones de texto en edición */
    flex: 0 0 auto;
    min-width: 120px;
    max-width: 220px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  /* Asegurar que los botones en edición no provoquen overflow de la fila, permitir que envuelvan si es necesario */
  .registro-table tbody tr.is-editing .actions {
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}
</style>