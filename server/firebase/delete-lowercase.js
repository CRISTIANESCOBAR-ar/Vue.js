import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'carga-datos-vue-firebase-adminsdk-fbsvc-f3245e7294.json'), 'utf8')
)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

async function deleteCollection(collectionName) {
  console.log(`🗑️  Deleting ${collectionName} collection...`)
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
    
    process.nextTick(() => {
      deleteQueryBatch(query, resolve, reject)
    })
  } catch (error) {
    reject(error)
  }
}

async function main() {
  try {
    await deleteCollection('uster_par')
    await deleteCollection('uster_tbl')
    await deleteCollection('tensorapid_par')
    await deleteCollection('tensorapid_tbl')
    
    console.log('\n✅ All lowercase collections deleted!')
  } catch (error) {
    console.error('❌ Delete failed:', error)
    process.exit(1)
  }
}

main()
