/* eslint-env node */
/**
 * Script to drop TENSORAPID_PAR and recreate with clean schema matching .PAR file fields exactly
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

async function recreateClean() {
  let conn
  try {
    await initPool()
    conn = await getConnection()

    console.log('🗑️  Dropping old TENSORAPID_PAR table...')

    // First drop the FK constraint from TENSORAPID_TBL if it exists
    try {
      await conn.execute(
        `ALTER TABLE ${SCHEMA_PREFIX}TENSORAPID_TBL DROP CONSTRAINT FK_TENSORAPID_TBL_PAR`
      )
      console.log('   ✓ Dropped FK constraint FK_TENSORAPID_TBL_PAR')
    } catch (err) {
      if (err.errorNum === 2443) {
        console.log('   - FK constraint FK_TENSORAPID_TBL_PAR does not exist (OK)')
      } else {
        console.warn('   ⚠️  Error dropping FK (may not exist):', err.message)
      }
    }

    // Drop the table
    try {
      await conn.execute(`DROP TABLE ${SCHEMA_PREFIX}TENSORAPID_PAR CASCADE CONSTRAINTS`)
      console.log('   ✓ Dropped table TENSORAPID_PAR')
    } catch (err) {
      if (err.errorNum === 942) {
        console.log('   - Table TENSORAPID_PAR does not exist (OK)')
      } else {
        throw err
      }
    }

    console.log('\n✨ Creating new TENSORAPID_PAR table with clean schema...')

    // Create new table with exact .PAR fields
    // Note: COMMENT is a reserved word in Oracle, so we use "COMMENT" (quoted identifier)
    const createSql = `
      CREATE TABLE ${SCHEMA_PREFIX}TENSORAPID_PAR (
        TESTNR VARCHAR2(50) PRIMARY KEY,
        USTER_TESTNR VARCHAR2(50),
        CATALOG VARCHAR2(200),
        TIME VARCHAR2(100),
        SORTIMENT VARCHAR2(200),
        ARTICLE VARCHAR2(200),
        MASCHNR VARCHAR2(100),
        MATCLASS VARCHAR2(100),
        NOMCOUNT NUMBER,
        NOMTWIST NUMBER,
        USCODE VARCHAR2(100),
        LABORANT VARCHAR2(200),
        "COMMENT" VARCHAR2(500),
        LOTE VARCHAR2(200),
        TUNAME VARCHAR2(200),
        GROUPS NUMBER,
        WITHIN NUMBER,
        TOTAL NUMBER,
        UNSPOOLGROUPS NUMBER,
        LENGTH NUMBER,
        EXTSPEED NUMBER,
        PRETENSION NUMBER,
        CLAMPPRESSURE NUMBER,
        CYCLEFORCELL NUMBER,
        CYCLEFORCEUL NUMBER,
        NMBOFFORCECYCLES NUMBER,
        CYCLELONGLL NUMBER,
        CYCLELONGUL NUMBER,
        NMBOFELONGCYCLES NUMBER,
        FORCEF1REL NUMBER,
        ELONGATIONE1REL NUMBER,
        EVALTIMEREL NUMBER,
        PRELOADCYCLESREL NUMBER,
        FORCEF1RET NUMBER,
        ELONGATIONE1RET NUMBER,
        EVALTIMERET NUMBER,
        PRELOADCYCLESRET NUMBER,
        CONSTRAINT FK_TENSORAPID_PAR_USTER FOREIGN KEY (USTER_TESTNR) REFERENCES ${SCHEMA_PREFIX}USTER_PAR(TESTNR)
      )
    `

    await conn.execute(createSql)
    console.log('   ✓ Created table TENSORAPID_PAR')

    // Recreate FK from TENSORAPID_TBL
    console.log('\n🔗 Recreating foreign key from TENSORAPID_TBL...')
    try {
      await conn.execute(`
        ALTER TABLE ${SCHEMA_PREFIX}TENSORAPID_TBL
        ADD CONSTRAINT FK_TENSORAPID_TBL_PAR
        FOREIGN KEY (TESTNR) REFERENCES ${SCHEMA_PREFIX}TENSORAPID_PAR(TESTNR)
        ON DELETE CASCADE
      `)
      console.log('   ✓ Created FK constraint FK_TENSORAPID_TBL_PAR')
    } catch (err) {
      console.warn('   ⚠️  Could not create FK (check if TENSORAPID_TBL exists):', err.message)
    }

    // Create index on USTER_TESTNR for performance
    console.log('\n📊 Creating index on USTER_TESTNR...')
    try {
      await conn.execute(`
        CREATE INDEX ${SCHEMA_PREFIX}IDX_TENSORAPID_PAR_USTER 
        ON ${SCHEMA_PREFIX}TENSORAPID_PAR(USTER_TESTNR)
      `)
      console.log('   ✓ Created index IDX_TENSORAPID_PAR_USTER')
    } catch (err) {
      if (err.errorNum === 955) {
        console.log('   - Index already exists (OK)')
      } else {
        console.warn('   ⚠️  Could not create index:', err.message)
      }
    }

    await conn.commit()

    console.log('\n✅ Table TENSORAPID_PAR recreated successfully!')
    console.log('\nSchema summary:')
    console.log('  - Primary key: TESTNR')
    console.log('  - Foreign key to USTER_PAR: USTER_TESTNR')
    console.log('  - All 36 .PAR fields mapped')
    console.log('  - Ready for uploads from TensoRapid.vue')
  } catch (err) {
    console.error('❌ Error recreating table:', err)
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

recreateClean()
  .then(() => {
    console.log('\n🎉 Done!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n💥 Failed:', err)
    process.exit(1)
  })
