<template>
  <!-- (favicon movido a la cabecera global móvil) -->


  <!-- Contenido principal -->
  <div class="w-full p-1 md:p-4 space-y-3">
    <!-- FORMULARIO -->
    <form @submit.prevent="submitForm"
      class="bg-white rounded-2xl shadow-xl p-4 md:p-5 space-y-4 border border-slate-200">
      <!-- ROLADA -->
      <div class="flex flex-col md:flex-row md:items-center md:gap-3">
        <label for="rolada" class="mb-1 md:mb-0 w-[7rem] text-sm font-semibold text-slate-700">Rolada</label>
        <div class="flex flex-col">
          <input id="rolada" ref="roladaInput" v-model="form.rolada" type="tel" inputmode="numeric" maxlength="4"
            autocomplete="off" @input="onRoladaInput" placeholder="1234" class="w-[8ch] px-3 py-2 text-sm h-9 border border-slate-300 rounded-lg bg-white
                   focus:bg-yellow-100 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400
                   focus:outline-none focus:shadow-sm transition-all duration-200" required
            @keydown.enter.prevent="handleEnter" @keydown.up.prevent="focusUp('rolada')"
            @keydown.down.prevent="focusDown('rolada')" />
          <p v-if="form.rolada.length > 0 && form.rolada.length < 4" class="text-red-500 text-xs mt-1">
            La rolada debe tener 4 dígitos
          </p>
        </div>
      </div>

      <!-- BASE -->
      <div class="flex flex-col md:flex-row md:items-center md:gap-3">
        <label for="base" class="mb-1 md:mb-0 w-[7rem] text-sm font-semibold text-slate-700">Base</label>
        <input id="base" ref="baseInput" v-model="form.base" @input="onBaseInput" type="text" maxlength="10"
          autocomplete="off" placeholder="U12/1-4760" class="w-[14ch] px-3 py-2 text-sm h-9 border border-slate-300 rounded-lg bg-white
                 focus:bg-yellow-100 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400
                 focus:outline-none focus:shadow-sm transition-all duration-200" required
          @keydown.enter.prevent="handleEnter" @keydown.up.prevent="focusUp('base')"
          @keydown.down.prevent="focusDown('base')" />
      </div>

      <!-- COLOR -->
      <div class="flex flex-col md:flex-row md:items-center md:gap-3">
        <label for="color" class="mb-1 md:mb-0 w-[7rem] text-sm font-semibold text-slate-700">Color</label>
        <input id="color" ref="colorInput" v-model="form.color" @input="onColorInput" type="text" maxlength="4"
          autocomplete="off" placeholder="561" class="w-[7ch] px-3 py-2 text-sm h-9 border border-slate-300 rounded-lg bg-white
                 focus:bg-yellow-100 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400
                 focus:outline-none focus:shadow-sm transition-all duration-200" required
          @keydown.enter.prevent="handleEnter" @keydown.up.prevent="focusUp('color')"
          @keydown.down.prevent="focusDown('color')" />
      </div>

      <!-- METROS -->
      <div class="flex flex-col md:flex-row md:items-center md:gap-3">
        <label for="metros" class="mb-1 md:mb-0 w-[7rem] text-sm font-semibold text-slate-700">Metros</label>
        <div class="flex flex-col">
          <input id="metros" ref="metrosInput" v-model="metrosRaw" @input="onMetrosInput" type="text"
            inputmode="numeric" autocomplete="off" @focus="metrosTouched = true" placeholder="55.000" class="w-[9ch] px-3 py-2 text-sm h-9 border border-slate-300 rounded-lg bg-white
         focus:bg-yellow-100 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400
         focus:outline-none focus:shadow-sm transition-all duration-200" required @keydown.enter.prevent="handleEnter"
            @keydown.up.prevent="focusUp('metros')" @keydown.down.prevent="focusDown('metros')" />
          <p v-if="metrosTouched && debouncedError" class="text-red-500 text-xs mt-1">
            Los metros no pueden ser nulos ni cero
          </p>
        </div>
      </div>

      <!-- OBSERVACIONES -->
      <div class="flex flex-col md:flex-row md:items-start md:gap-3 w-full min-w-0">
        <label for="observaciones" class="mb-1 md:mb-0 md:w-[7rem] w-full text-sm font-semibold text-slate-700">
          Observaciones
        </label>
        <div class="flex-1 min-w-0">
          <textarea id="observaciones" ref="observacionesInput" v-model="form.observaciones" rows="2"
            placeholder="Opcional" class="w-full px-3 py-2 text-sm h-[4.5rem] border border-slate-300 rounded-lg bg-white
             focus:bg-yellow-100 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400
             focus:outline-none focus:shadow-sm transition-all duration-200 resize-none"
            @keydown.enter.prevent="handleEnter" @keydown.up.prevent="focusUp('observaciones')"
            @keydown.down.prevent="focusDown('observaciones')"></textarea>
        </div>
      </div>

      <!-- BOTONES GUARDAR + CANCELAR -->
      <div class="w-full flex justify-start md:justify-end gap-2">
        <Transition name="fade-slide">
          <button
            v-show="editIndex !== null || form.rolada || form.base || form.color || rawMetros || form.observaciones"
            type="button" @click="cancelarEdicion" :disabled="isResetting" :class="[
              'px-4 py-2 text-sm h-9 rounded-lg flex items-center gap-2 transition-all duration-200 font-medium shadow-sm',
              isResetting
                ? 'bg-slate-400 cursor-not-allowed animate-pulse'
                : 'bg-slate-300 hover:bg-slate-400 text-slate-800 hover:shadow-md'
            ]">
            <svg v-if="isResetting" class="animate-spin h-4 w-4 text-slate-700" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 01-8 8z"></path>
            </svg>
            <span>{{ isResetting ? 'Cancelando...' : 'Cancelar' }}</span>
          </button>
        </Transition>
        <Transition name="fade-zoom">
          <button ref="submitButton" type="submit" @keydown.up.prevent="focusUp('submit')" :disabled="isSaving" :class="[
            'px-4 py-2 text-sm h-9 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all duration-200',
            isSaving ? 'bg-blue-400 cursor-not-allowed animate-pulse' : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
          ]">


            <svg v-if="isSaving" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
              viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 01-8 8z"></path>
            </svg>
            <span>{{ isSaving ? 'Guardando...' : 'Guardar' }}</span>
          </button>
        </Transition>


      </div>
    </form>

    <!-- LISTA DE REGISTROS -->
    <div class="overflow-x-auto md:overflow-visible">
      <ListaRegistros :registros="registros" :edit-index="editIndex" :delegate-edit-to-parent="true"
        @editar="editarRegistro" @eliminar="eliminarRegistro" />

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
  /* onMounted, */
  onBeforeUnmount
} from 'vue'
import Swal from 'sweetalert2'
import ListaRegistros from './ListaRegistros.vue'

