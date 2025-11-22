#!/usr/bin/env node
/* eslint-disable */
/**
 * scripts/check_fecha_docs.js
 *
 * Inspecciona los últimos documentos de una colección de Firestore y muestra
 * el tipo/valor de los campos relevantes (`Fecha`, `TIME_STAMP`, `TIME`, etc.).
 *
 * Requisitos:
 *   npm install firebase-admin yargs
 *
 * Uso:
 *   $env:FIREBASE_SERVICE_ACCOUNT = 'C:\path\to\serviceAccount.json'
 *   node scripts/check_fecha_docs.js --collection USTER_PAR --limit 20
 *
 * o pasando la credencial en la línea de comandos:
 *   node scripts/check_fecha_docs.js --cred C:\path\sa.json --collection USTER_PAR --limit 50
 */

const path = require('path')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

const argv = yargs(hideBin(process.argv))
  .option('cred', { type: 'string', describe: 'Path to service account JSON' })
  .option('collection', {
    type: 'string',
    default: 'USTER_PAR',
    describe: 'Firestore collection name'
  })
  .option('limit', { type: 'number', default: 20, describe: 'Number of docs to fetch' }).argv

const credPath = argv.cred || process.env.FIREBASE_SERVICE_ACCOUNT
if (!credPath) {
  console.error(
    '\nERROR: Debe proveer --cred o la variable de entorno FIREBASE_SERVICE_ACCOUNT que apunte al JSON de servicio.\n'
  )
  process.exit(1)
}

let admin
try {
  admin = require('firebase-admin')
} catch (err) {
  console.error(
    'ERROR: falta dependencia `firebase-admin`. Instala con: npm i firebase-admin --save-dev'
  )
  process.exit(1)
}

const fullCredPath = path.resolve(credPath)
let serviceAccount
try {
  serviceAccount = require(fullCredPath)
} catch (err) {
  console.error('ERROR: no pude leer el archivo de credenciales en', fullCredPath)
  console.error(err.message)
  process.exit(1)
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

function inspectValue(v) {
  if (v == null) return { type: 'null', value: null }
  // Firestore Timestamp (admin SDK) tiene toDate()
  if (typeof v === 'object' && typeof v.toDate === 'function') {
    try {
      return { type: 'Timestamp', value: v.toDate().toISOString() }
    } catch (e) {
      return { type: 'Timestamp', value: String(v) }
    }
  }
  if (v instanceof Date) return { type: 'Date', value: v.toISOString() }
  if (typeof v === 'number') return { type: 'number', value: v }
  if (typeof v === 'string') return { type: 'string', value: v }
  try {
    return { type: typeof v, value: JSON.stringify(v).slice(0, 500) }
  } catch {
    return { type: typeof v, value: String(v) }
  }
}

async function main() {
  try {
    const collectionName = argv.collection
    const limit = Number(argv.limit) || 20
    console.log(`Conectando a Firestore, colección='${collectionName}', limit=${limit}`)

    const colRef = db.collection(collectionName)
    // intentar ordenar por TIME_STAMP si existe, fallar a get() si no hay índice
    let snapshot
    try {
      snapshot = await colRef.orderBy('TIME_STAMP', 'desc').limit(limit).get()
    } catch (err) {
      // fallback: sin orden
      console.warn(
        'No se pudo ordenar por TIME_STAMP (posible falta de índice). Haciendo consulta sin orderBy...'
      )
      snapshot = await colRef.limit(limit).get()
    }

    console.log(`Documentos recuperados: ${snapshot.size}\n`)

    snapshot.forEach((doc, idx) => {
      const data = doc.data()
      console.log(`DOC ${idx + 1} id=${doc.id}`)
      const keys = Object.keys(data).slice(0, 40)
      console.log('  keys:', keys.join(', '))

      const campos = ['TIME_STAMP', 'TIME', 'TIMESTAMP', 'Fecha', 'FECHA', 'fecha', 'date']
      campos.forEach((k) => {
        if (k in data) {
          const v = data[k]
          const info = inspectValue(v)
          console.log(`  ${k} -> type=${info.type} value=${info.value}`)
        }
      })

      // además imprimir un resumen de Fecha si hay múltiples campos
      const raw = data['Fecha'] ?? data['FECHA'] ?? data['fecha'] ?? data['date'] ?? null
      const ts = data['TIME_STAMP'] ?? data['TIME'] ?? data['TIMESTAMP'] ?? null
      if (raw == null && ts == null) {
        console.log('  (sin campos de fecha conocidos)')
      }

      console.log('')
    })

    process.exit(0)
  } catch (err) {
    console.error('ERROR en script:', err)
    process.exit(2)
  }
}

main()
