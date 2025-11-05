/* eslint-env node */
import oracledb from 'oracledb'

const config = {
  user: process.env.ORACLE_USER || 'SYSTEM',
  password: process.env.ORACLE_PASSWORD || 'Alfa1984',
  connectionString: process.env.ORACLE_CONNECTIONSTRING || 'localhost:1521/XE'
}

async function checkColumns() {
  let conn
  try {
    conn = await oracledb.getConnection(config)
    const result = await conn.execute(
      `SELECT column_name, data_type FROM user_tab_columns WHERE table_name = 'TENSORAPID_TBL' ORDER BY column_id`
    )
    console.log('\nColumnas en TENSORAPID_TBL:')
    result.rows.forEach((row) => {
      console.log(`  - ${row[0]} (${row[1]})`)
    })
    await conn.close()
  } catch (err) {
    console.error('Error:', err.message)
    if (conn) await conn.close()
  }
}

checkColumns()
