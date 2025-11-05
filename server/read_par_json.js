/* eslint-env node */
const oracledb = require('oracledb')

async function run() {
  const user = process.env.ORACLE_USER || 'SYSTEM'
  const password = process.env.ORACLE_PASSWORD || 'Alfa1984'
  const connectString = process.env.ORACLE_CONNECTIONSTRING || 'localhost:1521/XE'
  const testnr = '1705'

  let conn
  try {
    conn = await oracledb.getConnection({ user, password, connectString })
    const result = await conn.execute(
      `SELECT PAR_JSON FROM TENSORAPID_PAR WHERE TESTNR = :t`,
      [testnr],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    )

    if (!result.rows || result.rows.length === 0) {
      console.log('No row found for TESTNR', testnr)
      return
    }

    const lob = result.rows[0].PAR_JSON
    if (!lob) {
      console.log('PAR_JSON is null for', testnr)
      return
    }

    // LOB is a stream - read it
    if (lob.type === oracledb.CLOB || lob instanceof require('stream').Readable) {
      let data = ''
      lob.setEncoding('utf8')
      lob.on('data', (chunk) => {
        data += chunk
      })
      lob.on('end', async () => {
        console.log('PAR_JSON content:')
        try {
          const parsed = JSON.parse(data)
          console.log(JSON.stringify(parsed, null, 2))
        } catch (e) {
          console.log(data)
        }
        try {
          await conn.close()
        } catch (e) {}
      })
      lob.on('error', async (err) => {
        console.error('LOB error', err)
        try {
          await conn.close()
        } catch (e) {}
      })
    } else {
      // Some drivers may return the LOB value directly
      console.log('PAR_JSON (direct):')
      console.log(lob)
    }
  } catch (err) {
    console.error('Error reading PAR_JSON', err)
    if (conn)
      try {
        await conn.close()
      } catch (e) {}
  }
}

run()
