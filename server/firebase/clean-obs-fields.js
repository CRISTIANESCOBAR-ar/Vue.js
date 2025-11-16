/**
 * Script para limpiar campos OBS corruptos en Firebase
 * Los campos OBS que contienen objetos stream de Node.js se limpiarán (null)
 */

const admin = require('firebase-admin')
const path = require('path')

// Inicializar Firebase Admin
const serviceAccount = require('./serviceAccountKey.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

// Detectar si un valor es un objeto stream corrupto
function isCorruptedStreamObject(value) {
  if (!value || typeof value !== 'object') return false

  // Detectar objetos stream de Oracle/Node.js
  const streamProps = [
    '_readableState',
    '_writableState',
    '_parentObj',
    '_events',
    'offset',
    '_isActive'
  ]
  const hasStreamProps = streamProps.some((prop) => prop in value)

  return hasStreamProps
}

async function cleanCollection(collectionName) {
  console.log(`\n🔍 Procesando colección: ${collectionName}`)

  try {
    const snapshot = await db.collection(collectionName).get()
    console.log(`   Total documentos: ${snapshot.size}`)

    let cleanedCount = 0
    const batch = db.batch()
    let batchCount = 0

    for (const doc of snapshot.docs) {
      const data = doc.data()

      // Verificar si tiene campo OBS corrupto
      if (data.OBS && isCorruptedStreamObject(data.OBS)) {
        console.log(`   ✓ Limpiando OBS en documento: ${doc.id}`)
        batch.update(doc.ref, { OBS: null })
        cleanedCount++
        batchCount++

        // Commit cada 500 operaciones (límite de Firestore)
        if (batchCount >= 500) {
          await batch.commit()
          console.log(`   💾 Batch commit (${batchCount} documentos)`)
          batchCount = 0
        }
      }
    }

    // Commit final
    if (batchCount > 0) {
      await batch.commit()
      console.log(`   💾 Batch commit final (${batchCount} documentos)`)
    }

    console.log(`   ✅ Limpiados: ${cleanedCount} documentos`)
    return cleanedCount
  } catch (error) {
    console.error(`   ❌ Error procesando ${collectionName}:`, error)
    return 0
  }
}

async function main() {
  console.log('🧹 Iniciando limpieza de campos OBS corruptos en Firebase\n')
  console.log('='.repeat(60))

  // Colecciones a limpiar
  const collections = ['USTER_PAR', 'TENSORAPID_PAR']

  let totalCleaned = 0

  for (const collection of collections) {
    const cleaned = await cleanCollection(collection)
    totalCleaned += cleaned
  }

  console.log('\n' + '='.repeat(60))
  console.log(`\n✅ Proceso completado`)
  console.log(`📊 Total documentos limpiados: ${totalCleaned}`)

  process.exit(0)
}

// Ejecutar
main().catch((error) => {
  console.error('❌ Error fatal:', error)
  process.exit(1)
})
