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

    const testnr = '1705'
    let result

    result = await conn.execute(`SELECT * FROM TENSORAPID_PAR WHERE TESTNR = :t`, [testnr], {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    })
    console.log('\nTENSORAPID_PAR rows:')
    console.log(result.rows)

    result = await conn.execute(
      `SELECT * FROM TENSORAPID_TBL WHERE TESTNR = :t ORDER BY HUSO_NUMBER`,
      [testnr],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    )
    console.log('\nTENSORAPID_TBL rows:')
    console.log(result.rows)
  } catch (err) {
    console.error('Query error', err)
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
