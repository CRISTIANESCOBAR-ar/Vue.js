import { ref } from 'vue'
import { saveCurrentState, loadCurrentState, clearCurrentState } from '../db'

export function useLocalStorage() {
  const data = ref(null)

  // Cargar datos desde IndexedDB
  const loadData = async () => {
    try {
      const stored = await loadCurrentState()
      if (stored) {
        data.value = stored
        return data.value
      }
    } catch (error) {
      console.error('Error al cargar datos desde IndexedDB:', error)
    }
    return null
  }

  // Guardar datos en IndexedDB
  const saveData = async (newData) => {
    try {
      const dataToSave = {
        ...newData,
        lastUpdate: new Date().toISOString()
      }
      await saveCurrentState(dataToSave)
      data.value = dataToSave
      return true
    } catch (error) {
      console.error('Error al guardar datos en IndexedDB:', error)
      return false
    }
  }

  // Limpiar datos
  const clearData = async () => {
    try {
      await clearCurrentState()
      data.value = null
      return true
    } catch (error) {
      console.error('Error al limpiar datos:', error)
      return false
    }
  }

  return {
    data,
    loadData,
    saveData,
    clearData
  }
}
