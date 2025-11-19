/* eslint-env node */
/**
 * export-oracle.js
 *
 * Exports data from Oracle database to JSON files.
 * Safe read-only operation - does not modify Oracle.
 *
 * Usage:
 *   cd server/firebase
 *   node export-oracle.js
 */

import dotenv from 'dotenv'
dotenv.config({ path: '../.env' })

import oracledb from 'oracledb'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Output directory
const DATA_DIR = path.join(__dirname, 'data')

// Schema prefix from environment
const SCHEMA_PREFIX = process.env.SCHEMA_PREFIX
  ? process.env.SCHEMA_PREFIX.replace(/\.+$/u, '') + '.'
  : ''

// Tables to export
const TABLES = [
  { name: 'USTER_PAR', file: 'uster_par.json' },
  { name: 'USTER_TBL', file: 'uster_tbl.json' },
  { name: 'TENSORAPID_PAR', file: 'tensorapid_par.json' },
  { name: 'TENSORAPID_TBL', file: 'tensorapid_tbl.json' }
]

/**
 * Get Oracle connection
 */
async function getConnection() {
  return await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectionString: process.env.ORACLE_CONNECTIONSTRING
  })
}

/**
 * Export single table to JSON
 */
async function exportTable(conn, tableName, fileName) {
  console.log(`\n📦 Exporting ${tableName}...`)

  try {
    const sql = `SELECT * FROM ${SCHEMA_PREFIX}${tableName} ORDER BY TESTNR`
    // Map CLOBs to strings where needed to avoid Node streams in JSON
    const fetchInfo = {}
    if (tableName === 'USTER_PAR') {
      fetchInfo.OBS = { type: oracledb.STRING }
    }
    if (tableName === 'TENSORAPID_PAR') {
      fetchInfo.COMMENT_TEXT = { type: oracledb.STRING }
      fetchInfo.PAR_JSON = { type: oracledb.STRING }
    }

    const result = await conn.execute(
      sql,
      {},
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        maxRows: 0, // No limit
        ...(Object.keys(fetchInfo).length ? { fetchInfo } : {})
      }
    )

    const rows = result.rows || []
    console.log(`   ✓ Found ${rows.length} records`)

    // Convert dates to ISO strings for JSON compatibility
    const serialized = rows.map((row) => {
      const obj = {}
      for (const [key, value] of Object.entries(row)) {
        if (value instanceof Date) {
          obj[key] = value.toISOString()
        } else {
          obj[key] = value
        }
      }
      // Normalize/comment handling for TENSORAPID_PAR: prefer COMMENT as string and drop COMMENT_TEXT
      if (tableName === 'TENSORAPID_PAR') {
        if (typeof obj.COMMENT_TEXT === 'string' && obj.COMMENT_TEXT.trim() !== '') {
          // If COMMENT is empty, populate it from COMMENT_TEXT
          if (!obj.COMMENT || String(obj.COMMENT).trim() === '') {
            obj.COMMENT = obj.COMMENT_TEXT
          }
        }
        // Remove COMMENT_TEXT to avoid Firestore map/stream fields
        delete obj.COMMENT_TEXT
      }
      return obj
    })

    // Write to file
    const filePath = path.join(DATA_DIR, fileName)
    await fs.writeFile(filePath, JSON.stringify(serialized, null, 2), 'utf8')

    const stats = await fs.stat(filePath)
    const sizeKB = (stats.size / 1024).toFixed(2)
    console.log(`   ✓ Saved to ${fileName} (${sizeKB} KB)`)

    return { table: tableName, count: rows.length, sizeKB }
  } catch (err) {
    console.error(`   ✗ Error exporting ${tableName}:`, err.message)
    throw err
  }
}

/**
 * Main export function
 */
async function main() {
  console.log('🚀 Starting Oracle to JSON Export\n')
  console.log('Configuration:')
  console.log(`  Oracle User: ${process.env.ORACLE_USER}`)
  console.log(`  Connection: ${process.env.ORACLE_CONNECTIONSTRING}`)
  console.log(`  Schema Prefix: ${SCHEMA_PREFIX || '(none)'}`)
  console.log(`  Output Directory: ${DATA_DIR}`)

  let conn
  const results = []

  try {
    // Create output directory if it doesn't exist
    await fs.mkdir(DATA_DIR, { recursive: true })
    console.log(`\n✓ Output directory ready`)

    // Connect to Oracle
    console.log(`\n🔌 Connecting to Oracle...`)
    conn = await getConnection()
    console.log(`✓ Connected successfully`)

    // Export each table
    for (const { name, file } of TABLES) {
      const result = await exportTable(conn, name, file)
      results.push(result)
    }

    // Summary
    console.log('\n' + '='.repeat(50))
    console.log('📊 Export Summary:')
    console.log('='.repeat(50))

    let totalRecords = 0
    let totalSize = 0

    for (const { table, count, sizeKB } of results) {
      console.log(
        `  ${table.padEnd(20)} ${count.toString().padStart(6)} records  ${sizeKB.padStart(8)} KB`
      )
      totalRecords += count
      totalSize += parseFloat(sizeKB)
    }

    console.log('  ' + '-'.repeat(48))
    console.log(
      `  ${'TOTAL'.padEnd(20)} ${totalRecords.toString().padStart(6)} records  ${totalSize.toFixed(2).padStart(8)} KB`
    )
    console.log('='.repeat(50))

    console.log('\n✅ Export completed successfully!')
    console.log(`\nNext step: Run import-firebase.js to upload to Firebase`)
  } catch (err) {
    console.error('\n❌ Export failed:', err.message)
    process.exit(1)
  } finally {
    if (conn) {
      try {
        await conn.close()
        console.log('\n🔌 Oracle connection closed')
      } catch (err) {
        console.error('Error closing connection:', err.message)
      }
    }
  }
}

// Always run main()
main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})

export { exportTable, getConnection }
