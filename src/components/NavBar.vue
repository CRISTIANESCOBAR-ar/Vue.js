<template>
  <nav class="navbar">
    <div class="navbar-container">
      <!-- Logo y título -->
      <div class="navbar-brand">
        <div class="logo">📊</div>
        <div class="brand-text">
          <h1 class="brand-title">Análisis Stock STC</h1>
          <p class="brand-subtitle">Sistema de Producción y Control</p>
        </div>
      </div>

      <!-- Botón hamburguesa para móvil -->
      <button @click="toggleMenu" class="hamburger" :class="{ active: isMenuOpen }">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <!-- Menú de navegación -->
      <div class="navbar-menu" :class="{ active: isMenuOpen }">
        <router-link 
          to="/" 
          class="nav-item"
          :class="{ active: isActive('/') }"
          @click="closeMenu"
        >
          <span class="nav-icon">📈</span>
          <span class="nav-label">Dashboard</span>
        </router-link>

        <router-link 
          to="/fichas" 
          class="nav-item"
          :class="{ active: isActive('/fichas') }"
          @click="closeMenu"
        >
          <span class="nav-icon">🔍</span>
          <span class="nav-label">Fichas</span>
        </router-link>

        <router-link 
          to="/calidad" 
          class="nav-item"
          :class="{ active: isActive('/calidad') }"
          @click="closeMenu"
        >
          <span class="nav-icon">🎯</span>
          <span class="nav-label">Calidad</span>
        </router-link>

        <router-link 
          to="/paradas" 
          class="nav-item"
          :class="{ active: isActive('/paradas') }"
          @click="closeMenu"
        >
          <span class="nav-icon">⚠️</span>
          <span class="nav-label">Paradas</span>
        </router-link>

        <div class="nav-divider"></div>

        <!-- Indicador de estado API -->
        <div class="api-status" :class="{ online: apiOnline, offline: !apiOnline }">
          <span class="status-dot"></span>
          <span class="status-text">{{ apiOnline ? 'API Online' : 'API Offline' }}</span>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isMenuOpen = ref(false)
const apiOnline = ref(false)

let statusInterval = null

function isActive(path) {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

async function checkApiStatus() {
  try {
    const response = await fetch('http://localhost:3001/api/status', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    apiOnline.value = response.ok
  } catch (err) {
    apiOnline.value = false
  }
}

onMounted(() => {
  checkApiStatus()
  // Verificar cada 30 segundos
  statusInterval = setInterval(checkApiStatus, 30000)
})

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval)
  }
})
</script>

<style scoped>
.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 70px;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 16px;
  color: white;
}

.logo {
  font-size: 36px;
  line-height: 1;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
  color: white;
}

.brand-subtitle {
  font-size: 12px;
  margin: 0;
  opacity: 0.9;
  color: white;
}

.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
}

.hamburger span {
  width: 25px;
  height: 3px;
  background: white;
  border-radius: 3px;
  transition: all 0.3s;
}

.hamburger.active span:nth-child(1) {
  transform: rotate(45deg) translate(8px, 8px);
}

.hamburger.active span:nth-child(2) {
  opacity: 0;
}

.hamburger.active span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -7px);
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  text-decoration: none;
  color: white;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.2s;
  position: relative;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.25);
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 20px;
  right: 20px;
  height: 3px;
  background: white;
  border-radius: 3px;
}

.nav-icon {
  font-size: 20px;
  line-height: 1;
}

.nav-label {
  line-height: 1;
}

.nav-divider {
  width: 1px;
  height: 30px;
  background: rgba(255, 255, 255, 0.3);
  margin: 0 8px;
}

.api-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 13px;
  font-weight: 600;
  color: white;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.api-status.online .status-dot {
  background: #4caf50;
}

.api-status.offline .status-dot {
  background: #f44336;
  animation: none;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .navbar-container {
    padding: 0 16px;
  }

  .brand-subtitle {
    display: none;
  }

  .brand-title {
    font-size: 16px;
  }

  .logo {
    font-size: 28px;
  }

  .hamburger {
    display: flex;
  }

  .navbar-menu {
    position: fixed;
    top: 70px;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-100%);
    opacity: 0;
    transition: all 0.3s;
    pointer-events: none;
  }

  .navbar-menu.active {
    transform: translateY(0);
    opacity: 1;
    pointer-events: all;
  }

  .nav-item {
    width: 100%;
    padding: 16px 20px;
    border-radius: 8px;
    margin-bottom: 4px;
  }

  .nav-item.active::after {
    display: none;
  }

  .nav-divider {
    width: 100%;
    height: 1px;
    margin: 12px 0;
  }

  .api-status {
    width: 100%;
    justify-content: center;
    margin-top: 8px;
  }
}

@media (max-width: 480px) {
  .brand-text {
    display: none;
  }

  .navbar-brand {
    gap: 0;
  }
}
</style>
