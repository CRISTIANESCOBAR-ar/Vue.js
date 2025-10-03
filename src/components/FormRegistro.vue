<template>
  <!-- Sidebar -->
  <aside :class="{ collapsed: isCollapsed }">
    <button @click="toggleSidebar" class="p-4 focus:outline-none">
      <img
        src="/favicon.ico"
        alt="Menú"
        class="h-6 w-6"
      />
    </button>
    <!-- aquí va el contenido del menú lateral -->
  </aside>

  <!-- Contenido principal -->
  <div class="w-full max-w-screen-xl p-4 space-y-6">
    <!-- FORMULARIO -->
    <form
      @submit.prevent="submitForm"
      class="bg-white rounded shadow p-6 space-y-6"
    >
      <!-- ROLADA -->
      <div class="flex flex-col md:flex-row md:items-center md:gap-4">
        <label for="rolada" class="mb-1 md:mb-0 w-[7rem] text-sm font-medium text-gray-700">
          Rolada
        </label>
        <div class="flex flex-col">
          <input
            id="rolada"
            ref="roladaInput"
            v-model="form.rolada"
            type="tel"
            inputmode="numeric"
            maxlength="4"
            autocomplete="off"
            @input="onRoladaInput"
            placeholder="1234"
            class="flex-none w-[8ch] form-input bg-white
                   focus:bg-yellow-200 focus:ring-2 focus:ring-yellow-400
                   focus:outline-none focus:shadow-md
                   transition-colors duration-200"
            required
            @keydown.enter.prevent="handleEnter"
          />
          <p
            v-if="form.rolada.length > 0 && form.rolada.length < 4"
            class="text-red-500 text-xs mt-1"
          >
            La rolada debe tener 4 dígitos
          </p>
        </div>
      </div>

      <!-- BASE -->
      <div class="flex flex-col md:flex-row md:items-center md:gap-4">
        <label for="base" class="mb-1 md:mb-0 w-[7rem] text-sm font-medium text-gray-700">
          Base
        </label>
        <input
          id="base"
          ref="baseInput"
          v-model="form.base"
          @input="onBaseInput"
          type="text"
          maxlength="10"
          autocomplete="off"
          placeholder="U12/1-4760"
          class="flex-none w-[14ch] form-input bg-white
                 focus:bg-yellow-200 focus:ring-2 focus:ring-yellow-400
                 focus:outline-none focus:shadow-md
                 transition-colors duration-200"
          required
          @keydown.enter.prevent="handleEnter"
        />
      </div>

      <!-- COLOR -->
      <div class="flex flex-col md:flex-row md:items-center md:gap-4">
        <label for="color" class="mb-1 md:mb-0 w-[7rem] text-sm font-medium text-gray-700">
          Color
        </label>
        <input
          id="color"
          ref="colorInput"
          v-model="form.color"
          @input="onColorInput"
          type="text"
          maxlength="4"
          autocomplete="off"
          placeholder="561"
          class="flex-none w-[7ch] form-input bg-white
                 focus:bg-yellow-200 focus:ring-2 focus:ring-yellow-400
                 focus:outline-none focus:shadow-md
                 transition-colors duration-200"
          required
          @keydown.enter.prevent="handleEnter"
        />
      </div>

      <!-- METROS -->
      <div class="flex flex-col md:flex-row md:items-center md:gap-4">
        <label for="metros" class="mb-1 md:mb-0 w-[7rem] text-sm font-medium text-gray-700">
          Metros
        </label>
        <div class="flex flex-col">
          <input
            id="metros"
            ref="metrosInput"
            v-model="metrosModel"
            @input="onMetrosInput"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            placeholder="55.000"
            class="flex-none w-[9ch] form-input bg-white
                   focus:bg-yellow-200 focus:ring-2 focus:ring-yellow-400
                   focus:outline-none focus:shadow-md
                   transition-colors duration-200"
            required
            @keydown.enter.prevent="handleEnter"
          />
        <p v-if="debouncedError" class="text-red-500 text-xs mt-1">
          Los metros no pueden ser nulos ni cero
        </p>
        </div>
      </div>

      <!-- OBSERVACIONES -->
      <div class="flex flex-col md:flex-row md:items-start md:gap-4">
        <label for="observaciones" class="mb-1 md:mb-0 w-[7rem] text-sm font-medium text-gray-700">
          Observaciones
        </label>
        <div class="flex-1">
          <textarea
            id="observaciones"
            ref="observacionesInput"
            v-model="form.observaciones"
            rows="3"
            placeholder="Opcional"
            class="w-full form-textarea bg-white
                   focus:bg-yellow-200 focus:ring-2 focus:ring-yellow-400
                   focus:outline-none focus:shadow-md
                   transition-colors duration-200"
            @keydown.enter.prevent="handleEnter"
          ></textarea>
        </div>
      </div>

      <!-- BOTÓN GUARDAR -->
      <div class="text-right">
        <button
          ref="submitButton"
          type="submit"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Guardar
        </button>
      </div>
    </form>

    <!-- LISTA DE REGISTROS -->
    <div v-if="props.registros.length" class="bg-white rounded shadow p-6">
      <h2 class="text-lg font-semibold mb-4">Registros agregados</h2>
      <ListaRegistros
        :registros="props.registros"
        @editar="editarRegistro"
        @eliminar="eliminarRegistro"
      />
    </div>
  </div>
