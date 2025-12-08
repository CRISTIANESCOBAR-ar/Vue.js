<template>
  <!-- Invisible detector to open sidebar when hovered on desktop -->
  <div 
    class="fixed top-0 left-0 h-full w-12 z-40"
    @mouseenter="onLeftEdgeEnter"
  ></div>

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
      <h2 class="text-lg font-bold" v-if="!collapsed">Menú</h2>
      <!-- Desktop collapse/expand button -->
      <button 
        class="hidden lg:inline-flex items-center justify-center p-1 rounded hover:bg-blue-700 ml-2"
        :aria-label="collapsed ? 'Abrir menú' : 'Colapsar menú'"
        @click="desktopToggle"
        title="Colapsar/abrir menú"
      >
        <template v-if="!collapsed">
          <!-- X icon to collapse/hide -->
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
      <!-- Mobile close button -->
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
        :active="route.path === item.path" 
        :collapsed="collapsed"
        @click="navigate(item.path)" 
      />
    </nav>
  </aside>

  <!-- Mobile floating menu button (visible under 1024px) -->
  <button 
    aria-label="Toggle menú" 
    :aria-expanded="String(sidebarVisible)"
    class="lg:hidden fixed top-3 left-3 z-50 text-blue-600 bg-blue-100 p-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors shadow-sm"
    @click.stop.prevent="mobileToggle"
  >
    <svg v-if="!sidebarVisible" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
    <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import SidebarItem from './SidebarItem.vue'

const router = useRouter()
const route = useRoute()

// --- State (matching carga-datos-vue exactly) ---
const sidebarVisible = ref(true)
const collapsed = ref(false)
const userHidden = ref(false) // true when user explicitly hid the sidebar with X
const windowWidth = ref(window.innerWidth)

let hideTimer = null
let introTimer = null

// --- Computed ---
const isMobile = computed(() => windowWidth.value < 1024)

// Margin for main content (exposed for App.vue if needed)
const mainMargin = computed(() => {
  if (windowWidth.value >= 1024 && sidebarVisible.value) {
    return collapsed.value ? '4rem' : '16rem'
  }
  return '0px'
})

const menuItems = [
  { name: 'Carga de Archivo', path: '/carga-archivo', icon: '📁' },
  // Add more menu items as needed
]

// --- Timer functions ---
const clearHideTimer = () => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

const clearIntroTimer = () => {
  if (introTimer) {
    clearTimeout(introTimer)
    introTimer = null
  }
}

const scheduleHideSidebar = () => {
  clearHideTimer()
  const delay = 1000 // 1 second like carga-datos-vue
  hideTimer = setTimeout(() => {
    sidebarVisible.value = false
  }, delay)
}

// --- Actions (matching carga-datos-vue exactly) ---

const onLeftEdgeEnter = () => {
  // Show minimized (icons-only) when hovering left edge on desktop
  if (windowWidth.value < 1024) return
  clearIntroTimer()
  collapsed.value = true
  sidebarVisible.value = true
  // Schedule auto-hide
  scheduleHideSidebar()
}

const desktopToggle = () => {
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

const mobileToggle = () => {
  // Toggle mobile menu and auto-hide after 1500ms if opened
  if (sidebarVisible.value) {
    sidebarVisible.value = false
    return
  }
  // opening
  sidebarVisible.value = true
  // only auto-hide on small screens
  if (windowWidth.value < 768) {
    clearHideTimer()
    hideTimer = setTimeout(() => {
      sidebarVisible.value = false
    }, 1500)
  }
}

const navigate = (path) => {
  router.push(path)
  localStorage.setItem('activeSection', path)
  // On mobile, close after navigation
  if (windowWidth.value < 768) {
    clearHideTimer()
    hideTimer = setTimeout(() => {
      sidebarVisible.value = false
    }, 1200)
  }
}

const handleResize = () => {
  const isNowMobile = windowWidth.value < 1024
  windowWidth.value = window.innerWidth
  if (collapsed.value !== isNowMobile) {
    collapsed.value = isNowMobile
  }
}

// --- Lifecycle ---
onMounted(() => {
  window.addEventListener('resize', handleResize)
  
  // Restore user preference from localStorage
  const stored = localStorage.getItem('sidebarCollapsed')
  collapsed.value = stored === 'true'
  
  const storedHidden = localStorage.getItem('sidebarUserHidden')
  if (storedHidden === 'true') {
    userHidden.value = true
    sidebarVisible.value = false
  }

  // Intro Animation on desktop: Expanded -> Hidden after 1.5s
  // Like carga-datos-vue: show expanded briefly then hide
  const isDesktop = windowWidth.value >= 1024
  if (isDesktop) {
    collapsed.value = false
    sidebarVisible.value = true
    clearIntroTimer()
    introTimer = setTimeout(() => {
      collapsed.value = true
      sidebarVisible.value = false
      localStorage.setItem('sidebarCollapsed', 'true')
      localStorage.setItem('sidebarSeen', 'true')
      introTimer = null
    }, 1500)
  }

  // Mobile: auto-hide after 1.5s if visible on load
  if (windowWidth.value < 768 && sidebarVisible.value) {
    clearHideTimer()
    hideTimer = setTimeout(() => {
      sidebarVisible.value = false
    }, 1500)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  clearHideTimer()
  clearIntroTimer()
})

// Expose mainMargin for parent components
defineExpose({ mainMargin, sidebarVisible, collapsed })
</script>

<style scoped>
/* Custom scrollbar for nav */
nav::-webkit-scrollbar {
  width: 4px;
}
nav::-webkit-scrollbar-track {
  background: transparent;
}
nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
