// Verificar datos más recientes en Firebase
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

async function verifyCollection(db, collectionName) {
  console.log(`\n📊 Verificando ${collectionName}...`)
  
  const snapshot = await db.collection(collectionName).get()
  console.log(`   Total documentos: ${snapshot.size}`)

  if (snapshot.empty) {
    console.log('   ⚠️  Colección vacía')
    return
  }

  // Obtener todos los documentos y ordenar por fecha
  const docs = snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      TESTNR: data.TESTNR,
      TIME_STAMP: data.TIME_STAMP || data.TIME, // TENSORAPID usa TIME en lugar de TIME_STAMP
      OBS: data.OBS,
      LABORANT: data.LABORANT
    }
  })

  // Ordenar por fecha descendente
  const sorted = docs.sort((a, b) => {
    const dateA = a.TIME_STAMP?.toDate?.() || new Date(a.TIME_STAMP || 0)
    const dateB = b.TIME_STAMP?.toDate?.() || new Date(b.TIME_STAMP || 0)
    return dateB - dateA
  })

  console.log('\n   📅 Últimos 10 registros por fecha:')
  sorted.slice(0, 10).forEach((doc, idx) => {
    const fecha = doc.TIME_STAMP?.toDate?.() || new Date(doc.TIME_STAMP)
    const fechaStr = fecha.toLocaleDateString('es-AR')
    const obs = (doc.OBS || 'Sin OBS').substring(0, 40)
    const lab = doc.LABORANT || '-'
    console.log(`   ${(idx + 1).toString().padStart(2)}. TESTNR: ${doc.TESTNR} | ${fechaStr} | Lab: ${lab} | OBS: ${obs}`)
  })

  // Verificar rango de fechas
  const primeraFecha = sorted[sorted.length - 1].TIME_STAMP?.toDate?.() || new Date(sorted[sorted.length - 1].TIME_STAMP)
  const ultimaFecha = sorted[0].TIME_STAMP?.toDate?.() || new Date(sorted[0].TIME_STAMP)
  
  console.log(`\n   📆 Rango de fechas:`)
  console.log(`      Primera: ${primeraFecha.toLocaleDateString('es-AR')}`)
  console.log(`      Última:  ${ultimaFecha.toLocaleDateString('es-AR')}`)
}

async function main() {
  console.log('🔍 Verificando datos más recientes en Firebase\n')
  
  const db = await init()
  
  await verifyCollection(db, 'USTER_PAR')
  await verifyCollection(db, 'TENSORAPID_PAR')
  
  console.log('\n✅ Verificación completada')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
