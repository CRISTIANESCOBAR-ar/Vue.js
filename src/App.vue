<template>
  <div class="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden">
    <!-- invisible detector to open sidebar when hovered on desktop -->
    <!-- área izquierda ampliada para detectar hover y reabrir el sidebar en escritorio -->
    <div class="fixed top-0 left-0 h-full w-12 z-50" @mouseenter="onLeftEdgeEnter"></div>

    <!-- Sidebar -->
    <aside @mouseleave="scheduleHideSidebar" @mouseenter="clearHideTimer" :class="[
      'fixed top-0 left-0 h-full bg-blue-800 text-white z-[9999] transition-all duration-500 ease-in-out',
      sidebarVisible ? 'translate-x-0' : '-translate-x-full',
      collapsed ? 'w-16' : 'w-64'
    ]" aria-hidden="false">
      <div class="flex items-center justify-between px-4 py-3 border-b border-blue-600">
        <h2 class="text-lg font-bold" v-if="!collapsed">Menú</h2>
        <!-- Desktop collapse/expand button -->
        <button class="hidden md:inline-flex items-center justify-center p-1 rounded hover:bg-blue-700 ml-2"
          :aria-label="collapsed ? 'Abrir menú' : 'Colapsar menú'" @click="desktopToggle" title="Colapsar/abrir menú">
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
        <button class="md:hidden" @click="sidebarVisible = false" aria-label="Cerrar menú móvil">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav class="px-2 py-2 space-y-2">
        <SidebarItem icon="📄" label="Carga de datos" :active="active === 'form'" :collapsed="collapsed"
          @click="setActive('form')" />
        <SidebarItem icon="📋" label="Registros" :active="active === 'list'" :collapsed="collapsed"
          @click="setActive('list')" />
        <SidebarItem icon="🧩" label="Uster" :active="active === 'uster'" :collapsed="collapsed"
          @click="setActive('uster')" />
        <SidebarItem icon="⚙️" label="Configuración" :active="active === 'config'" :collapsed="collapsed"
          @click="setActive('config')" />
      </nav>
    </aside>

    <!-- Mobile header -->
    <header class="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-1 bg-white">
      <button aria-label="Toggle menú" :aria-expanded="String(sidebarVisible)"
        class="bg-blue-600 text-white p-0.5 rounded shadow w-9 h-9 flex items-center justify-center"
        @click.stop.prevent="mobileToggle">
        <svg v-if="!sidebarVisible" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div class="text-sm font-semibold">{{ headerTitle }}</div>
      <img src="/favicon.ico" alt="favicon" class="h-6 w-6 opacity-40 pointer-events-none" />
    </header>

    <!-- Update banner (aparece cuando SW tiene nueva versión) -->
    <div v-if="updateAvailable"
      class="fixed top-12 left-1/2 transform -translate-x-1/2 z-60 bg-yellow-400 text-black px-3 py-2 rounded shadow-md flex items-center gap-3">
      <div class="text-sm font-medium">Nueva versión disponible</div>
      <button @click="applyUpdate" class="bg-black text-white px-2 py-1 rounded text-sm">Actualizar</button>
    </div>

    <!-- Version info (moved to footer of main) - removed fixed badge -->

    <!-- Main content -->
    <main @click="maybeHideSidebar"
      class="flex-1 transition-all duration-500 ease-in-out overflow-x-hidden px-2 md:px-0 pt-10 md:pt-0"
      :style="{ marginLeft: mainMargin }">
      <div class="w-full">
        <transition name="fade" mode="out-in">
          <div>
            <FormRegistro ref="formRegistroRef" v-if="active === 'form'" :registros="registros" />
            <ListaRegistros v-else-if="active === 'list'" :registros="registros" :edit-index="editIndex"
              :mostrar-editar="true" @eliminar="eliminarRegistro" @actualizar="actualizarRegistro" />
            <div v-else-if="active === 'uster'">
              <Uster />
            </div>
            <div v-else-if="active === 'config'">
              <div class="max-w-3xl mx-auto bg-white rounded shadow p-4">
                <h3 class="text-lg font-medium mb-3">Configuración</h3>
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div class="text-sm text-gray-700">Comprobar si hay actualizaciones de la aplicación y ver la versión
                    actual.</div>
                  <div class="flex items-center gap-3">
                    <div class="text-xs text-gray-600 mr-2">
                      <div v-if="appVersion">Versión: <strong>{{ appVersion }}</strong></div>
                      <div v-if="appBuildNumber">Build #: <strong>{{ appBuildNumber }}</strong></div>
                      <div v-if="appCommitSha">Commit: <small>{{ appCommitSha }}</small></div>
                      <div v-if="lastChecked" class="mt-1 text-xs text-gray-500">Última comprobación: <strong
                          :title="lastCheckedTitle">{{ lastCheckedHuman }}</strong></div>
                      <div v-if="isLatest && lastChecked" class="mt-1 text-xs text-green-600 font-medium">Estás en la
                        última
                        versión</div>
                    </div>
                    <button @click="() => checkForUpdates({ notifyOnFailure: true })" :disabled="isCheckingUpdates"
                      class="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                      <svg v-if="isCheckingUpdates" class="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"
                        fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      <span v-if="!isCheckingUpdates">Buscar actualizaciones</span>
                      <span v-else>Buscando...</span>
                    </button>
                    <div class="flex flex-col">
                      <button @click="forceReload"
                        class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Forzar
                        limpieza y recarga</button>
                      <div class="text-xs text-gray-500 mt-1">Acción de recuperación: limpia cachés y Service Workers si
                        el
                        cliente quedó en una versión antigua. Usarla solo si hay problemas.</div>
                    </div>
                  </div>
                </div>
                <p class="text-xs text-gray-500 mt-3">Al pulsar "Buscar actualizaciones" se consultará la versión
                  publicada
                  y, si hay una versión nueva, se te ofrecerá actualizar (actualización via Service Worker si está
                  disponible).</p>
              </div>
            </div>
          </div>
        </transition>
        <!-- version moved to global footer -->
      </div>
    </main>
    <!-- Global footer -->
    <footer class="w-full border-t bg-white/50 dark:bg-gray-50 py-2">
      <div class="max-w-6xl mx-auto px-4 text-center text-xs text-gray-500">
        <span v-if="appVersion">v{{ appVersion }}</span>
        <span v-if="appBuildNumber"> (build #{{ appBuildNumber }})</span>
        <span v-if="appCommitSha"> ({{ appCommitSha }})</span>
        <span v-if="appBuildTime"> · Publicado: {{ new Date(appBuildTime).toLocaleString() }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import { hideAll } from 'tippy.js'
// registerSW es provisto por vite-plugin-pwa (virtual module)
import { registerSW } from 'virtual:pwa-register'
import FormRegistro from './components/FormRegistro.vue'
import ListaRegistros from './components/ListaRegistros.vue'
import Uster from './components/Uster.vue'
import SidebarItem from './components/SidebarItem.vue'
import Swal from 'sweetalert2'
import { useRegistroStore } from './stores/registro'

const store = useRegistroStore()
const registros = computed(() => store.registros)

const editIndex = ref(null)
// ref para acceder al método expuesto en FormRegistro (focusRolada)
const formRegistroRef = ref(null)
const sidebarVisible = ref(true)
const collapsed = ref(false)
const userHidden = ref(false) // true when user explicitly hid the sidebar with the X
const active = ref('form')

// track viewport width to decide push vs overlay behavior
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)

const mainMargin = computed(() => {
  // only push content on desktop (>=1024px). When collapsed, we use a smaller offset.
  if (windowWidth.value >= 1024 && sidebarVisible.value) {
    return collapsed.value ? '4rem' : '16rem'
  }
  return '0px'
})

const headerTitle = computed(() => {
  if (active.value === 'form') return 'Carga de Datos'
  if (active.value === 'list') return 'Registros'
  if (active.value === 'config') return 'Configuración'
  return 'Carga de Datos'
})

const lastCheckedHuman = computed(() => {
  if (!lastChecked.value) return null
  try {
    const then = new Date(lastChecked.value).getTime()
    const now = Date.now()
    const diff = Math.floor((now - then) / 1000)
    if (diff < 10) return 'hace unos segundos'
    if (diff < 60) return `hace ${diff} segundos`
    const mins = Math.floor(diff / 60)
    if (mins < 60) return `hace ${mins} minuto${mins > 1 ? 's' : ''}`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `hace ${hours} hora${hours > 1 ? 's' : ''}`
    const days = Math.floor(hours / 24)
    return `hace ${days} día${days > 1 ? 's' : ''}`
  } catch {
    return lastChecked.value
  }
})

const lastCheckedTitle = computed(() => {
  if (!lastChecked.value) return ''
  try { return new Date(lastChecked.value).toLocaleString() } catch { return lastChecked.value }
})

const transientTitle = ref('')
const showTransient = ref(false)
const updateAvailable = ref(false)
const isCheckingUpdates = ref(false)
const isLatest = ref(false)
const lastChecked = ref(null)
let autoCheckInterval = null

function onVisibility() {
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined' && window.document.visibilityState === 'visible') checkForUpdates()
}

function onFocus() {
  if (typeof window !== 'undefined') checkForUpdates()
}

// Load lastChecked from localStorage if exists
try {
  const saved = localStorage.getItem('lastUpdateCheck')
  if (saved) lastChecked.value = saved
} catch {
  /* noop */
}

const appVersion = ref(null)
const appBuildTime = ref(null)
const appCommitSha = ref(null)
const appBuildNumber = ref(null)

// Registrar SW y recibir callback cuando hay una nueva versión lista
const updateServiceWorker = registerSW({
  onNeedRefresh() {
    updateAvailable.value = true
  },
  onOfflineReady() {
    // opcional: podríamos mostrar un aviso "offline listo"
  }
})

function applyUpdate() {
  // request the SW to skipWaiting y luego recargar
  ; (async () => {
    try {
      // if registerSW returned an updater function, use it and wait
      if (typeof updateServiceWorker === 'function') {
        try {
          await updateServiceWorker(true)
          // updateServiceWorker may trigger a reload itself; ensure we reload as fallback
          try { if (typeof window !== 'undefined') window.location.reload() } catch { /* noop */ }
          return
        } catch {
          // fall through to manual unregister
        }
      }

      // Fallback strategy: unregister service workers and reload with cache-busting
      if (typeof window !== 'undefined' && window.navigator && window.navigator.serviceWorker && typeof window.navigator.serviceWorker.getRegistrations === 'function') {
        try {
          const regs = await window.navigator.serviceWorker.getRegistrations()
          for (const r of regs) {
            try { await r.unregister() } catch { /* noop */ }
          }
        } catch {
          /* noop */
        }
      }

      if (typeof window !== 'undefined') {
        // Attempt to clear CacheStorage to remove stale cached assets (best-effort)
        try {
          if (window.caches && typeof window.caches.keys === 'function') {
            const keys = await window.caches.keys()
            for (const k of keys) {
              try { await window.caches.delete(k) } catch { /* noop */ }
            }
          }
        } catch {
          /* noop */
        }
        // reload page bypassing caches using a cache-busting query param
        const url = window.location.pathname + (window.location.search ? window.location.search + '&' : '?') + `_cb=${Date.now()}`
        window.location.href = url
      }
    } catch (err) {
      console.warn('applyUpdate fallback failed', err)
      try { if (typeof window !== 'undefined') window.location.reload() } catch { /* noop */ }
    }
  })()
}

// Check for updates by fetching the published version.json and comparing build number / commit
// checkForUpdates accepts an options object. If notifyOnFailure is true, show a modal error on failure.
async function checkForUpdates(opts = { notifyOnFailure: false }) {
  if (isCheckingUpdates.value) return
  isCheckingUpdates.value = true
  try {
    const url = `/version.json?t=${Date.now()}`
    const res = await fetch(url)
    if (!res.ok) throw new Error('No se pudo obtener la versión publicada')
    const data = await res.json()
    // update UI immediately with remote values so labels/footer reflect remote version
    try {
      appVersion.value = data.version || null
      appBuildTime.value = data.buildTime || null
      appCommitSha.value = data.commitSha || null
      appBuildNumber.value = data.buildNumber || null
    } catch {
      /* noop */
    }
    const remoteBuild = data.buildNumber || null
    const remoteCommit = data.commitSha || null
    // If we don't have a current build number, treat any published value as news
    const isNew = (appBuildNumber.value == null && remoteBuild != null) || (remoteBuild != null && Number(remoteBuild) > Number(appBuildNumber.value)) || (remoteCommit && appCommitSha.value && remoteCommit !== appCommitSha.value)
    if (!isNew) {
      // No hay nueva versión: marcar como latest para mostrar label en Configuración.
      isLatest.value = true
      updateAvailable.value = false
      return
    }
    // Si es nueva versión
    isLatest.value = false
    // Nueva versión detectada: aplicar actualización automáticamente para evitar que el usuario tenga que hacer un hard refresh.
    await Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Nueva versión encontrada — aplicando actualización...', showConfirmButton: false, timer: 1400 })
    applyUpdate()
  } catch (err) {
    console.warn('checkForUpdates error', err)
    // If the check was initiated by the user, show a modal error. For automatic background checks, avoid modal noise.
    if (opts && opts.notifyOnFailure) {
      try { await Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo comprobar la versión publicada.' }) } catch { /* noop */ }
    } else {
      // non-blocking toast to inform silently
      try { await Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'No se pudo comprobar la versión publicada.', showConfirmButton: false, timer: 2000 }) } catch { /* noop */ }
    }
  } finally {
    // mark last checked time (ISO string), persist
    try {
      lastChecked.value = new Date().toISOString()
      localStorage.setItem('lastUpdateCheck', lastChecked.value)
    } catch {
      /* noop */
    }
    isCheckingUpdates.value = false
  }
}

