/* eslint-env node */
import oracledb from 'oracledb'

const env = typeof process !== 'undefined' && process.env ? process.env : {}
const config = {
  user: env.ORACLE_USER || 'SYSTEM',
  password: env.ORACLE_PASSWORD || 'Alfa1984',
  connectionString: env.ORACLE_CONNECTIONSTRING || 'localhost:1521/XE'
}

const desired = [
  ['ARTIGO', 'VARCHAR2(200)'],
  ['LENGTH', 'NUMBER'],
  ['PRETENSION', 'NUMBER'],
  ['EXTSPEED', 'NUMBER'],
  ['TIME', 'VARCHAR2(100)'],
  ['SORTIMENT', 'VARCHAR2(200)'],
  ['ARTICLE', 'VARCHAR2(200)'],
  ['MASCHNR', 'VARCHAR2(200)'],
  ['MATCLASS', 'VARCHAR2(200)'],
  ['NOMCOUNT', 'NUMBER'],
  ['NOMTWIST', 'NUMBER'],
  ['USCODE', 'VARCHAR2(500)'],
  ['LABORANT', 'VARCHAR2(200)'],
  ['COMMENT_', 'VARCHAR2(2000)'],
  ['TUNAME', 'VARCHAR2(200)'],
  ['GROUPS', 'NUMBER'],
  ['WITHIN', 'NUMBER'],
  ['TOTAL', 'NUMBER'],
  ['UNSPOOLGROUPS', 'NUMBER'],
  ['CLAMPPRESSURE', 'NUMBER']
]

async function run() {
  let conn
  try {
    console.log('Connecting to Oracle...')
    conn = await oracledb.getConnection(config)
    console.log('Connected')

    for (const [col, type] of desired) {
      const res = await conn.execute(
        `SELECT column_name FROM user_tab_columns WHERE table_name = 'TENSORAPID_PAR' AND column_name = :c`,
        [col]
      )
      if (res.rows && res.rows.length > 0) {
        console.log(`✓ ${col} already exists`)
      } else {
        console.log(`- Adding ${col} ${type} ...`)
        await conn.execute(`ALTER TABLE TENSORAPID_PAR ADD (${col} ${type})`)
        console.log(`✓ ${col} added`)
      }
    }
    await conn.commit()
    console.log('\nDone')
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  } finally {
    if (conn)
      try {
        await conn.close()
      } catch (e) {}
  }
}

run()
