/* global console */

import fs from 'fs'
import path from 'path'
import oracledb from 'oracledb'
import process from 'process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function run() {
  const user = process.env.ORACLE_USER || 'SYSTEM'
  const pass = process.env.ORACLE_PASSWORD || 'Alfa1984'
  const connStr = process.env.ORACLE_CONNECTIONSTRING || 'localhost:1521/XE'

  const sqlPath = path.resolve(__dirname, '..', 'sql', 'create_uster_tables.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')

  // Parse the SQL file into executable statements.
  // Strategy:
  // 1) Split the file into blocks separated by a line that contains only '/'. Those are PL/SQL blocks.
  // 2) For each block, if it looks like a PL/SQL block (contains 'BEGIN' or 'DECLARE'), keep as one statement.
  // 3) Otherwise split by semicolon+newline to get individual statements.
  const parts = []
  const blocks = sql.split(/\r?\n\/\s*\r?\n/)
  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed) continue
    // Remove leading comment lines so blocks that start with comments but
    // contain SQL are not skipped entirely.
    const lines = trimmed.split(/\r?\n/)
    while (
      lines.length > 0 &&
      (lines[0].trim().startsWith('--') || lines[0].trim().startsWith('/*'))
    ) {
      lines.shift()
    }
    if (lines.length === 0) continue

    // Reconstruct the cleaned block (without leading comments)
    const blockClean = lines.join('\n')

    // If the block contains a PL/SQL section (BEGIN/DECLARE/PROCEDURE/FUNCTION)
    // but also contains DDL before it, split the block into (a) pre-PL/SQL
    // statements (split by semicolon) and (b) the PL/SQL block (one statement).
    const plsqlLineIndex = lines.findIndex((ln) =>
      /\bBEGIN\b|\bDECLARE\b|\bFUNCTION\b|\bPROCEDURE\b/i.test(ln)
    )
    if (plsqlLineIndex === -1) {
      // No PL/SQL: split by semicolons into individual statements
      const stmts = blockClean
        .split(/;\s*\r?\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
      for (const s of stmts) {
        const fl = s.split(/\r?\n/)[0].trim()
        if (fl.startsWith('--') || fl.startsWith('/*')) continue
        parts.push(s)
      }
    } else {
      // There is a PL/SQL portion. Add any preceding DDL statements separately.
      const pre = lines.slice(0, plsqlLineIndex).join('\n').trim()
      if (pre) {
        const preStmts = pre
          .split(/;\s*\r?\n/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
        for (const s of preStmts) {
          const fl = s.split(/\r?\n/)[0].trim()
          if (fl.startsWith('--') || fl.startsWith('/*')) continue
          parts.push(s)
        }
      }
      // Add the PL/SQL block as a single statement
      const plsql = lines.slice(plsqlLineIndex).join('\n').trim()
      if (plsql) parts.push(plsql)
    }
  }

  let conn
  try {
    console.log('Connecting to Oracle...')
    conn = await oracledb.getConnection({ user, password: pass, connectString: connStr })
    console.log('Connected. Executing statements:', parts.length)

    for (let i = 0; i < parts.length; i++) {
      const stmt = parts[i]
      try {
        console.log(`--- Executing statement ${i + 1}/${parts.length} ---`)
        // Use execute with autoCommit true for DDL
        await conn.execute(stmt, [], { autoCommit: true })
      } catch (err) {
        // If object already exists, log and continue (makes the runner idempotent)
        if (err && err.errorNum === 955) {
          console.warn(`Statement ${i + 1} skipped: object already exists (ORA-00955)`)
          continue
        }
        console.error(`Statement ${i + 1} failed:`)
        console.error(err)
        throw err
      }
    }

    console.log('All statements executed successfully.')
  } catch (err) {
    console.error('DDL run failed:', err)
    process.exitCode = 2
  } finally {
    if (conn) {
      try {
        await conn.close()
      } catch (e) {
        console.error('close conn err', e)
      }
    }
  }
}

run()
