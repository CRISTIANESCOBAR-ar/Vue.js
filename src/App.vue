<template>
  <div class="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden">
    <!-- invisible detector to open sidebar when hovered on desktop -->
    <div class="fixed top-0 left-0 h-full w-12 z-50" @mouseenter="onLeftEdgeEnter"></div>

    <!-- Sidebar -->
    <aside 
      @mouseleave="scheduleHideSidebar" 
      @mouseenter="clearHideTimer" 
      :class="[
        'fixed top-0 left-0 h-full bg-blue-800 text-white z-[9999] transition-all duration-500 ease-in-out',
        sidebarVisible ? 'translate-x-0' : '-translate-x-full',
        collapsed ? 'w-16' : 'w-64'
      ]" 
      aria-hidden="false"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-blue-600">
        <h2 class="text-lg font-bold" v-if="!collapsed">Análisis Stock</h2>
        <!-- Desktop collapse/expand button -->
        <button 
          class="hidden lg:inline-flex items-center justify-center p-1 rounded hover:bg-blue-700 ml-2"
          :aria-label="collapsed ? 'Abrir menú' : 'Colapsar menú'" 
          @click="desktopToggle" 
          title="Colapsar/abrir menú"
        >
          <template v-if="!collapsed">
            <!-- X icon to collapse -->
            <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </template>
          <template v-else>
            <!-- Chevron-right icon to expand -->
            <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </template>
        </button>
        <button class="lg:hidden" @click="sidebarVisible = false" aria-label="Cerrar menú móvil">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav class="px-2 py-2 space-y-2">
        <SidebarItem 
          v-for="item in menuItems" 
          :key="item.path"
          :icon="item.icon" 
          :label="item.name" 
          :active="$route.path === item.path" 
          :collapsed="collapsed"
          @click="setActive(item.path)" 
        />
      </nav>
    </aside>

    <!-- Mobile / tablet header (visible under 1024px) -->
    <header class="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-1 bg-white">
      <button 
        aria-label="Toggle menú" 
        :aria-expanded="String(sidebarVisible)"
        class="bg-blue-600 text-white p-0.5 rounded shadow w-9 h-9 flex items-center justify-center"
        @click.stop.prevent="mobileToggle"
      >
        <svg v-if="!sidebarVisible" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div class="text-sm font-semibold">{{ headerTitle }}</div>
      <div class="h-6 w-6"></div>
    </header>

    <!-- Main content -->
    <main 
      @click="maybeHideSidebar"
      class="flex-1 flex flex-col transition-all duration-500 ease-in-out overflow-x-hidden px-2 md:px-0 pt-10 md:pt-0"
      :style="{ marginLeft: mainMargin }"
    >
      <div class="w-full flex-1 flex flex-col">
        <router-view />
      </div>
    </main>
    
    <ReloadPrompt />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SidebarItem from './components/SidebarItem.vue'
import ReloadPrompt from './components/ReloadPrompt.vue'

const route = useRoute()
const router = useRouter()

const sidebarVisible = ref(true)
const collapsed = ref(false)
const userHidden = ref(false)
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)

const menuItems = [
  { name: 'Carga de Archivo', path: '/carga-archivo', icon: '📁' },
  { name: 'Página 2', path: '/pagina2', icon: '📊' },
  { name: 'Página 3', path: '/pagina3', icon: '⚙️' }
]

const mainMargin = computed(() => {
  if (windowWidth.value >= 1024 && sidebarVisible.value) {
    return collapsed.value ? '4rem' : '16rem'
  }
  return '0px'
})

const headerTitle = computed(() => {
  const item = menuItems.find(m => m.path === route.path)
  return item ? item.name : 'Análisis Stock'
})

let hideTimer = null
let introTimer = null

function clearHideTimer() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

function clearIntroTimer() {
  if (introTimer) {
    clearTimeout(introTimer)
    introTimer = null
  }
}

function scheduleHideSidebar() {
  clearHideTimer()
  const delay = 1000
  hideTimer = setTimeout(() => {
    sidebarVisible.value = false
  }, delay)
}

function scheduleHideSidebarWithDelay(ms = 1000) {
  let delay = ms
  if (ms === 1000) {
    try {
      const w = typeof window !== 'undefined' ? window.innerWidth : windowWidth.value
      if (w < 768) delay = 1500
      else if (w >= 768 && w < 1024) delay = 3000
      else delay = 1000
    } catch {
      delay = ms
    }
  }
  clearHideTimer()
  hideTimer = setTimeout(() => {
    sidebarVisible.value = false
  }, delay)
}

function mobileToggle() {
  if (sidebarVisible.value) {
    sidebarVisible.value = false
    return
  }
  sidebarVisible.value = true
  if (window.innerWidth < 768) {
    scheduleHideSidebarWithDelay(1500)
  }
}

function setActive(path) {
  router.push(path)
  if (window.innerWidth < 768) {
    clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
      sidebarVisible.value = false
    }, 1200)
  }
}

function desktopToggle() {
  // If expanded -> user wants to hide everything (X behavior)
  if (sidebarVisible.value && !collapsed.value) {
    userHidden.value = true
    localStorage.setItem('sidebarUserHidden', 'true')
    sidebarVisible.value = false
    collapsed.value = true
    return
  }

  // If minimal visible -> user wants to expand (chevron behavior)
  if (sidebarVisible.value && collapsed.value) {
    userHidden.value = false
    localStorage.setItem('sidebarUserHidden', 'false')
    collapsed.value = false
    sidebarVisible.value = true
    return
  }

  // If currently hidden, show minimal (temporary)
  userHidden.value = false
  localStorage.setItem('sidebarUserHidden', 'false')
  collapsed.value = true
  sidebarVisible.value = true
  scheduleHideSidebar()
}

function onLeftEdgeEnter() {
  if (window.innerWidth < 1024) return
  clearIntroTimer()
  collapsed.value = true
  sidebarVisible.value = true
  scheduleHideSidebar()
}

function maybeHideSidebar() {
  if (window.innerWidth < 768 && sidebarVisible.value) {
    sidebarVisible.value = false
  }
}

onMounted(() => {
  const stored = localStorage.getItem('sidebarCollapsed')
  collapsed.value = stored === 'true'
  
  const storedHidden = localStorage.getItem('sidebarUserHidden')
  if (storedHidden === 'true') {
    userHidden.value = true
    sidebarVisible.value = false
  }

  window.addEventListener('resize', () => {
    windowWidth.value = window.innerWidth
    const isNowCollapsed = window.innerWidth < 1024
    if (collapsed.value !== isNowCollapsed) {
      collapsed.value = isNowCollapsed
    }
  })

  // Initial intro: show sidebar expanded for 1.5s then collapse/hide
  const isDesktop = window.innerWidth >= 1024
  if (isDesktop) {
    collapsed.value = false
    sidebarVisible.value = true
    clearIntroTimer()
    introTimer = setTimeout(() => {
      collapsed.value = true
      sidebarVisible.value = false
      localStorage.setItem('sidebarCollapsed', 'true')
      introTimer = null
    }, 1500)
  }

  if (window.innerWidth < 768 && sidebarVisible.value) {
    scheduleHideSidebarWithDelay(1500)
  }
})

onBeforeUnmount(() => {
  clearHideTimer()
  clearIntroTimer()
})

watch(sidebarVisible, (v) => {
  if (!v) {
    clearHideTimer()
  }
})
</script>

<style>
@media (prefers-color-scheme: dark) {
  .bg-gray-50 {
    background-color: #1a1a1a;
  }
}
</style>
