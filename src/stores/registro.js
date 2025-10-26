// stores/registro.js
import { defineStore } from 'pinia'

export const useRegistroStore = defineStore('registro', {
  state: () => ({
    registros: []
  }),
  actions: {
    agregar(registro) {
      this.registros.unshift(registro)
    },
    eliminar(idx) {
      this.registros.splice(idx, 1)
    },
    actualizar(idx, nuevo) {
      this.registros.splice(idx, 1, nuevo)
    },
    reset() {
      this.registros.splice(0, this.registros.length)
    }
  }
})
