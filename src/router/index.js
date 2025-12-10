import { createRouter, createWebHistory } from 'vue-router'
import CargaArchivo from '../views/CargaArchivo.vue'
import Pagina2 from '../views/Pagina2.vue'
import Pagina3 from '../views/Pagina3.vue'

const routes = [
  {
    path: '/',
    redirect: '/carga-archivo'
  },
  {
    path: '/carga-archivo',
    name: 'CargaArchivo',
    component: CargaArchivo
  },
  {
    path: '/pagina2',
    name: 'Pagina2',
    component: Pagina2
  },
  {
    path: '/pagina3',
    name: 'Pagina3',
    component: Pagina3
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router

