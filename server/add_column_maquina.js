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
    conn = await oracledb.getConnection(config)
    console.log('Connected')
    const col = 'MAQUINA'
    const res = await conn.execute(
      `SELECT column_name FROM user_tab_columns WHERE table_name = 'TENSORAPID_PAR' AND column_name = :c`,
      [col]
    )
    if (res.rows && res.rows.length > 0) {
      console.log('MAQUINA already exists')
    } else {
      console.log('Adding MAQUINA...')
      await conn.execute(`ALTER TABLE TENSORAPID_PAR ADD (MAQUINA VARCHAR2(200))`)
      await conn.commit()
      console.log('MAQUINA added')
    }
  } catch (err) {
    console.error('Error', err)
    process.exit(1)
  } finally {
    if (conn)
      try {
        await conn.close()
      } catch (e) {}
  }
}

run()