</template>

<script setup>
import { 
  ref, 
  reactive, 
  computed, 
  watch, 
  nextTick, 
  onMounted, 
  onBeforeUnmount 
} from 'vue'
import Swal from 'sweetalert2'
import ListaRegistros from './ListaRegistros.vue'

// — Sidebar auto-hide —
const isCollapsed = ref(false)
const hideDelay   = 1000
let hideTimer     = null

function startHideTimer() {
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    isCollapsed.value = true
    localStorage.setItem('sidebarCollapsed', 'true')
  }, hideDelay)
}

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem('sidebarCollapsed', String(isCollapsed.value))
  startHideTimer()
}

onMounted(() => {
  const stored = localStorage.getItem('sidebarCollapsed')
  isCollapsed.value = stored === 'true'
  startHideTimer()
})

onBeforeUnmount(() => {
  clearTimeout(hideTimer)
})

// — Props y emits —
const props = defineProps({
  registros: { type: Array, required: true }
})
const emit = defineEmits(['nuevo-registro'])

// — Estado de edición y formulario —
const editIndex = ref(null)
const form = reactive({
  rolada:        '',
  base:          '',
  color:         '',
  observaciones: ''
})

// — Metros: raw + touched + debounce flag —
const rawMetros      = ref('')
const metrosTouched  = ref(false)
const debouncedError = ref(false)
let debounceTimer    = null

// — Computed proxy para v-model —
const metrosModel = computed({
  get() {
    return rawMetros.value
      ? Number(rawMetros.value).toLocaleString('es-AR')
      : ''
  },
  set(val) {
    rawMetros.value = String(val).replace(/\D/g, '').slice(0, 5)
  }
})

// — Validación reactiva sin debounce —
const isMetrosInvalid = computed(() => {
  if (!rawMetros.value) return true
  const n = Number(rawMetros.value)
  return Number.isNaN(n) || n <= 0
})

// — Watch para debouncear el error 200 ms —
watch(
  [rawMetros, metrosTouched],
  () => {
    clearTimeout(debounceTimer)
    if (!metrosTouched.value) {
      debouncedError.value = false
      return
    }
    debounceTimer = setTimeout(() => {
      debouncedError.value = isMetrosInvalid.value
    }, 200)
  }
)

// — Refs para focus —
const roladaInput        = ref(null)
const baseInput          = ref(null)
const colorInput         = ref(null)
const metrosInput        = ref(null)
const observacionesInput = ref(null)
const submitButton       = ref(null)

