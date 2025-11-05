/* eslint-env node */
/**
 * Add CREATED_AT and UPDATED_AT timestamp columns to TENSORAPID_PAR
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

async function addTimestamps() {
  let conn
  try {
    await initPool()
    conn = await getConnection()

    console.log('📅 Adding timestamp columns to TENSORAPID_PAR...')

    // Check if CREATED_AT exists
    const checkCreated = await conn.execute(
      `SELECT COUNT(*) as cnt FROM user_tab_columns 
       WHERE table_name = 'TENSORAPID_PAR' AND column_name = 'CREATED_AT'`
    )
    const createdExists = checkCreated.rows[0][0] > 0

    if (!createdExists) {
      await conn.execute(
        `ALTER TABLE ${SCHEMA_PREFIX}TENSORAPID_PAR 
         ADD CREATED_AT TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL`
      )
      console.log('   ✓ Added CREATED_AT column')
    } else {
      console.log('   - CREATED_AT already exists')
    }

    // Check if UPDATED_AT exists
    const checkUpdated = await conn.execute(
      `SELECT COUNT(*) as cnt FROM user_tab_columns 
       WHERE table_name = 'TENSORAPID_PAR' AND column_name = 'UPDATED_AT'`
    )
    const updatedExists = checkUpdated.rows[0][0] > 0

    if (!updatedExists) {
      await conn.execute(
        `ALTER TABLE ${SCHEMA_PREFIX}TENSORAPID_PAR 
         ADD UPDATED_AT TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL`
      )
      console.log('   ✓ Added UPDATED_AT column')
    } else {
      console.log('   - UPDATED_AT already exists')
    }

    await conn.commit()
    console.log('\n✅ Timestamp columns added successfully!')
    console.log('   CREATED_AT: Set automatically on INSERT')
    console.log('   UPDATED_AT: Will be updated on each MERGE')
  } catch (err) {
    console.error('❌ Error adding timestamps:', err)
    if (conn) {
      try {
        await conn.rollback()
      } catch (e) {
        console.error('Rollback failed:', e)
      }
    }
    throw err
  } finally {
    if (conn) {
      try {
        await conn.close()
      } catch (e) {
        console.error('Connection close error:', e)
      }
    }
  }
}

addTimestamps()
  .then(() => {
    console.log('\n🎉 Done!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n💥 Failed:', err)
    process.exit(1)
  })
