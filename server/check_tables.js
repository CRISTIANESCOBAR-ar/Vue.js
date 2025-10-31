const oracledb = require('oracledb')

;(async function () {
  try {
    const conn = await oracledb.getConnection({
      user: process.env.ORACLE_USER || 'SYSTEM',
      password: process.env.ORACLE_PASSWORD || 'Alfa1984',
      connectString: process.env.ORACLE_CONNECTIONSTRING || 'localhost:1521/XE'
    })
    const res = await conn.execute(
      "SELECT table_name FROM user_tables WHERE table_name IN ('USTER_PAR','USTER_TBL','TENSORAPID')"
    )
    console.log(
      'tables:',
      res.rows.map((r) => r[0])
    )
    const cols = await conn.execute(
      "SELECT column_name FROM user_tab_columns WHERE table_name='USTER_TBL' ORDER BY column_id"
    )
    console.log('USTER_TBL columns count:', cols.rows.length)
    console.log(
      'first 40 columns:',
      cols.rows.slice(0, 40).map((r) => r[0])
    )
    await conn.close()
  } catch (e) {
    console.error('check failed', e)
    process.exitCode = 1
  }
})()