import { useRegistroStore } from '../stores/registro' // ✅ ruta relativa desde components/
const store = useRegistroStore()
const registros = computed(() => store.registros)

const isSaving = ref(false)

const isResetting = ref(false)



// — Guardar en localStorage cada vez que cambia —
watch(registros, (val) => {
  localStorage.setItem('roladas', JSON.stringify(val))
}, { deep: true })

// — Sidebar auto-hide (sincronizado con localStorage) —
const isCollapsed = ref(false)
let hideTimer = null

// Inicializar desde localStorage para evitar estados divergentes entre componentes
const storedCollapsed = localStorage.getItem('sidebarCollapsed')
if (storedCollapsed !== null) {
  isCollapsed.value = storedCollapsed === 'true'
}

// startHideTimer removed (unused)

// toggleSidebar removed (unused) — sidebar collapsing handled elsewhere

onBeforeUnmount(() => {
  clearTimeout(hideTimer)
})

// — Estado de edición y formulario —
/* const props = defineProps({
  editIndex: Number
}) */

const form = reactive({
  rolada: '',
  base: '',
  color: '',
  observaciones: ''
})

// — Metros: raw + touched + debounce flag —
const metrosRaw = ref('')
const rawMetros = ref('')
const metrosTouched = ref(false)
let debounceTimer = null

// metrosModel removed (unused): use rawMetros / metrosRaw directly

const debouncedError = ref(false)

const isMetrosInvalid = computed(() => {
  if (!rawMetros.value) return true
  const n = Number(rawMetros.value)
  return Number.isNaN(n) || n <= 0
})

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
const roladaInput = ref(null)
const baseInput = ref(null)
const colorInput = ref(null)
const metrosInput = ref(null)
const observacionesInput = ref(null)
const submitButton = ref(null)

const editIndex = ref(null)

const nextField = {
  rolada: baseInput,
  base: colorInput,
  color: metrosInput,
  metros: observacionesInput,
  observaciones: submitButton
}

const prevField = {
  observaciones: metrosInput,
  metros: colorInput,
  color: baseInput,
  base: roladaInput,
  rolada: null,
  submit: observacionesInput
}

function focusUp(field) {
  // focus the previous logical field if exists
  const prevRef = prevField[field]
  if (!prevRef) return
  nextTick(() => {
    try {
      prevRef.value?.focus()
    } catch {
      /* noop */
    }
  })
}

function focusDown(field) {
  // focus the next logical field if exists
  const nextRef = nextField[field]
  if (!nextRef) return
  nextTick(() => {
    const el = nextRef.value
    try {
      if (el && typeof el.focus === 'function') {
        el.focus()
      } else if (el && el.$el && typeof el.$el.focus === 'function') {
        el.$el.focus()
      } else {
        // fallback: small timeout to allow DOM to settle
        setTimeout(() => {
          try {
            if (el && typeof el.focus === 'function') el.focus()
            else if (el && el.$el && typeof el.$el.focus === 'function') el.$el.focus()
          } catch { /* noop */ }
        }, 50)
      }
      try { if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) } catch { /* noop */ }
      try {
        const tag = (el && el.tagName) ? el.tagName.toLowerCase() : (el && el.$el && el.$el.tagName ? el.$el.tagName.toLowerCase() : null)
        if (tag === 'input' || tag === 'textarea' || tag === 'select') {
          const target = (el && el.classList) ? el : (el && el.$el ? el.$el : null)
          if (target && target.classList) {
            target.classList.add('input-flash')
            setTimeout(() => target.classList.remove('input-flash'), 900)
          }
        }
      } catch { /* noop */ }
    } catch {
      /* noop */
    }
  })
}

