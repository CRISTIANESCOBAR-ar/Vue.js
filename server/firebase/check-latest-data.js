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

async function checkLatestData() {
  console.log('🔍 Verificando últimos registros en Firebase...\n')

  try {
    // Obtener los últimos 10 registros de USTER_PAR ordenados por TESTNR descendente
    const usterSnapshot = await db.collection('USTER_PAR')
      .orderBy('TESTNR', 'desc')
      .limit(10)
      .get()

    console.log('📊 Últimos 10 registros en USTER_PAR:')
    console.log('TESTNR\tTIME_STAMP\t\tMASCHNR\tNOMCOUNT\tMATCLASS')
    console.log(''.padEnd(80, '-'))
    
    usterSnapshot.forEach(doc => {
      const data = doc.data()
      const timestamp = data.TIME_STAMP || data.time_stamp || data.FECHA || 'N/A'
      console.log(`${data.TESTNR}\t${timestamp}\t${data.MASCHNR || 'N/A'}\t${data.NOMCOUNT || 'N/A'}\t\t${data.MATCLASS || 'N/A'}`)
    })

    console.log('\n📊 Conteo total de registros:')
    
    // Contar todos los registros
    const usterCount = await db.collection('USTER_PAR').count().get()
    const usterTblCount = await db.collection('USTER_TBL').count().get()
    const tensorParCount = await db.collection('TENSORAPID_PAR').count().get()
    const tensorTblCount = await db.collection('TENSORAPID_TBL').count().get()

    console.log(`USTER_PAR: ${usterCount.data().count}`)
    console.log(`USTER_TBL: ${usterTblCount.data().count}`)
    console.log(`TENSORAPID_PAR: ${tensorParCount.data().count}`)
    console.log(`TENSORAPID_TBL: ${tensorTblCount.data().count}`)
    console.log(`\nTotal: ${usterCount.data().count + usterTblCount.data().count + tensorParCount.data().count + tensorTblCount.data().count}`)

  } catch (error) {
    console.error('❌ Error:', error)
  }

  process.exit(0)
}

checkLatestData()
