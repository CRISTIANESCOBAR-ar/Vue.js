// Deduplicate Firestore *_TBL collections by TESTNR + row number (NO/HUSO_NUMBER)
import admin from 'firebase-admin'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'serviceAccountKey.json')

async function init() {
  const serviceAccount = JSON.parse(await fs.readFile(SERVICE_ACCOUNT_PATH, 'utf8'))
  if (admin.apps.length === 0) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  }
  return admin.firestore()
}

function normalizeNo(v) {
  if (v == null) return ''
  const s = String(v).trim()
  if (s === '') return ''
  const n = Number(s)
  if (!Number.isNaN(n)) return String(n) // quita ceros a la izquierda
  return s
}

function makeKey(collectionName, data) {
  const testnr = String(data.TESTNR ?? data.testnr ?? '')
  // En USTER_TBL el número de huso puede venir como NO o NO_
  // En TENSORAPID_TBL viene como HUSO_NUMBER (o NO en algunos dumps)
  const noField = normalizeNo(
    data.NO ?? data['NO_'] ?? data.NO_ ?? data.HUSO_NUMBER ?? data.HUSO ?? data.huso ?? data.no
  )
  const no = noField || ''
  return testnr && no ? `${testnr}_${no}` : ''
}

async function dedupeCollection(db, collectionName) {
  console.log(`\n🧹 Scanning ${collectionName} for duplicates...`)
  const snap = await db.collection(collectionName).get()
  console.log(`   ℹ Total docs: ${snap.size}`)

  const seen = new Map() // key -> docRef to keep
  const toDelete = []

  for (const doc of snap.docs) {
    const key = makeKey(collectionName, doc.data())
    if (!key) continue // skip invalid keys
    if (!seen.has(key)) {
      seen.set(key, doc.ref)
    } else {
      toDelete.push(doc.ref)
    }
  }

  console.log(`   ℹ Unique keys: ${seen.size}`)
  console.log(`   ❗ Duplicates to delete: ${toDelete.length}`)

  // Delete in batches
  const batchSize = 400
  let deleted = 0
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = db.batch()
    const chunk = toDelete.slice(i, i + batchSize)
    for (const ref of chunk) batch.delete(ref)
    await batch.commit()
    deleted += chunk.length
    console.log(`   ⏳ Deleted ${deleted}/${toDelete.length}`)
  }

  console.log(`   ✅ Done. Kept ${seen.size} docs, removed ${deleted}.`)
}

async function main() {
  console.log('🚀 Starting cleanup...')
  const db = await init()
  await dedupeCollection(db, 'USTER_TBL')
  await dedupeCollection(db, 'TENSORAPID_TBL')
  // Si también existen colecciones en minúsculas (entornos antiguos), limpiarlas
  try {
    await dedupeCollection(db, 'uster_tbl')
  } catch {}
  try {
    await dedupeCollection(db, 'tensorapid_tbl')
  } catch {}
  console.log('\n✅ Cleanup completed')
}

main().catch((e) => {
  console.error('❌ Cleanup failed:', e)
  process.exit(1)
})
