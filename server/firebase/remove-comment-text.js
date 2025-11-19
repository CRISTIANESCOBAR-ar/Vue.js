// Remove COMMENT_TEXT field from all docs in TENSORAPID_PAR
import admin from 'firebase-admin'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function initFirestore() {
  const serviceAccount = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'serviceAccountKey.json'), 'utf8')
  )
  if (admin.apps.length === 0) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  }
  return admin.firestore()
}

async function removeFieldFromCollection(collectionName, fieldName) {
  const db = initFirestore()
  console.log(`\n🧹 Eliminando campo ${fieldName} en colección ${collectionName}...`)

  const snap = await db.collection(collectionName).get()
  console.log(`   Total documentos: ${snap.size}`)

  if (snap.empty) {
    console.log('   No hay documentos para procesar')
    return 0
  }

  const BATCH_LIMIT = 500
  let processed = 0
  let modified = 0
  let batch = db.batch()
  let batchCount = 0

  for (const doc of snap.docs) {
    processed++
    const data = doc.data() || {}
    if (Object.prototype.hasOwnProperty.call(data, fieldName)) {
      batch.update(doc.ref, { [fieldName]: admin.firestore.FieldValue.delete() })
      batchCount++
      modified++
    }

    if (batchCount >= BATCH_LIMIT) {
      await batch.commit()
      console.log(
        `   💾 Commit de batch (${batchCount} updates) - procesados ${processed}/${snap.size}`
      )
      batch = db.batch()
      batchCount = 0
    }
  }

  if (batchCount > 0) {
    await batch.commit()
    console.log(`   💾 Commit final (${batchCount} updates)`)
  }

  console.log(`   ✅ Campo eliminado en ${modified} documentos`)
  return modified
}

async function main() {
  try {
    const count = await removeFieldFromCollection('TENSORAPID_PAR', 'COMMENT_TEXT')
    console.log(`\n✅ Terminado. Total modificados: ${count}`)
    process.exit(0)
  } catch (err) {
    console.error('❌ Error eliminando COMMENT_TEXT:', err)
    process.exit(1)
  }
}

main()