// — Mapa id → siguiente ref —
const nextField = {
  rolada:        baseInput,
  base:          colorInput,
  color:         metrosInput,
  metros:        observacionesInput,
  observaciones: submitButton
}

// — Avanza con ENTER o envía —
function handleEnter(e) {
  const nextRef = nextField[e.target.id]
  if (nextRef) {
    return nextTick(() => nextRef.value?.focus())
  }
  submitForm()
}

// — Auto-jump por longitud —
function onRoladaInput(e) {
  form.rolada = e.target.value.replace(/\D/g, '').slice(0, 4)
  if (form.rolada.length === 4) nextTick(() => baseInput.value.focus())
}
function onBaseInput(e) {
  form.base = e.target.value.toUpperCase().slice(0, 10)
  if (form.base.length === 10) nextTick(() => colorInput.value.focus())
}
function onColorInput(e) {
  form.color = e.target.value.toUpperCase().slice(0, 4)
  if (form.color.length === 4) nextTick(() => metrosInput.value.focus())
}

// — Marca touched y actualiza rawMetros —
function onMetrosInput(e) {
  if (!metrosTouched.value) metrosTouched.value = true
  rawMetros.value = String(e.target.value).replace(/\D/g, '').slice(0, 5)
}

// — Carga un registro para edición —
function editarRegistro(idx) {
  const r = props.registros[idx]
  form.rolada        = r.rolada
  form.base          = r.base
  form.color         = r.color
  form.observaciones = r.observaciones
  rawMetros.value    = r.metros.toString()
  editIndex.value    = idx
  nextTick(() => roladaInput.value.focus())
}

// 1. Creamos el mixin con nuestras clases
const swalCustom = Swal.mixin({
  customClass: {
    popup:    'p-6 rounded-lg shadow-lg',
    title:    'text-xl font-semibold mb-4',
    content:  'text-sm mb-6',
    confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded mr-2',
    cancelButton:  'bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium px-4 py-2 rounded'
  },
  buttonsStyling: false,
  showCancelButton: true,
  reverseButtons: true
})



// — Elimina y resetea edición si corresponde —
// — Eliminar con confirmación y toast —
async function eliminarRegistro(idx) {
  const r = props.registros[idx]
  const { isConfirmed } = await swalCustom.fire({
    title: '¿Estás seguro?',
    text: `Vas a eliminar la rolada ${r.rolada} (base: ${r.base}).`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, borrar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  })

  if (!isConfirmed) return

  props.registros.splice(idx, 1)

  // Si estabas editando este registro, resetea el formulario
  if (editIndex.value === idx) {
    resetForm()
  }

  // Toast de eliminación
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: 'Registro eliminado',
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true
  })
}

// — Reset completo del formulario —
function resetForm() {
  form.rolada        = ''
  form.base          = ''
  form.color         = ''
  form.observaciones = ''
  rawMetros.value    = ''
  metrosTouched.value = false
  editIndex.value    = null
  nextTick(() => roladaInput.value.focus())
}

// — Validación y envío —
function submitForm() {
  if (form.rolada.length !== 4) {
    return Swal.fire('Error', 'La rolada debe tener 4 dígitos', 'error')
  }
  if (!form.base) {
    return Swal.fire('Error', 'La base no puede estar vacía', 'error')
  }
  if (isMetrosInvalid.value) {
    return Swal.fire('Error', 'Los metros no pueden ser nulos ni cero', 'error')
  }

  const registro = {
    rolada:        form.rolada,
    base:          form.base,
    color:         form.color,
    metros:        Number(rawMetros.value),
    observaciones: form.observaciones
  }

  if (editIndex.value !== null) {
    props.registros[editIndex.value] = { ...registro }
  } else {
    props.registros.unshift({ ...registro })
  }

  emit('nuevo-registro', registro)

  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: editIndex.value !== null
      ? 'Registro actualizado'
      : 'Registro agregado',
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true
  })

  resetForm()
}
</script>