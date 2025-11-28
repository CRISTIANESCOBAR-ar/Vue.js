import { ref } from 'vue'

const STORAGE_KEY = 'analisis-stock-data'

export function useLocalStorage() {
  const data = ref(null)

  // Cargar datos desde localStorage
  const loadData = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        data.value = JSON.parse(stored)
        return data.value
      }
    } catch (error) {
      console.error('Error al cargar datos desde localStorage:', error)
    }
    return null
  }

  // Guardar datos en localStorage
  const saveData = (newData) => {
    try {
      const dataToSave = {
        ...newData,
        lastUpdate: new Date().toISOString()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
      data.value = dataToSave
      return true
    } catch (error) {
      console.error('Error al guardar datos en localStorage:', error)
      return false
    }
  }

  // Limpiar datos
  const clearData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      data.value = null
      return true
    } catch (error) {
      console.error('Error al limpiar datos:', error)
      return false
    }
  }

  // Obtener fecha de última actualización
  const getLastUpdate = () => {
    const stored = loadData()
    return stored?.lastUpdate || null
  }

  return {
    data,
    loadData,
    saveData,
    clearData,
    getLastUpdate
  }
}
