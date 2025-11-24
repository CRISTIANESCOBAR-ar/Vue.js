import { createRouter, createWebHistory } from 'vue-router'
import LoginForm from './components/LoginForm.vue'
import FontSelector from './components/FontSelector.vue'
import UsterStatsPage from './components/UsterStatsPage.vue'
import ResumenDiario from './components/ResumenDiario.vue'

const routes = [
  {
    path: '/',
    redirect: '/stats' // Redirect to stats page (works with Firebase)
  },
  {
    path: '/login',
    component: LoginForm
  },
  {
    path: '/fuentes',
    component: FontSelector,
    meta: { title: 'Selector de Fuentes' }
  },
  {
    path: '/stats',
    component: UsterStatsPage,
    meta: { title: 'Estadísticas por TESTNR' }
  },
  {
    path: '/resumen-diario',
    component: ResumenDiario,
    meta: { title: 'Resumen Diario' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