async function forceReload() {
  const { isConfirmed } = await Swal.fire({ title: 'Forzar limpieza y recarga', text: 'Esto limpiará la caché del navegador para esta aplicación y recargará la página. ¿Deseas continuar?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, forzar', cancelButtonText: 'Cancelar' })
  if (!isConfirmed) return
  // fetch remote version to update labels before forcing reload (helps UX on mobile)
  try {
    const r = await fetch(`/version.json?t=${Date.now()}`)
    if (r.ok) {
      const d = await r.json()
      appVersion.value = d.version || appVersion.value
      appBuildTime.value = d.buildTime || appBuildTime.value
      appCommitSha.value = d.commitSha || appCommitSha.value
      appBuildNumber.value = d.buildNumber || appBuildNumber.value
    }
  } catch {
    /* noop */
  }
  try {
    // unregister service workers
    if (typeof window !== 'undefined' && window.navigator && window.navigator.serviceWorker && typeof window.navigator.serviceWorker.getRegistrations === 'function') {
      try {
        const regs = await window.navigator.serviceWorker.getRegistrations()
        for (const r of regs) {
          try { await r.unregister() } catch { /* noop */ }
        }
      } catch {
        /* noop */
      }
    }
    // clear caches
    try {
      if (typeof window !== 'undefined' && window.caches && typeof window.caches.keys === 'function') {
        const keys = await window.caches.keys()
        for (const k of keys) {
          try { await window.caches.delete(k) } catch { /* noop */ }
        }
      }
    } catch {
      /* noop */
    }
    // reload with cache-busting
    if (typeof window !== 'undefined') {
      window.location.href = window.location.pathname + (window.location.search ? window.location.search + '&' : '?') + `_cb=${Date.now()}`
    }
  } catch (err) {
    console.warn('forceReload error', err)
    try { if (typeof window !== 'undefined') window.location.reload() } catch { /* noop */ }
  }
}

