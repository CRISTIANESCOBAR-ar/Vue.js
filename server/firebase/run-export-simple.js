// Simple wrapper to run export
import { getConnection, exportTable } from './export-oracle.js'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, 'data')

const SCHEMA_PREFIX = process.env.SCHEMA_PREFIX
  ? process.env.SCHEMA_PREFIX.replace(/\.+$/u, '') + '.'
  : ''

const TABLES = [
  { name: `${SCHEMA_PREFIX}USTER_PAR`, file: 'uster_par.json' },
  { name: `${SCHEMA_PREFIX}USTER_TBL`, file: 'uster_tbl.json' },
  { name: `${SCHEMA_PREFIX}TENSORAPID_PAR`, file: 'tensorapid_par.json' },
  { name: `${SCHEMA_PREFIX}TENSORAPID_TBL`, file: 'tensorapid_tbl.json' }
]

console.log('🚀 Starting Oracle export...\n')

try {
  // Create data directory
  await fs.mkdir(DATA_DIR, { recursive: true })
  console.log(`📁 Created directory: ${DATA_DIR}\n`)

  // Get Oracle connection
  const conn = await getConnection()
  console.log('✅ Connected to Oracle\n')

  // Export each table
  for (const table of TABLES) {
    await exportTable(conn, table.name, table.file)
  }

  // Close connection
  await conn.close()
  console.log('\n🔌 Oracle connection closed')
  console.log('\n✅ Export complete!')
} catch (error) {
  console.error('\n❌ Export failed:', error.message)
  console.error(error.stack)
  process.exit(1)
}
