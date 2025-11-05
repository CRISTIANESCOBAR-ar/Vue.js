/* eslint-env node */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import oracledb from 'oracledb'

const env = typeof process !== 'undefined' && process.env ? process.env : {}
const config = {
  user: env.ORACLE_USER || 'SYSTEM',
  password: env.ORACLE_PASSWORD || 'Alfa1984',
  connectionString: env.ORACLE_CONNECTIONSTRING || 'localhost:1521/XE'
}

async function run() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const file = path.join(__dirname, 'test_payload.json')
  const raw = fs.readFileSync(file, 'utf8')
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    console.error('Failed to parse test_payload.json', e)
    process.exit(1)
  }
  const par = parsed.par || {}
  const testnr = par.TESTNR
  if (!testnr) {
    console.error('No TESTNR in payload')
    process.exit(1)
  }

  let conn
  try {
    console.log('Connecting to Oracle...')
    conn = await oracledb.getConnection(config)
    console.log('Connected')

    const parJson = JSON.stringify(par)
    console.log('Updating PAR_JSON for TESTNR', testnr)
    const sql = `UPDATE TENSORAPID_PAR SET PAR_JSON = :p WHERE TESTNR = :t`
    const binds = { p: parJson, t: testnr }
    const opts = { autoCommit: true }
    const result = await conn.execute(sql, binds, opts)
    console.log('Rows affected:', result.rowsAffected)
  } catch (err) {
    console.error('Error', err)
    process.exit(1)
  } finally {
    if (conn)
      try {
        await conn.close()
      } catch (e) {}
  }
}

run()