function clearTransient() {
  showTransient.value = false
  transientTitle.value = ''
  try { hideAll() } catch (err) { void err }
}

onMounted(async () => {
  // Restaurar registros desde localStorage manteniendo el orden tal como fue guardado.
  // Antes se usaba `store.agregar()` (que hace unshift), lo que invertía el orden al iterar.
  // Aquí reemplazamos el contenido del array reactivo preservando la referencia.
  try {
    const saved2 = localStorage.getItem('roladas')
    if (saved2) {
      const parsed = JSON.parse(saved2)
      if (Array.isArray(parsed)) {
        // reemplazar el array reactivo in-place para mantener reactividad
        try {
          store.registros.splice(0, store.registros.length, ...parsed)
        } catch {
          // fallback: reset + agregar (conservar compatibilidad)
          store.reset()
          parsed.forEach(r => store.agregar(r))
        }
      }
    }
  } catch (e) {
    console.warn('Error al restaurar registros desde localStorage:', e)
  }
  const stored = localStorage.getItem('sidebarCollapsed')
  // legacy: if there's a stored collapsed flag, use it as initial collapsed state
  collapsed.value = stored === 'true'
  const storedHidden = localStorage.getItem('sidebarUserHidden')
  if (storedHidden === 'true') {
    userHidden.value = true
    sidebarVisible.value = false
  }
  const savedSection = localStorage.getItem('activeSection')
  if (savedSection) active.value = savedSection
  window.addEventListener('resize', () => {
    const isNowCollapsed = window.innerWidth < 1024
    windowWidth.value = window.innerWidth
    if (collapsed.value !== isNowCollapsed) {
      collapsed.value = isNowCollapsed
      if (isNowCollapsed) clearTransient()
    }
  })

  // Primera vez: mostrar el sidebar expandido unos segundos y luego ocultarlo.
  // Solo si el usuario no lo había ocultado explícitamente (sidebarUserHidden).
  // Además soportamos ?intro=1 en la URL para forzar la intro (útil para pruebas).
  // Ejecutar la intro siempre en cargas de escritorio para que el usuario vea el menú inicial.
  // Si quieres revertir a un comportamiento condicionado, lo dejamos como opción.
  const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  if (isDesktop) {
    collapsed.value = false
    sidebarVisible.value = true
    clearIntroTimer()
    introTimer = setTimeout(() => {
      collapsed.value = true
      sidebarVisible.value = false
      localStorage.setItem('sidebarCollapsed', 'true')
      localStorage.setItem('sidebarSeen', 'true')
      try { hideAll() } catch (err) { void err }
      clearTransient()
      introTimer = null
    }, 1500)
  }

  // Si estamos en móvil y el sidebar está visible al cargar, ocultarlo tras 1.5s
  if (typeof window !== 'undefined' && window.innerWidth < 768 && sidebarVisible.value) {
    scheduleHideSidebarWithDelay(1500)
  }

  // Leer versión/buildTime desde public/version.json (generado en build)
  if (typeof fetch !== 'undefined') {
    fetch('/version.json').then(r => r.json()).then(data => {
      appVersion.value = data.version || null
      appBuildTime.value = data.buildTime || null
      appCommitSha.value = data.commitSha || null
      appBuildNumber.value = data.buildNumber || null
    }).catch(() => {
      /* noop */
    })
  }

  // Start automatic hourly checks (every 60 minutes)
  try {
    // trigger an initial check if lastChecked is null or older than 1 hour
    const now = Date.now()
    const last = lastChecked.value ? new Date(lastChecked.value).getTime() : 0
    if (!lastChecked.value || (now - last) > 1000 * 60 * 60) {
      checkForUpdates()
    }
    if (typeof window !== 'undefined') {
      autoCheckInterval = window.setInterval(() => { checkForUpdates() }, 1000 * 60 * 60)
    }
  } catch {
    /* noop */
  }

  // When the tab becomes visible again, do a quick check
  try { if (typeof window !== 'undefined' && typeof window.document !== 'undefined') window.document.addEventListener('visibilitychange', onVisibility) } catch { /* noop */ }
  try { if (typeof window !== 'undefined') window.addEventListener('focus', onFocus) } catch { /* noop */ }

  // Si al cargar la app la sección activa es el formulario, pedir foco en Rolada (guardado en localStorage o por defecto)
  try {
    if (active.value === 'form') {
      await nextTick()
      if (formRegistroRef && formRegistroRef.value && typeof formRegistroRef.value.focusRolada === 'function') {
        try { formRegistroRef.value.focusRolada() } catch { /* noop */ }
      }
    }
  } catch { /* noop */ }

  // cleanup handlers will be removed in onBeforeUnmount
})

