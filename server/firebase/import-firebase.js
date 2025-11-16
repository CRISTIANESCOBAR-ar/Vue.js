/* eslint-env node */
/**
 * import-firebase.js
 *
 * Imports JSON files (from export-oracle.js) to Firebase Firestore.
 *
 * Prerequisites:
 * 1. Firebase project created
 * 2. serviceAccountKey.json in this directory
 * 3. JSON files exist in ./data/ directory
 *
 * Usage:
 *   cd server/firebase
 *   node import-firebase.js
 */

import admin from 'firebase-admin'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, 'data')
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'serviceAccountKey.json')

// Firestore collection mapping
const COLLECTIONS = [
  { file: 'uster_par.json', collection: 'uster_par', idField: 'TESTNR' },
  { file: 'uster_tbl.json', collection: 'uster_tbl', idField: null }, // Auto-generated IDs
  { file: 'tensorapid_par.json', collection: 'tensorapid_par', idField: 'TESTNR' },
  { file: 'tensorapid_tbl.json', collection: 'tensorapid_tbl', idField: null }
]

/**
 * Initialize Firebase Admin SDK
 */
async function initializeFirebase() {
  try {
    const serviceAccount = JSON.parse(await fs.readFile(SERVICE_ACCOUNT_PATH, 'utf8'))

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })

    return admin.firestore()
  } catch (err) {
    console.error('❌ Failed to initialize Firebase:', err.message)
    console.log('\nPlease ensure:')
    console.log('  1. serviceAccountKey.json exists in server/firebase/')
    console.log('  2. File contains valid Firebase credentials')
    console.log('\nTo get credentials:')
    console.log('  1. Go to https://console.firebase.google.com')
    console.log('  2. Project Settings → Service Accounts')
    console.log('  3. Generate new private key')
    process.exit(1)
  }
}

/**
 * Import single collection to Firestore
 */
async function importCollection(db, fileName, collectionName, idField) {
  console.log(`\n📦 Importing ${collectionName}...`)

  try {
    const filePath = path.join(DATA_DIR, fileName)
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'))

    if (!Array.isArray(data) || data.length === 0) {
      console.log(`   ⚠️  No data to import`)
      return { collection: collectionName, count: 0 }
    }

    console.log(`   Found ${data.length} records`)

    // Firestore has a limit of 500 writes per batch
    const BATCH_SIZE = 500
    let imported = 0

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = db.batch()
      const chunk = data.slice(i, i + BATCH_SIZE)

      for (const record of chunk) {
        // Use specified ID field or auto-generate
        const docRef =
          idField && record[idField]
            ? db.collection(collectionName).doc(String(record[idField]))
            : db.collection(collectionName).doc()

        // Convert ISO strings back to Firestore Timestamps
        const processedRecord = {}
        for (const [key, value] of Object.entries(record)) {
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            try {
              processedRecord[key] = admin.firestore.Timestamp.fromDate(new Date(value))
            } catch {
              processedRecord[key] = value
            }
          } else {
            processedRecord[key] = value
          }
        }

        batch.set(docRef, processedRecord)
        imported++
      }

      await batch.commit()
      console.log(`   ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${chunk.length} records`)
    }

    console.log(`   ✅ Imported ${imported} records to ${collectionName}`)
    return { collection: collectionName, count: imported }
  } catch (err) {
    console.error(`   ❌ Error importing ${collectionName}:`, err.message)
    throw err
  }
}

/**
 * Verify import by counting documents
 */
async function verifyImport(db, collectionName) {
  try {
    const snapshot = await db.collection(collectionName).count().get()
    return snapshot.data().count
  } catch (err) {
    console.error(`Error verifying ${collectionName}:`, err.message)
    return -1
  }
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting JSON to Firebase Import\n')

  try {
    // Check if data files exist
    console.log('📁 Checking data files...')
    for (const { file } of COLLECTIONS) {
      const filePath = path.join(DATA_DIR, file)
      await fs.access(filePath)
      console.log(`   ✓ ${file}`)
    }

    // Initialize Firebase
    console.log('\n🔥 Initializing Firebase...')
    const db = await initializeFirebase()
    console.log('   ✓ Firebase connected')

    // Import each collection
    const results = []
    for (const { file, collection, idField } of COLLECTIONS) {
      const result = await importCollection(db, file, collection, idField)
      results.push(result)
    }

    // Verify imports
    console.log('\n🔍 Verifying imports...')
    for (const { collection } of results) {
      const count = await verifyImport(db, collection)
      console.log(`   ${collection}: ${count} documents`)
    }

    // Summary
    console.log('\n' + '='.repeat(50))
    console.log('📊 Import Summary:')
    console.log('='.repeat(50))

    let totalRecords = 0
    for (const { collection, count } of results) {
      console.log(`  ${collection.padEnd(25)} ${count.toString().padStart(6)} records`)
      totalRecords += count
    }

    console.log('  ' + '-'.repeat(48))
    console.log(`  ${'TOTAL'.padEnd(25)} ${totalRecords.toString().padStart(6)} records`)
    console.log('='.repeat(50))

    console.log('\n✅ Import completed successfully!')
    console.log('\nNext steps:')
    console.log('  1. Visit Firebase Console to verify data')
    console.log('  2. Test queries in Firestore')
    console.log('  3. Run sync-bidirectional.js for ongoing sync')
  } catch (err) {
    console.error('\n❌ Import failed:', err.message)
    console.error(err.stack)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { importCollection, verifyImport }
