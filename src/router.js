import { createRouter, createWebHistory } from 'vue-router'
import LoginForm from './components/LoginForm.vue'
import FontSelector from './components/FontSelector.vue'

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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
