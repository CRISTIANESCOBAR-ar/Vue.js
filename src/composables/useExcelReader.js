import * as XLSX from 'xlsx'

export function useExcelReader() {
  // Leer archivo Excel
  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          
          // Obtener la primera hoja
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          
          // Convertir a JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '' 
          })

          resolve({
            data: jsonData,
            sheetName: firstSheetName,
            sheetNames: workbook.SheetNames,
            workbook: workbook
          })
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = (error) => reject(error)
      reader.readAsArrayBuffer(file)
    })
  }

  // Leer una hoja específica
  const readSheet = (workbook, sheetName) => {
    try {
      const worksheet = workbook.Sheets[sheetName]
      return XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '' 
      })
    } catch (error) {
      console.error('Error al leer la hoja:', error)
      return null
    }
  }

  // Obtener rango de celdas
  const getCellRange = (worksheet) => {
    return worksheet['!ref'] || ''
  }

  return {
    readExcelFile,
    readSheet,
    getCellRange
  }
}
