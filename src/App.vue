<template>
  <div class="app">
    <Sidebar ref="sidebarRef" />
    <main 
      class="main-content transition-all duration-500 ease-in-out"
      :style="{ marginLeft: mainMargin }"
    >
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Sidebar from './components/Sidebar.vue'

const sidebarRef = ref(null)
const windowWidth = ref(window.innerWidth)

// Compute main margin based on sidebar state (like carga-datos-vue)
const mainMargin = computed(() => {
  // Only push content on desktop (>=1024px)
  if (windowWidth.value >= 1024 && sidebarRef.value) {
    if (sidebarRef.value.sidebarVisible) {
      return sidebarRef.value.collapsed ? '4rem' : '16rem'
    }
  }
  return '0px'
})

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f0f2f5;
}

.app {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  overflow-x: hidden;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
}
</style>
