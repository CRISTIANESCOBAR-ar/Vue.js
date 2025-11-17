/**
 * Script para migrar campos OBS de Oracle a Firebase como strings
 * Lee los campos CLOB correctamente y los sube como strings
 */

import oracledb from 'oracledb'
import admin from 'firebase-admin'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config({ path: '../.env' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuración Oracle
const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECTIONSTRING
}

const SCHEMA_PREFIX = process.env.SCHEMA_PREFIX || ''

// Inicializar Firebase Admin (leer JSON de credenciales en ESM)
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'serviceAccountKey.json'), 'utf8')
)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

async function readOBSFromOracle() {
  let connection

  try {
    console.log('🔌 Conectando a Oracle...')
    connection = await oracledb.getConnection(dbConfig)
    console.log('✅ Conectado a Oracle\n')

    // Leer USTER_PAR con OBS
    const query = `
      SELECT TESTNR, OBS 
      FROM ${SCHEMA_PREFIX}USTER_PAR 
      WHERE OBS IS NOT NULL
      ORDER BY TESTNR
    `

    console.log('📖 Leyendo campos OBS de Oracle...')
    const result = await connection.execute(query, [], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      // Importante: configurar fetchInfo para leer CLOBs como strings
      fetchInfo: {
        OBS: { type: oracledb.STRING }
      }
    })

    console.log(`   Encontrados: ${result.rows.length} registros con OBS\n`)

    return result.rows
  } catch (error) {
    console.error('❌ Error leyendo de Oracle:', error)
    throw error
  } finally {
    if (connection) {
      try {
        await connection.close()
      } catch (err) {
        console.error('Error cerrando conexión:', err)
      }
    }
  }
}

async function uploadOBSToFirebase(obsData) {
  console.log('📤 Subiendo OBS a Firebase...\n')

  try {
    let batch = db.batch()
    let batchCount = 0
    let updatedCount = 0

    for (const row of obsData) {
      const testnr = row.TESTNR
      const obs = row.OBS ? String(row.OBS).trim() : null

      // Solo actualizar si hay contenido real
      if (obs && obs.length > 0) {
        const docRef = db.collection('USTER_PAR').doc(String(testnr))
        // Usar set con merge para evitar fallos si el doc no existe
        batch.set(docRef, { OBS: obs }, { merge: true })

        console.log(`   ✓ ${testnr}: "${obs.substring(0, 50)}${obs.length > 50 ? '...' : ''}"`)

        updatedCount++
        batchCount++

        // Commit cada 500 operaciones
        if (batchCount >= 500) {
          await batch.commit()
          console.log(`   💾 Batch commit (${batchCount} documentos)\n`)
          // Reiniciar batch después del commit
          batch = db.batch()
          batchCount = 0
        }
      }
    }

    // Commit final
    if (batchCount > 0) {
      await batch.commit()
      console.log(`   💾 Batch commit final (${batchCount} documentos)\n`)
    }

    console.log(`✅ Total actualizados: ${updatedCount} documentos`)
    return updatedCount
  } catch (error) {
    console.error('❌ Error subiendo a Firebase:', error)
    throw error
  }
}

async function main() {
  console.log('🔄 Migrando campos OBS de Oracle a Firebase\n')
  console.log('='.repeat(60))
  console.log()

  try {
    // Paso 1: Leer de Oracle
    const obsData = await readOBSFromOracle()

    if (obsData.length === 0) {
      console.log('ℹ️  No hay registros con OBS en Oracle')
      process.exit(0)
    }

    // Paso 2: Subir a Firebase
    const updated = await uploadOBSToFirebase(obsData)

    console.log('\n' + '='.repeat(60))
    console.log('\n✅ Migración completada exitosamente')
    console.log(`📊 Documentos actualizados: ${updated}`)

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error en la migración:', error)
    process.exit(1)
  }
}

// Ejecutar
main()
