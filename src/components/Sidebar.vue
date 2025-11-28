<template>
  <aside class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <h2 v-if="!isCollapsed">Análisis Stock STC</h2>
      <button class="toggle-btn" @click="toggleSidebar" title="Colapsar menú">
        <span>{{ isCollapsed ? '☰' : '←' }}</span>
      </button>
    </div>
    
    <nav class="sidebar-nav">
      <router-link 
        v-for="item in menuItems" 
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :title="isCollapsed ? item.name : ''"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span v-if="!isCollapsed" class="nav-text">{{ item.name }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { ref } from 'vue'

const isCollapsed = ref(false)

const menuItems = [
  { name: 'Carga de Archivo', path: '/carga-archivo', icon: '📁' },
  { name: 'Página 2', path: '/pagina2', icon: '📊' },
  { name: 'Página 3', path: '/pagina3', icon: '⚙️' }
]

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
.sidebar {
  width: 260px;
  background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
  color: white;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 100;
}

.sidebar.collapsed {
  width: 65px;
}

.sidebar-header {
  padding: 1.25rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 70px;
}

.sidebar-header h2 {
  font-size: 1.1rem;
  margin: 0;
  white-space: nowrap;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.toggle-btn {
  background: transparent;
  border: none;
  color: white;
  font-size: 1.3rem;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-radius: 4px;
  min-width: 32px;
  min-height: 32px;
}

.toggle-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
  transform: scale(1.1);
}

.toggle-btn:active {
  transform: scale(0.95);
}

.sidebar-nav {
  flex: 1;
  padding: 0.5rem 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
  gap: 1rem;
  position: relative;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
  color: white;
  padding-left: 1.7rem;
}

.nav-item.router-link-active {
  background-color: rgba(52, 152, 219, 0.3);
  color: white;
  border-left: 4px solid #3498db;
  padding-left: calc(1.5rem - 4px);
  font-weight: 500;
}

.nav-item.router-link-active:hover {
  padding-left: calc(1.7rem - 4px);
}

.collapsed .nav-item {
  justify-content: center;
  padding: 1rem 0.5rem;
}

.collapsed .nav-item:hover {
  padding-left: 0.5rem;
}

.collapsed .nav-item.router-link-active {
  padding-left: calc(0.5rem - 4px);
}

.collapsed .nav-item.router-link-active:hover {
  padding-left: calc(0.5rem - 4px);
}

.nav-icon {
  font-size: 1.5rem;
  min-width: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.nav-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  font-size: 0.95rem;
}

.collapsed .nav-text {
  display: none;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    height: 100vh;
    z-index: 1000;
  }
  
  .sidebar.collapsed {
    transform: translateX(-100%);
    width: 260px;
  }
}
</style>
