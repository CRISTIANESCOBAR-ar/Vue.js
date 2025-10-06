//import './assets/tailwind.css'
//import './index.css'      // <- Esto carga Tailwind
import { createApp } from 'vue'
import App from './App.vue'
import 'tippy.js/dist/tippy.css'
import TippyDirective from './directives/v-tippy'  // o './directives/v-tippy' si lo moviste


const app = createApp(App)
app.directive('tippy', TippyDirective)
app.mount('#app')