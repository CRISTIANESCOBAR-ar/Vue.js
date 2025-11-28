// Remove duplicate documents from Firebase collections
import admin from 'firebase-admin'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'serviceAccountKey.json')

console.log('🧹 Starting duplicate removal from Firebase...\n')

try {
  // Initialize Firebase
  console.log('📦 Loading service account credentials...')
  const serviceAccount = JSON.parse(
    await import('fs/promises').then(fs => fs.readFile(SERVICE_ACCOUNT_PATH, 'utf8'))
  )

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })

  const db = admin.firestore()
  console.log('✅ Connected to Firebase Firestore\n')

  // Process USTER_PAR collection
  console.log('🔍 Checking USTER_PAR for duplicates...')
  const usterParSnapshot = await db.collection('USTER_PAR').get()
  const usterParDocs = usterParSnapshot.docs

  const seenTestnrs = new Map()
  const duplicates = []

  usterParDocs.forEach(doc => {
    const testnr = doc.data().TESTNR
    if (seenTestnrs.has(testnr)) {
      // Keep the one with latest TIME_STAMP
      const existing = seenTestnrs.get(testnr)
      const existingData = existing.data()
      const currentData = doc.data()
      
      const existingTime = existingData.TIME_STAMP instanceof admin.firestore.Timestamp
        ? existingData.TIME_STAMP.toDate()
        : new Date(existingData.TIME_STAMP || 0)
      
      const currentTime = currentData.TIME_STAMP instanceof admin.firestore.Timestamp
        ? currentData.TIME_STAMP.toDate()
        : new Date(currentData.TIME_STAMP || 0)

      if (currentTime > existingTime) {
        // Current is newer, mark existing as duplicate
        duplicates.push(existing.id)
        seenTestnrs.set(testnr, doc)
      } else {
        // Existing is newer, mark current as duplicate
        duplicates.push(doc.id)
      }
    } else {
      seenTestnrs.set(testnr, doc)
    }
  })

  console.log(`   Found ${duplicates.length} duplicate documents`)

  if (duplicates.length > 0) {
    console.log('🗑️  Deleting duplicates...')
    const batchSize = 500
    for (let i = 0; i < duplicates.length; i += batchSize) {
      const batch = db.batch()
      const chunk = duplicates.slice(i, i + batchSize)
      chunk.forEach(docId => {
        batch.delete(db.collection('USTER_PAR').doc(docId))
      })
      await batch.commit()
      console.log(`   Deleted ${Math.min(i + batchSize, duplicates.length)}/${duplicates.length}`)
    }
    console.log(`✅ Removed ${duplicates.length} duplicates from USTER_PAR\n`)
  } else {
    console.log('✅ No duplicates found in USTER_PAR\n')
  }

  // Verify final count
  const finalSnapshot = await db.collection('USTER_PAR').count().get()
  console.log(`📊 Final count: ${finalSnapshot.data().count} documents\n`)

  console.log('✅ Cleanup complete!')
  process.exit(0)
} catch (error) {
  console.error('\n❌ Cleanup failed:', error.message)
  console.error(error.stack)
  process.exit(1)
}
