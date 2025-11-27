/**
 * Adds PASADOR column to USTER_PAR table
 * PASADOR VARCHAR2(3) stores 'Sí' or 'No' to indicate if thread guide was used
 */

import oracledb from 'oracledb'
import { initPool, getConnection } from './db.js'
import dotenv from 'dotenv'

dotenv.config()

const SCHEMA_PREFIX = process.env.SCHEMA_PREFIX || ''

async function addPasadorColumn() {
  let conn
  try {
    console.log('Connecting to Oracle...')
    await initPool()
    conn = await getConnection()

    // Check if column already exists
    const checkSql = `
      SELECT COUNT(*) AS CNT
      FROM USER_TAB_COLUMNS
      WHERE TABLE_NAME = 'USTER_PAR'
        AND COLUMN_NAME = 'PASADOR'
    `
    
    const checkResult = await conn.execute(checkSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT })
    const exists = checkResult.rows && checkResult.rows[0] && checkResult.rows[0].CNT > 0

    if (exists) {
      console.log('✓ Column PASADOR already exists in USTER_PAR')
      return
    }

    console.log('Adding column PASADOR to USTER_PAR...')
    
    const alterSql = `
      ALTER TABLE ${SCHEMA_PREFIX}USTER_PAR
      ADD PASADOR VARCHAR2(3)
    `
    
    await conn.execute(alterSql, [], { autoCommit: true })
    
    console.log('✓ Successfully added column PASADOR to USTER_PAR')
    console.log('  Type: VARCHAR2(3)')
    console.log('  Purpose: Stores "Sí" or "No" to indicate if thread guide (pasador) was used')

  } catch (err) {
    console.error('Error adding PASADOR column:', err)
    throw err
  } finally {
    if (conn) {
      try {
        await conn.close()
      } catch (e) {
        console.error('Error closing connection:', e)
      }
    }
  }
}

// Run if called directly
addPasadorColumn()
  .then(() => {
    console.log('\nDone!')
    process.exit(0)
  })
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })

export { addPasadorColumn }
