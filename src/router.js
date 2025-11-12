import { createRouter, createWebHistory } from 'vue-router'
import LoginForm from './components/LoginForm.vue'
import FontSelector from './components/FontSelector.vue'
import UsterStatsPage from './components/UsterStatsPage.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
