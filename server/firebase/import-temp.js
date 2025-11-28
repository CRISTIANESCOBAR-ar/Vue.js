import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🚀 Starting Firebase import with alternative credentials...\n')

// Use alternative credentials file
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'carga-datos-vue-firebase-adminsdk-fbsvc-f3245e7294.json'), 'utf8')
)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

async function deleteCollection(collectionName) {
  console.log(`🗑️  Deleting old ${collectionName} collection...`)
  const collectionRef = db.collection(collectionName)
  const batchSize = 500

  const query = collectionRef.limit(batchSize)

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject)
  })
}

async function deleteQueryBatch(query, resolve, reject) {
  try {
    const snapshot = await query.get()

    if (snapshot.size === 0) {
      resolve()
      return
    }

    const batch = db.batch()
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    await batch.commit()
    console.log(`   ✓ Deleted ${snapshot.size} documents`)

    // Recurse on the next process tick to avoid stack overflow
    process.nextTick(() => {
      deleteQueryBatch(query, resolve, reject)
    })
  } catch (error) {
    reject(error)
  }
}

async function importCollection(collectionName, filePath) {
  console.log(`📦 Importing ${collectionName}...`)

  const data = JSON.parse(readFileSync(filePath, 'utf8'))
  let batch = db.batch()
  let count = 0
  let batchCount = 0

  for (const doc of data) {
    // Use TESTNR as document ID to prevent duplicates
    const docId = doc.TESTNR || db.collection(collectionName).doc().id
    const docRef = db.collection(collectionName).doc(docId)
    batch.set(docRef, doc, { merge: true })
    count++
    batchCount++

    if (batchCount === 500) {
      await batch.commit()
      console.log(`   ✓ Committed ${count} documents...`)
      batch = db.batch()
      batchCount = 0
    }
  }

  if (batchCount > 0) {
    await batch.commit()
  }

  console.log(`   ✅ Imported ${count} documents\n`)
}

async function main() {
  try {
    const dataDir = join(__dirname, 'data')

    // Delete old collections first
    console.log('🧹 Cleaning old collections...\n')
    await deleteCollection('USTER_PAR')
    await deleteCollection('USTER_TBL')
    await deleteCollection('TENSORAPID_PAR')
    await deleteCollection('TENSORAPID_TBL')
    console.log('✅ Old collections deleted\n')

    // Import new data with uppercase collection names
    await importCollection('USTER_PAR', join(dataDir, 'uster_par.json'))
    await importCollection('USTER_TBL', join(dataDir, 'uster_tbl.json'))
    await importCollection('TENSORAPID_PAR', join(dataDir, 'tensorapid_par.json'))
    await importCollection('TENSORAPID_TBL', join(dataDir, 'tensorapid_tbl.json'))

    console.log('✅ All data imported successfully!')
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  }
}

main()
