/* eslint-env node */
/* global require, process, console, Buffer, __dirname */
const oracledb = require('oracledb')

async function run() {
  const user = process.env.ORACLE_USER || 'SYSTEM'
  const password = process.env.ORACLE_PASSWORD || 'Alfa1984'
  const connectString = process.env.ORACLE_CONNECTIONSTRING || 'localhost:1521/XE'

  let conn
  try {
    console.log('Connecting to Oracle with', user, connectString)
    conn = await oracledb.getConnection({ user, password, connectString })

    const testnr = '999999'

    let result = await conn.execute(`DELETE FROM TENSORAPID_TBL WHERE TESTNR = :t`, [testnr], {
      autoCommit: false
    })
    console.log('Deleted from TBL, rowsAffected =', result.rowsAffected)

    result = await conn.execute(`DELETE FROM TENSORAPID_PAR WHERE TESTNR = :t`, [testnr], {
      autoCommit: false
    })
    console.log('Deleted from PAR, rowsAffected =', result.rowsAffected)

    await conn.commit()
    console.log('Commit done')

    // verify
    const r1 = await conn.execute(
      `SELECT COUNT(*) as CNT FROM TENSORAPID_PAR WHERE TESTNR = :t`,
      [testnr],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    )
    const r2 = await conn.execute(
      `SELECT COUNT(*) as CNT FROM TENSORAPID_TBL WHERE TESTNR = :t`,
      [testnr],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    )
    console.log('PAR count after delete:', r1.rows[0].CNT)
    console.log('TBL count after delete:', r2.rows[0].CNT)
  } catch (err) {
    console.error('Delete error', err)
    try {
      if (conn) await conn.rollback()
    } catch (e) {
      console.error('Rollback failed', e)
    }
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