// Expose a method so parent can request focusing the rolada input
function focusRolada() {
  nextTick(() => {
    const el = roladaInput.value
    try { if (el && typeof el.focus === 'function') el.focus() } catch { /* noop */ }
    try { if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) } catch { /* noop */ }
  })
}

defineExpose({ focusRolada })

function handleEnter(e) {
  const nextRef = nextField[e.target.id]
  if (nextRef) {
    return nextTick(() => nextRef.value?.focus())
  }
  submitForm()
}

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

function onMetrosInput(e) {
  const raw = e.target.value.replace(/\D/g, '')
  const limited = raw.slice(0, 5)

  metrosRaw.value = formatMillar(limited)
  rawMetros.value = limited
  metrosTouched.value = true

  if (limited.length === 5) {
    nextTick(() => {
      observacionesInput.value?.focus()
    })
  }
}

function formatMillar(value) {
  if (!value) return ''
  return Number(value).toLocaleString('es-AR')
}

// — Carga un registro para edición —
function editarRegistro(idx) {
  const r = registros.value[idx]
  form.rolada = r.rolada
  form.base = r.base
  form.color = r.color
  form.observaciones = r.observaciones
  rawMetros.value = r.metros.toString()
  metrosRaw.value = formatMillar(r.metros.toString())
  editIndex.value = idx
  nextTick(() => roladaInput.value.focus())
}

// — Eliminar con confirmación —
async function eliminarRegistro(idx) {
  const r = registros.value[idx]
  const { isConfirmed } = await Swal.fire({
    title: '¿Estás seguro?',
    text: `Vas a eliminar la rolada ${r.rolada} (base: ${r.base}).`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, borrar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  })

  if (!isConfirmed) return

  store.eliminar(idx) // ✅ usa el método del store

  if (editIndex.value === idx) {
    resetForm()
  }

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
  form.rolada = ''
  form.base = ''
  form.color = ''
  form.observaciones = ''
  rawMetros.value = ''
  metrosRaw.value = ''
  metrosTouched.value = false
  editIndex.value = null
  nextTick(() => {
    if (roladaInput.value) roladaInput.value.focus()
  })
}

/* // — Cancelar edición con animación y delay —
async function cancelarEdicion() {
  isResetting.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    resetForm()
  } catch (e) {
    console.warn('Error al cancelar edición:', e)
  } finally {
    isResetting.value = false
  }
} */

async function cancelarEdicion() {
  isResetting.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    resetForm()

    await nextTick(() => {
      const input = roladaInput.value
      if (input) {
        try { input.focus() } catch { /* noop */ }
        try { input.scrollIntoView({ behavior: 'smooth', block: 'center' }) } catch { /* noop */ }
        try { input.classList.add('input-flash'); setTimeout(() => input.classList.remove('input-flash'), 2000) } catch { /* noop */ }
      }
    })

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: 'Formulario reiniciado',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true
    })
  } catch (e) {
    console.warn('Error al cancelar edición:', e)
  } finally {
    isResetting.value = false
  }
}


// — Validación y envío —
async function submitForm() {
  if (isSaving.value) return

  // Validaciones antes de bloquear
  if (form.rolada.length !== 4) {
    await Swal.fire('Error', 'La rolada debe tener 4 dígitos', 'error')
    return
  }
  if (!form.base) {
    await Swal.fire('Error', 'La base no puede estar vacía', 'error')
    return
  }
  if (isMetrosInvalid.value) {
    await Swal.fire('Error', 'Los metros no pueden ser nulos ni cero', 'error')
    return
  }

  isSaving.value = true

  try {
    const registro = {
      rolada: form.rolada,
      base: form.base,
      color: form.color,
      metros: Number(rawMetros.value),
      observaciones: form.observaciones
    }

    await new Promise(resolve => setTimeout(resolve, 600))

    if (editIndex.value !== null) {
      store.actualizar(editIndex.value, { ...registro })
    } else {
      store.agregar({ ...registro })
    }

    await Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: editIndex.value !== null ? 'Registro actualizado' : 'Registro agregado',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true
    })

    resetForm()
  } catch (e) {
    console.warn('Error en submitForm:', e)
  } finally {
    isSaving.value = false
  }
}

</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.fade-zoom-enter-active {
  transition: all 0.3s ease;
}

.fade-zoom-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.fade-zoom-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.fade-zoom-enter-active {
  transition: all 0.3s ease;
}

.fade-zoom-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.fade-zoom-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

@keyframes inputFlash {

  0%,
  100% {
    background-color: transparent;
  }

  /* empezar y permanecer en tonos amarillos para enfatizar el foco */
  30% {
    background-color: #fde68a;
  }

  60% {
    background-color: #fef3c7;
  }
}

.input-flash {
  animation: inputFlash 0.9s ease-in-out 0s 1;
  /* una pasada rápida */
}
</style>