onBeforeUnmount(() => {
  try { if (autoCheckInterval && typeof window !== 'undefined') window.clearInterval(autoCheckInterval) } catch { /* noop */ }
  try { if (typeof window !== 'undefined' && typeof window.document !== 'undefined') window.document.removeEventListener('visibilitychange', onVisibility) } catch { /* noop */ }
  try { if (typeof window !== 'undefined') window.removeEventListener('focus', onFocus) } catch { /* noop */ }
})

watch(registros, (val) => localStorage.setItem('roladas', JSON.stringify(val)), { deep: true })
watch(sidebarVisible, (v) => {
  if (!v) {
    clearTransient()
    try { hideSidebarTooltips() } catch { /* noop */ }
  }
})
watch(collapsed, (c) => { if (c) clearTransient() })
watch(active, () => clearTransient())

let hideTimer = null
function clearHideTimer() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

/* eslint-disable no-undef */
function hideSidebarTooltips() {
  if (typeof document === 'undefined') return
  try {
    const aside = document.querySelector('aside')
    if (!aside) return
    const all = aside.querySelectorAll('*')
    all.forEach((el) => {
      if (el && el._tippyInstance) {
        try { el._tippyInstance.hide() } catch { /* noop */ }
        try { el._tippyInstance.destroy() } catch { /* noop */ }
        try { delete el._tippyInstance } catch { /* noop */ }
      }
    })
  } catch {
    // noop
  }
}
/* eslint-enable no-undef */

