// Simple wrapper to run Firebase import
import admin from 'firebase-admin'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'serviceAccountKey.json')
const DATA_DIR = path.join(__dirname, 'data')

const COLLECTIONS = [
  { file: 'uster_par.json', collection: 'USTER_PAR', idField: 'TESTNR' },
  { file: 'uster_tbl.json', collection: 'USTER_TBL', idField: null },
  { file: 'tensorapid_par.json', collection: 'TENSORAPID_PAR', idField: 'TESTNR' },
  { file: 'tensorapid_tbl.json', collection: 'TENSORAPID_TBL', idField: null }
]

console.log('🚀 Starting Firebase import...\n')

try {
  // Initialize Firebase
  console.log('📦 Loading service account credentials...')
  const serviceAccount = JSON.parse(await fs.readFile(SERVICE_ACCOUNT_PATH, 'utf8'))

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })

  const db = admin.firestore()
  console.log('✅ Connected to Firebase Firestore\n')

  // Import each collection
  for (const config of COLLECTIONS) {
    const filePath = path.join(DATA_DIR, config.file)
    console.log(`📥 Importing ${config.collection}...`)

    // Read JSON file
    const jsonData = await fs.readFile(filePath, 'utf8')
    const documents = JSON.parse(jsonData)
    console.log(`   ℹ Found ${documents.length} documents`)

    // Convert ISO strings back to Timestamps
    const converted = documents.map((doc) => {
      const newDoc = {}
      for (const [key, value] of Object.entries(doc)) {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          newDoc[key] = admin.firestore.Timestamp.fromDate(new Date(value))
        } else {
          newDoc[key] = value
        }
      }
      return newDoc
    })

    // Batch write (500 per batch - Firestore limit)
    const batchSize = 500
    let imported = 0

    for (let i = 0; i < converted.length; i += batchSize) {
      const batch = db.batch()
      const chunk = converted.slice(i, i + batchSize)

      for (const doc of chunk) {
        const docId = config.idField
          ? String(doc[config.idField])
          : db.collection(config.collection).doc().id
        const docRef = db.collection(config.collection).doc(docId)
        batch.set(docRef, doc)
      }

      await batch.commit()
      imported += chunk.length
      console.log(`   ⏳ Progress: ${imported}/${converted.length}`)
    }

    // Verify
    const snapshot = await db.collection(config.collection).count().get()
    const count = snapshot.data().count
    console.log(`   ✅ Verified: ${count} documents in Firestore\n`)
  }

  console.log('✅ Import complete!')
  console.log('\n📊 Summary:')
  for (const config of COLLECTIONS) {
    const snapshot = await db.collection(config.collection).count().get()
    console.log(`   - ${config.collection}: ${snapshot.data().count} documents`)
  }

  process.exit(0)
} catch (error) {
  console.error('\n❌ Import failed:', error.message)
  console.error(error.stack)
  process.exit(1)
}
