const oracledb = require('oracledb')

const columns = [
  ['U_PERCENT', 'NUMBER'],
  ['CVM_PERCENT', 'NUMBER'],
  ['INDICE_PERCENT', 'NUMBER'],
  ['CVM_1M_PERCENT', 'NUMBER'],
  ['CVM_3M_PERCENT', 'NUMBER'],
  ['CVM_10M_PERCENT', 'NUMBER'],
  ['TITULO', 'VARCHAR2(400)'],
  ['TITULO_REL_PERC', 'VARCHAR2(200)'],
  ['H', 'NUMBER'],
  ['SH', 'NUMBER'],
  ['SH_1M', 'NUMBER'],
  ['SH_3M', 'NUMBER'],
  ['SH_10M', 'NUMBER'],
  ['DELG_MINUS30_KM', 'NUMBER'],
  ['DELG_MINUS40_KM', 'NUMBER'],
  ['DELG_MINUS50_KM', 'NUMBER'],
  ['DELG_MINUS60_KM', 'NUMBER'],
  ['GRUE_35_KM', 'NUMBER'],
  ['GRUE_50_KM', 'NUMBER'],
  ['GRUE_70_KM', 'NUMBER'],
  ['GRUE_100_KM', 'NUMBER'],
  ['NEPS_140_KM', 'NUMBER'],
  ['NEPS_200_KM', 'NUMBER'],
  ['NEPS_280_KM', 'NUMBER'],
  ['NEPS_400_KM', 'NUMBER']
]

;(async function () {
  try {
    const conn = await oracledb.getConnection({
      user: process.env.ORACLE_USER || 'SYSTEM',
      password: process.env.ORACLE_PASSWORD || 'Alfa1984',
      connectString: process.env.ORACLE_CONNECTIONSTRING || 'localhost:1521/XE'
    })
    for (const [col, type] of columns) {
      const r = await conn.execute(
        `SELECT COUNT(*) FROM user_tab_columns WHERE table_name='USTER_TBL' AND column_name='${col}'`
      )
      const cnt = r.rows[0][0]
      if (cnt === 0) {
        const sql = `ALTER TABLE USTER_TBL ADD (${col} ${type})`
        try {
          await conn.execute(sql, [], { autoCommit: true })
          console.log('Added column', col)
        } catch (e) {
          console.error('Failed to add', col, e)
        }
      } else {
        console.log('Column exists', col)
      }
    }
    await conn.close()
  } catch (e) {
    console.error('error', e)
    process.exitCode = 1
  }
})()
