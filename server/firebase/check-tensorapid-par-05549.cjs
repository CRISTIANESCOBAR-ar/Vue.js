const admin = require('firebase-admin')
const path = require('path')

// Buscar el archivo de credenciales
const serviceAccountPath = path.resolve(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json')

try {
  const serviceAccount = require(serviceAccountPath)
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
} catch (err) {
  console.error('❌ Error cargando credenciales:', err.message)
  process.exit(1)
}

const db = admin.firestore()

async function checkDuplicates() {
  try {
    console.log('🔍 Buscando TENSORAPID_PAR para USTER_TESTNR = 05549...\n')
    
    const snap = await db.collection('TENSORAPID_PAR')
      .where('USTER_TESTNR', '==', '05549')
      .get()
    
    console.log(`📊 Total de documentos encontrados: ${snap.size}\n`)
    
    if (snap.size === 0) {
      console.log('⚠️  No se encontraron documentos')
      process.exit(0)
    }
    
    const docs = []
    snap.forEach(doc => {
      const data = doc.data()
      docs.push({
        id: doc.id,
        TESTNR: data.TESTNR,
        USTER_TESTNR: data.USTER_TESTNR,
        TIME_STAMP: data.TIME_STAMP?.toDate?.() || data.TIME_STAMP,
        MAQUINA: data.MAQUINA
      })
    })
    
    // Mostrar todos los documentos
    docs.forEach((doc, idx) => {
      console.log(`📄 Documento ${idx + 1}:`)
      console.log(`   ID: ${doc.id}`)
      console.log(`   TESTNR: ${doc.TESTNR}`)
      console.log(`   USTER_TESTNR: ${doc.USTER_TESTNR}`)
      console.log(`   TIME_STAMP: ${doc.TIME_STAMP}`)
      console.log(`   MAQUINA: ${doc.MAQUINA}`)
      console.log()
    })
    
    // Verificar si hay duplicados
    const testnrCounts = {}
    docs.forEach(doc => {
      const key = doc.TESTNR
      testnrCounts[key] = (testnrCounts[key] || 0) + 1
    })
    
    const duplicates = Object.entries(testnrCounts).filter(([_, count]) => count > 1)
    
    if (duplicates.length > 0) {
      console.log('⚠️  DUPLICADOS ENCONTRADOS:')
      duplicates.forEach(([testnr, count]) => {
        console.log(`   TESTNR ${testnr}: ${count} documentos`)
      })
    } else {
      console.log('✅ No hay duplicados por TESTNR')
    }
    
    process.exit(0)
  } catch (err) {
    console.error('❌ Error:', err)
    process.exit(1)
  }
}

checkDuplicates()
