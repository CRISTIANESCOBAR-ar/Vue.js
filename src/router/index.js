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
    component: CargaArchivo,
    meta: { title: 'Carga de Archivo' }
  },
  {
    path: '/pagina2',
    name: 'Pagina2',
    component: Pagina2,
    meta: { title: 'Página 2' }
  },
  {
    path: '/pagina3',
    name: 'Pagina3',
    component: Pagina3,
    meta: { title: 'Página 3' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