let introTimer = null
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
    hideAll() // 🔒 cierra todos los tooltips activos
    try { hideSidebarTooltips() } catch (err) { void err }
    try { hideAll() } catch (err) { void err }
    clearTransient()
  }, delay)
}

function scheduleHideSidebarWithDelay(ms = 1000) {
  clearHideTimer()
  hideTimer = setTimeout(() => {
    sidebarVisible.value = false
    try { hideSidebarTooltips() } catch (err) { void err }
    try { hideAll() } catch (err) { void err }
    clearTransient()
  }, ms)
}

function mobileToggle() {
  // Toggle mobile menu and auto-hide after 1500ms if opened
  if (sidebarVisible.value) {
    sidebarVisible.value = false
    try { hideAll() } catch (err) { void err }
    clearTransient()
    return
  }
  // opening
  sidebarVisible.value = true
  // only auto-hide on small screens
  if (window.innerWidth < 768) {
    scheduleHideSidebarWithDelay(1500)
  }
}

async function setActive(section) {
  active.value = section
  localStorage.setItem('activeSection', section)
  // Auto-hide the sidebar when navigating to certain full-width tools (Uster)
  // but only if the user didn't explicitly hide the sidebar.
  try {
    if (section === 'uster' && typeof window !== 'undefined' && window.innerWidth >= 1024 && !userHidden.value) {
      collapsed.value = true
      sidebarVisible.value = false
      localStorage.setItem('sidebarCollapsed', 'true')
    }
  } catch { /* noop */ }
  if (window.innerWidth < 768) {
    transientTitle.value = headerTitle.value
    showTransient.value = true
    clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
      sidebarVisible.value = false
      try { hideSidebarTooltips() } catch (err) { void err }
      try { hideAll() } catch (err) { void err }
      clearTransient()
    }, 1200)
  }
  // Si navegamos a la sección de formulario, pedir al componente hijo que ponga foco en Rolada
  if (section === 'form') {
    try {
      await nextTick()
      if (formRegistroRef && formRegistroRef.value && typeof formRegistroRef.value.focusRolada === 'function') {
        try { formRegistroRef.value.focusRolada() } catch { /* noop */ }
      }
    } catch { /* noop */ }
  }
}

