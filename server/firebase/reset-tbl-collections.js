// Delete all docs in *_TBL collections to allow clean reimport
import admin from 'firebase-admin'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'serviceAccountKey.json')

async function init() {
  const serviceAccount = JSON.parse(await fs.readFile(SERVICE_ACCOUNT_PATH, 'utf8'))
  if (admin.apps.length === 0)
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  return admin.firestore()
}

async function deleteAll(db, collection) {
  console.log(`\n🗑️ Clearing ${collection}...`)
  const snap = await db.collection(collection).get()
  if (snap.empty) return console.log('   ℹ Nothing to delete')
  const batchSize = 400
  let deleted = 0
  for (let i = 0; i < snap.docs.length; i += batchSize) {
    const batch = db.batch()
    for (const doc of snap.docs.slice(i, i + batchSize)) batch.delete(doc.ref)
    await batch.commit()
    deleted += Math.min(batchSize, snap.docs.length - i)
    console.log(`   ⏳ Deleted ${deleted}/${snap.docs.length}`)
  }
  console.log('   ✅ Done')
}

async function main() {
  console.log('🚀 Reset *_TBL collections')
  const db = await init()
  await deleteAll(db, 'USTER_TBL')
  await deleteAll(db, 'TENSORAPID_TBL')
  // Best-effort reset for lowercase collections if they exist
  try {
    await deleteAll(db, 'uster_tbl')
  } catch {}
  try {
    await deleteAll(db, 'tensorapid_tbl')
  } catch {}
  console.log('\n✅ Reset complete')
}

main().catch((e) => {
  console.error('❌ Reset failed:', e)
  process.exit(1)
})
