/* eslint-env node */
import oracledb from 'oracledb'

const env = typeof process !== 'undefined' && process.env ? process.env : {}
const config = {
  user: env.ORACLE_USER || 'SYSTEM',
  password: env.ORACLE_PASSWORD || 'Alfa1984',
  connectionString: env.ORACLE_CONNECTIONSTRING || 'localhost:1521/XE'
}

async function run() {
  let conn
  try {
    console.log('Connecting to Oracle...')
    conn = await oracledb.getConnection(config)
    console.log('Connected')

    const res = await conn.execute(
      `SELECT column_name FROM user_tab_columns WHERE table_name = 'TENSORAPID_PAR' AND column_name = 'TIME_STAMP'`
    )

    if (res.rows && res.rows.length > 0) {
      console.log('Column TIME_STAMP already exists; nothing to do')
    } else {
      console.log('Adding column TIME_STAMP to TENSORAPID_PAR...')
      await conn.execute(`ALTER TABLE TENSORAPID_PAR ADD (TIME_STAMP VARCHAR2(100))`)
      console.log('Column TIME_STAMP added')
      await conn.commit()
    }
  } catch (err) {
    console.error('Error adding column:', err)
    process.exit(1)
  } finally {
    if (conn)
      try {
        await conn.close()
      } catch (e) {}
  }
}

run()
