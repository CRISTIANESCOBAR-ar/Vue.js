import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🚀 Starting TensoRapid duplicates cleanup...\n')

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'carga-datos-vue-firebase-adminsdk-fbsvc-f3245e7294.json'), 'utf8')
)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

async function removeDuplicatesFromCollection(collectionName, keyFields) {
  console.log(`\n🔍 Checking ${collectionName} for duplicates...`)
  
  const snapshot = await db.collection(collectionName).get()
  console.log(`   Total documents: ${snapshot.size}`)

  // Group documents by key
  const grouped = new Map()
  
  snapshot.docs.forEach(doc => {
    const data = doc.data()
    
    // Generate key from specified fields
    const keyParts = keyFields.map(field => {
      const value = data[field] || data[field.toLowerCase()] || data[field.toUpperCase()] || ''
      return String(value)
    })
    const key = keyParts.join('#')
    
    if (!key || key === '#' || keyParts.some(p => !p)) {
      console.log(`   ⚠️  Skipping document ${doc.id} - missing key fields`)
      return
    }

    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    
    grouped.get(key).push({
      id: doc.id,
      data: data,
      timestamp: data.TIME_STAMP || data.time_stamp || new Date(0)
    })
  })

  // Find duplicates
  let duplicatesFound = 0
  const toDelete = []

  grouped.forEach((docs, key) => {
    if (docs.length > 1) {
      duplicatesFound += docs.length - 1
      console.log(`   🔄 Found ${docs.length} docs with key: ${key}`)
      
      // Sort by timestamp (keep newest)
      docs.sort((a, b) => {
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp)
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp)
        return timeB - timeA
      })
      
      // Mark all but the first (newest) for deletion
      for (let i = 1; i < docs.length; i++) {
        toDelete.push(docs[i].id)
      }
    }
  })

  console.log(`   📊 Found ${duplicatesFound} duplicate documents`)
  console.log(`   📊 Unique keys: ${grouped.size}`)

  if (toDelete.length === 0) {
    console.log(`   ✅ No duplicates to remove!`)
    return
  }

  console.log(`\n🗑️  Deleting ${toDelete.length} duplicate documents...`)

  // Delete in batches of 500
  const batchSize = 500
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = db.batch()
    const chunk = toDelete.slice(i, i + batchSize)
    
    chunk.forEach(docId => {
      batch.delete(db.collection(collectionName).doc(docId))
    })
    
    await batch.commit()
    console.log(`   ✓ Deleted batch ${Math.floor(i / batchSize) + 1} (${chunk.length} docs)`)
  }

  // Verify final count
  const finalSnapshot = await db.collection(collectionName).get()
  console.log(`   ✅ Final count: ${finalSnapshot.size} documents (removed ${snapshot.size - finalSnapshot.size})`)
}

async function main() {
  try {
    // Clean TENSORAPID_PAR duplicates (by TESTNR only - primary key)
    await removeDuplicatesFromCollection('TENSORAPID_PAR', ['TESTNR'])
    
    // Clean TENSORAPID_TBL duplicates (by TESTNR + HUSO_NUMBER - composite key)
    await removeDuplicatesFromCollection('TENSORAPID_TBL', ['TESTNR', 'HUSO_NUMBER'])
    
    console.log('\n✅ Cleanup complete!')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

main()
