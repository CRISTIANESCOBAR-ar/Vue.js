<template>
  <div class="min-h-screen flex bg-gray-50">
    <!-- Detector invisible para mostrar el sidebar -->
    <div
      class="fixed top-0 left-0 h-full w-2 z-40"
      @mouseenter="sidebarVisible = true"
    ></div>

    <!-- Sidebar -->
    <aside
      @mouseleave="scheduleHideSidebar"
      @mousemove="sidebarVisible = true"
      :class="[
        'fixed top-0 left-0 h-full bg-blue-800 text-white z-50 transition-transform duration-300',
        sidebarVisible ? 'translate-x-0' : '-translate-x-full',
        collapsed ? 'w-16' : 'w-64'
      ]"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-blue-600">
        <h2 class="text-lg font-bold" v-if="!collapsed">Menú</h2>
        <button class="md:hidden" @click="sidebarVisible = false">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <nav class="px-2 py-2 space-y-2">
        <SidebarItem icon="📄" label="Carga de datos" :active="active === 'form'" :collapsed="collapsed" @click="setActive('form')" />
        <SidebarItem icon="📋" label="Registros" :active="active === 'list'" :collapsed="collapsed" @click="setActive('list')" />
        <SidebarItem icon="⚙️" label="Configuración" :active="active === 'config'" :collapsed="collapsed" @click="setActive('config')" />
      </nav>
    </aside>

    <!-- Botón hamburguesa en móviles -->
    <button
      class="fixed top-4 left-4 z-40 md:hidden bg-blue-600 text-white p-2 rounded shadow"
      @click="sidebarVisible = true"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

<main
  :class="[
    'flex-1 p-4 transition-all duration-300',
    sidebarVisible && !collapsed ? 'md:ml-64' : 'ml-0'
  ]"
>
  <transition name="fade" mode="out-in">
    <div>
      <FormRegistro v-if="active === 'form'" :registros="registros" />
      <ListaRegistros v-if="active === 'list'" :registros="registros" />
      <div v-if="active === 'config'">Configuración en construcción…</div>
    </div>
  </transition>
</main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import FormRegistro from './components/FormRegistro.vue'
import ListaRegistros from './components/ListaRegistros.vue'
import SidebarItem from './components/SidebarItem.vue'


const sidebarVisible = ref(true)
const collapsed = ref(false)
const active = ref('form')
const registros = ref([])

async function guardarEnOracle(registro) {
  try {
    const response = await fetch('https://tu-api.com/guardar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registro)
    })

    const result = await response.json()
    console.log('Registro enviado a Oracle:', result)
  } catch (error) {
    console.error('Error al guardar en Oracle:', error)
  }
}

watch(registros, (val) => {
  localStorage.setItem('roladas', JSON.stringify(val))
}, { deep: true })

let hideTimer = null

function scheduleHideSidebar() {
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    sidebarVisible.value = false
  }, 1000)
}

function setActive(section) {
  active.value = section
  localStorage.setItem('activeSection', section)
}

/* onMounted(() => {
  const saved = localStorage.getItem('activeSection')
  if (saved) active.value = saved
  collapsed.value = window.innerWidth < 1024
  window.addEventListener('resize', () => {
    collapsed.value = window.innerWidth < 1024
  })
}) */

onMounted(() => {
  const saved = localStorage.getItem('roladas')
  if (saved) registros.value = JSON.parse(saved)

  const savedSection = localStorage.getItem('activeSection')
  if (savedSection) active.value = savedSection

  collapsed.value = window.innerWidth < 1024
  window.addEventListener('resize', () => {
    collapsed.value = window.innerWidth < 1024
  })
})

</script>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>