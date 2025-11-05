/* eslint-env node */
import oracledb from 'oracledb'
import { fileURLToPath } from 'url'
import path from 'path'

const env = typeof process !== 'undefined' && process.env ? process.env : {}
const config = {
  user: env.ORACLE_USER || 'SYSTEM',
  password: env.ORACLE_PASSWORD || 'Alfa1984',
  connectionString: env.ORACLE_CONNECTIONSTRING || 'localhost:1521/XE'
}

async function run() {
  let conn
  const timestamp = new Date().toISOString().replace(/[^A-Za-z0-9]/g, '_')
  const backupName = `TENSORAPID_PAR_BACKUP_${timestamp}`.toUpperCase()
  const newName = 'TENSORAPID_PAR_NEW'
  try {
    console.log('Connecting to Oracle...')
    conn = await oracledb.getConnection(config)
    console.log('Connected')

    // 1) Count rows in current table
    let res = await conn.execute(`SELECT COUNT(*) FROM TENSORAPID_PAR`)
    const origCount = res.rows && res.rows[0] ? Number(res.rows[0][0]) : 0
    console.log('Original TENSORAPID_PAR row count:', origCount)

    // 2) Create backup table
    console.log(`Creating backup table ${backupName}...`)
    await conn.execute(`CREATE TABLE ${backupName} AS SELECT * FROM TENSORAPID_PAR`)
    console.log('Backup created')

    // 3) Find foreign key constraints referencing TENSORAPID_PAR
    console.log('Finding foreign keys referencing TENSORAPID_PAR...')
    res = await conn.execute(
      `SELECT a.constraint_name, a.table_name, acc.column_name
       FROM user_constraints a
       JOIN user_constraints b ON a.r_constraint_name = b.constraint_name
       JOIN user_cons_columns acc ON acc.constraint_name = a.constraint_name
       WHERE b.table_name = 'TENSORAPID_PAR' AND a.constraint_type = 'R'`
    )

    const fks = (res.rows || []).map((r) => ({ name: r[0], table: r[1], column: r[2] }))
    console.log('Foreign keys found:', fks.length)
    fks.forEach((fk) => console.log(` - ${fk.name} on ${fk.table}(${fk.column})`))

    // 4) Drop foreign keys
    for (const fk of fks) {
      console.log(`Dropping constraint ${fk.name} on table ${fk.table}...`)
      await conn.execute(`ALTER TABLE ${fk.table} DROP CONSTRAINT ${fk.name}`)
    }

    // 5) Create new table with desired columns (including both COMMENT_ and "COMMENT" to preserve exact name)
    console.log(`Creating new table ${newName}...`)
    await conn.execute(`
      CREATE TABLE ${newName} (
        TESTNR VARCHAR2(50) PRIMARY KEY,
        USTER_TESTNR VARCHAR2(50),
        CATALOG VARCHAR2(200),
        TIME VARCHAR2(100),
        SORTIMENT VARCHAR2(200),
        ARTICLE VARCHAR2(200),
        MASCHNR VARCHAR2(200),
        MATCLASS VARCHAR2(200),
        NOMCOUNT NUMBER,
        NOMTWIST NUMBER,
        USCODE VARCHAR2(500),
        LABORANT VARCHAR2(200),
        COMMENT_ VARCHAR2(2000),
        "COMMENT" VARCHAR2(2000),
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
        PAR_JSON CLOB,
        CREATED_AT TIMESTAMP DEFAULT SYSTIMESTAMP
      )
    `)
    console.log('New table created')

    // 6) Migrate data from backup to new table
    console.log('Migrating data from backup to new table (mapping columns)...')
    // Use COALESCE-like logic via NVL for Oracle; map available columns where names differ
    const insertCols = `TESTNR, USTER_TESTNR, CATALOG, TIME, SORTIMENT, ARTICLE, MASCHNR, MATCLASS, NOMCOUNT, NOMTWIST, USCODE, LABORANT, COMMENT_, "COMMENT", LOTE, TUNAME, GROUPS, WITHIN, TOTAL, UNSPOOLGROUPS, LENGTH, EXTSPEED, PRETENSION, CLAMPPRESSURE, CYCLEFORCELL, CYCLEFORCEUL, NMBOFFORCECYCLES, CYCLELONGLL, CYCLELONGUL, NMBOFELONGCYCLES, FORCEF1REL, ELONGATIONE1REL, EVALTIMEREL, PRELOADCYCLESREL, FORCEF1RET, ELONGATIONE1RET, EVALTIMERET, PRELOADCYCLESRET, PAR_JSON, CREATED_AT`

    const selectCols = `TESTNR, USTER_TESTNR, CATALOG, TIME, SORTIMENT, ARTICLE, MASCHNR, MATCLASS, NOMCOUNT, NOMTWIST, USCODE, LABORANT, COMMENT_ , COMMENT_, LOTE, TUNAME, GROUPS, WITHIN, TOTAL, UNSPOOLGROUPS, LENGTH, EXTSPEED, PRETENSION, CLAMPPRESSURE, CYCLEFORCELL, CYCLEFORCEUL, NMBOFFORCECYCLES, CYCLELONGLL, CYCLELONGUL, NMBOFELONGCYCLES, FORCEF1REL, ELONGATIONE1REL, EVALTIMEREL, PRELOADCYCLESREL, FORCEF1RET, ELONGATIONE1RET, EVALTIMERET, PRELOADCYCLESRET, PAR_JSON, CREATED_AT`

    // If some columns are missing in backup, Oracle will error. We handle with dynamic check: build select listing only columns that exist.
    // Get list of columns in backup
    res = await conn
      .execute(`SELECT column_name FROM user_tab_columns WHERE table_name = :t`, [
        'TENSORAPID_PAR_BACKUP_' + timestamp.toUpperCase().replace(/[:-]/g, '_')
      ])
      .catch(() => null)

    // Simpler approach: try to run INSERT ... SELECT, and if fails, run a relaxed insert mapping only common columns.
    try {
      await conn.execute(
        `INSERT INTO ${newName} (${insertCols}) SELECT ${selectCols} FROM ${backupName}`
      )
      console.log('Data migrated with full mapping')
    } catch (e) {
      console.log('Full mapping failed, attempting safe partial copy:', e.message)
      // Determine common columns between backup and new table
      const newColsRes = await conn.execute(
        `SELECT column_name FROM user_tab_columns WHERE table_name = :n`,
        [newName]
      )
      const backupColsRes = await conn.execute(
        `SELECT column_name FROM user_tab_columns WHERE table_name = :b`,
        [backupName]
      )
      const newCols = newColsRes.rows.map((r) => r[0])
      const backupCols = backupColsRes.rows.map((r) => r[0])
      const common = newCols.filter((c) => backupCols.includes(c))
      console.log('Common columns to copy:', common.join(', '))
      const colsList = common.join(', ')
      await conn.execute(
        `INSERT INTO ${newName} (${colsList}) SELECT ${colsList} FROM ${backupName}`
      )
      console.log('Data migrated with partial mapping')
    }

    await conn.commit()

    // 7) Verify counts
    res = await conn.execute(`SELECT COUNT(*) FROM ${newName}`)
    const newCount = res.rows && res.rows[0] ? Number(res.rows[0][0]) : 0
    console.log('New table row count:', newCount)

    // 8) Rename original and new tables (rename original to old name)
    console.log('Renaming original table and promoting new table...')
    await conn.execute(`ALTER TABLE TENSORAPID_PAR RENAME TO TENSORAPID_PAR_OLD_${timestamp}`)
    await conn.execute(`ALTER TABLE ${newName} RENAME TO TENSORAPID_PAR`)
    console.log('Rename complete')

    // 9) Recreate foreign keys on child tables
    for (const fk of fks) {
      console.log(
        `Recreating FK ${fk.name} on ${fk.table}(${fk.column}) referencing TENSORAPID_PAR(TESTNR)`
      )
      await conn.execute(
        `ALTER TABLE ${fk.table} ADD CONSTRAINT ${fk.name} FOREIGN KEY (${fk.column}) REFERENCES TENSORAPID_PAR(TESTNR) ON DELETE CASCADE`
      )
    }

    // 10) Create index on USTER_TESTNR if not exists
    console.log('Ensuring index IDX_TENSORAPID_PAR_USTER exists...')
    const idxRes = await conn.execute(
      `SELECT index_name FROM user_indexes WHERE index_name = 'IDX_TENSORAPID_PAR_USTER'`
    )
    if (!idxRes.rows || idxRes.rows.length === 0) {
      await conn.execute(`CREATE INDEX IDX_TENSORAPID_PAR_USTER ON TENSORAPID_PAR(USTER_TESTNR)`)
      console.log('Index created')
    } else {
      console.log('Index already exists, skipping creation')
    }

    await conn.commit()

    // Final validation
    res = await conn.execute(`SELECT COUNT(*) FROM TENSORAPID_PAR`)
    const finalCount = res.rows && res.rows[0] ? Number(res.rows[0][0]) : 0
    console.log('Final TENSORAPID_PAR count:', finalCount)
    console.log('Backup table is', backupName)

    // Show sample rows
    res = await conn.execute(
      `SELECT TESTNR, USTER_TESTNR, PAR_JSON FROM TENSORAPID_PAR WHERE ROWNUM <= 5`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    )
    console.log('Sample rows:', res.rows)

    console.log('\n✅ Recreate operation completed successfully')
  } catch (err) {
    console.error('\n❌ Error during recreate operation:', err)
    try {
      if (conn) await conn.rollback()
    } catch (e) {}
    process.exit(1)
  } finally {
    if (conn)
      try {
        await conn.close()
      } catch (e) {
        console.error('Close error', e)
      }
  }
}

run()
