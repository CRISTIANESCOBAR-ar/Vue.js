import { createApp } from 'vue'
// Import global CSS (Tailwind via PostCSS)
import './index.css'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Importa el plugin oficial y sus estilos
import { plugin as TippyPlugin } from 'vue-tippy'
import 'tippy.js/dist/tippy.css'

const app = createApp(App)
app.use(createPinia()) // ✅ registra el store

// Usa el plugin con configuración elegante
app.use(TippyPlugin, {
  directive: 'tippy',
  component: 'tippy',

  defaultProps: {
    placement: 'right',
    animation: 'shift-away',
    theme: 'light-border',
    arrow: true,
    delay: [100, 0],
    duration: [200, 150],
    offset: [0, 10],
    maxWidth: 200
  }
})

app.use(router)
app.mount('#app')

import { registerSW } from 'virtual:pwa-register'
import Swal from 'sweetalert2'

const updateSW = registerSW({
  onNeedRefresh() {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: '¡Actualización disponible!',
      text: 'Haz clic para recargar y obtener la última versión.',
      showConfirmButton: true,
      confirmButtonText: 'Recargar',
      showCancelButton: true,
      cancelButtonText: 'Más tarde',
      timer: 10000,
      timerProgressBar: true
    }).then((result) => {
      if (result.isConfirmed) {
        updateSW(true) // fuerza el update
      }
    })
  },
  onOfflineReady() {
    // offline ready - no-op to avoid console usage in linted environment
    try {
      /* offline ready */
    } catch {
      /* noop */
    }
  }
})
