import Dexie from 'dexie';

export const db = new Dexie('AnalisisStockDB');

db.version(1).stores({
  snapshots: '++id, date, fileName, folderPath' // Primary key and indexed props
});

export const saveSnapshot = async (file, folderPath, processedData, clientOverrides, direcOverrides = {}) => {
  try {
    // Convertir el archivo a Blob si no lo es ya
    const fileBlob = new Blob([file], { type: file.type });
    
    const snapshot = {
      date: new Date(),
      fileName: file.name,
      folderPath: folderPath,
      fileBlob: fileBlob,
      processedData: JSON.parse(JSON.stringify(processedData)), // Deep copy para evitar problemas de reactividad
      clientOverrides: JSON.parse(JSON.stringify(clientOverrides)),
      direcOverrides: JSON.parse(JSON.stringify(direcOverrides))
    };

    // Verificar si ya existe un backup de hoy para este archivo para actualizarlo en lugar de crear uno nuevo
    // (Opcional: por ahora guardamos todo historial)
    
    return await db.snapshots.add(snapshot);
  } catch (error) {
    console.error('Error saving snapshot to IndexedDB:', error);
    throw error;
  }
};

export const getSnapshots = async () => {
  return await db.snapshots.orderBy('date').reverse().toArray();
};

export const loadSnapshot = async (id) => {
  return await db.snapshots.get(id);
};

export const deleteSnapshot = async (id) => {
  return await db.snapshots.delete(id);
};
