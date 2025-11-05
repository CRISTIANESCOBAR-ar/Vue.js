/* eslint-env node */
/**
 * Verify TensoRapid data saved in Oracle
 */
import dotenv from 'dotenv'
dotenv.config()
import { getConnection, initPool } from './db.js'

const SCHEMA_PREFIX = (() => {
  try {
    const env = process.env.SCHEMA_PREFIX
    if (!env) return ''
    const trimmed = String(env).trim()
    if (trimmed === '') return ''
    return trimmed.replace(/\.+$/u, '') + '.'
  } catch {
    return ''
  }
})()

async function verifyData() {
  let conn
  try {
    await initPool()
    conn = await getConnection()

    console.log('🔍 Verificando datos guardados en TENSORAPID_PAR...\n')

    // Query PAR data
    const parSql = `
      SELECT TESTNR, USTER_TESTNR, CATALOG, TIME, ARTICLE, MASCHNR, NOMCOUNT, 
             LOTE, LABORANT, "COMMENT"
      FROM ${SCHEMA_PREFIX}TENSORAPID_PAR
      ORDER BY TESTNR DESC
    `
    const parResult = await conn.execute(parSql, [], { outFormat: 4 }) // 4 = OBJECT

    console.log('📊 Registros en TENSORAPID_PAR:', parResult.rows.length)
    console.log('─'.repeat(80))

    parResult.rows.slice(0, 5).forEach((row, idx) => {
      console.log(`\n${idx + 1}. TESTNR: ${row.TESTNR}`)
      console.log(`   USTER_TESTNR: ${row.USTER_TESTNR}`)
      console.log(`   CATALOG: ${row.CATALOG}`)
      console.log(`   TIME: ${row.TIME}`)
      console.log(`   ARTICLE: ${row.ARTICLE}`)
      console.log(`   MASCHNR: ${row.MASCHNR}`)
      console.log(`   NOMCOUNT: ${row.NOMCOUNT}`)
      console.log(`   LOTE: ${row.LOTE}`)
      console.log(`   LABORANT: ${row.LABORANT}`)
      console.log(`   COMMENT: ${row.COMMENT}`)
    })

    // Query TBL data for the latest TESTNR
    if (parResult.rows.length > 0) {
      const latestTestnr = parResult.rows[0].TESTNR
      console.log('\n' + '─'.repeat(80))
      console.log(`\n🔍 Verificando datos TBL para TESTNR: ${latestTestnr}...\n`)

      const tblSql = `
        SELECT TESTNR, HUSO_ENSAYOS, HUSO_NUMBER, TIEMPO_ROTURA, FUERZA_B, 
               ELONGACION, TENACIDAD, TRABAJO
        FROM ${SCHEMA_PREFIX}TENSORAPID_TBL
        WHERE TESTNR = :TESTNR
        ORDER BY HUSO_NUMBER
      `
      const tblResult = await conn.execute(tblSql, { TESTNR: latestTestnr }, { outFormat: 4 })

      console.log('📊 Filas en TENSORAPID_TBL:', tblResult.rows.length)
      console.log('─'.repeat(80))

      tblResult.rows.slice(0, 5).forEach((row, idx) => {
        console.log(`\n${idx + 1}. HUSO: ${row.HUSO_ENSAYOS} (${row.HUSO_NUMBER})`)
        console.log(`   TIEMPO_ROTURA: ${row.TIEMPO_ROTURA}`)
        console.log(`   FUERZA_B: ${row.FUERZA_B}`)
        console.log(`   ELONGACION: ${row.ELONGACION}`)
        console.log(`   TENACIDAD: ${row.TENACIDAD}`)
        console.log(`   TRABAJO: ${row.TRABAJO}`)
      })
    }

    console.log('\n' + '─'.repeat(80))
    console.log('\n✅ Verificación completada!\n')
  } catch (err) {
    console.error('❌ Error:', err)
  } finally {
    if (conn) {
      try {
        await conn.close()
      } catch (e) {
        console.error('Error cerrando conexión:', e)
      }
    }
  }
}

verifyData()