function desktopToggle() {
  // If expanded -> user wants to hide everything (X behavior)
  if (sidebarVisible.value && !collapsed.value) {
    userHidden.value = true
    localStorage.setItem('sidebarUserHidden', 'true')
    sidebarVisible.value = false
    collapsed.value = true
    try { hideAll() } catch (err) { void err }
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
  // Mostrar minimal (icons-only) al pasar el cursor por el borde izquierdo en pantallas de escritorio
  // permitir que el hover muestre una vista minimal incluso si el usuario ocultó previamente con la X,
  // para que pueda reabrir temporalmente sin tener que limpiar localStorage manualmente.
  if (window.innerWidth < 1024) return
  clearIntroTimer()
  collapsed.value = true
  sidebarVisible.value = true
  // programar auto-ocultado si el usuario no ha forzado la visibilidad
  scheduleHideSidebar()
}

function maybeHideSidebar() {
  if (window.innerWidth < 768 && sidebarVisible.value) {
    sidebarVisible.value = false
    try { hideAll() } catch (err) { void err }
    clearTransient()
  }
}

async function eliminarRegistro(idx) {
  const r = store.registros[idx]
  const { isConfirmed } = await Swal.fire({ title: '¿Estás seguro?', text: `Vas a eliminar la rolada ${r.rolada} (base: ${r.base}).`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, borrar', cancelButtonText: 'Cancelar', reverseButtons: true })
  if (!isConfirmed) return
  store.eliminar(idx)
  await Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Registro eliminado', showConfirmButton: false, timer: 1500, timerProgressBar: true })
}

function actualizarRegistro(payload) {
  try {
    const { idx, nuevo } = payload
    // idx is expected to be the real index in the registros array
    store.actualizar(idx, nuevo)
    // show toast
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Registro actualizado', showConfirmButton: false, timer: 1500, timerProgressBar: true })
  } catch (err) {
    console.error('Error actualizando registro', err)
  }
}
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.tippy-box[data-theme~='light-border'] {
  background-color: #f9fafb;
  color: #1f2937;
  border: 1px solid #d1d5db;
  font-size: 0.875rem;
  padding: 6px 10px;
  border-radius: 6px;
}

.custom-select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}
</style>
