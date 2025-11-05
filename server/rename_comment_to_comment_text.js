import oracledb from 'oracledb'
import dotenv from 'dotenv'
dotenv.config()

// Migration: Add COMMENT_TEXT column and copy data from quoted "COMMENT" if present
// Usage: node server/rename_comment_to_comment_text.js

async function run() {
  const conn = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECTIONSTRING
  })
  try {
    // 1) Add new column COMMENT_TEXT if doesn't exist
    await conn.execute(
      `BEGIN
         EXECUTE IMMEDIATE 'ALTER TABLE ${process.env.SCHEMA_PREFIX || ''}TENSORAPID_PAR ADD (COMMENT_TEXT CLOB)';
       EXCEPTION
         WHEN OTHERS THEN
           IF SQLCODE != -01430 THEN RAISE; END IF; -- ORA-01430: column being added already exists (varies)
       END;`
    )

    // 2) Try to copy data from quoted "COMMENT" column (if exists)
    // Use dynamic SQL to reference quoted identifier safely
    const copySql = `DECLARE
      col_exists NUMBER := 0;
    BEGIN
      SELECT COUNT(*) INTO col_exists FROM all_tab_columns
       WHERE owner = NVL(:schema_owner, USER)
         AND table_name = 'TENSORAPID_PAR'
         AND column_name = 'COMMENT';

      IF col_exists > 0 THEN
        EXECUTE IMMEDIATE 'UPDATE ${process.env.SCHEMA_PREFIX || ''}TENSORAPID_PAR SET COMMENT_TEXT = "COMMENT" WHERE COMMENT_TEXT IS NULL';
      END IF;
    END;`;

    await conn.execute(copySql, [process.env.SCHEMA_PREFIX ? process.env.SCHEMA_PREFIX.replace(/\.$/, '') : null], { autoCommit: true })

    console.log('✓ Migration script executed (columns added/copied where possible). Review results before dropping original column.')
  } catch (err) {
    console.error('Migration failed:', err)
  } finally {
    try { await conn.close() } catch { /* noop */ }
  }
}

run()
