import oracledb from 'oracledb'

const config = {
  user: 'SYSTEM',
  password: 'Alfa1984',
  connectionString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=XE)))'
}

async function checkCounts() {
  let connection

  try {
    console.log('🔌 Connecting to Oracle...\n')
    connection = await oracledb.getConnection(config)

    const queries = [
      { name: 'USTER_PAR', sql: 'SELECT COUNT(*) as cnt FROM USTER_PAR' },
      { name: 'USTER_TBL', sql: 'SELECT COUNT(*) as cnt FROM USTER_TBL' },
      { name: 'TENSORAPID_PAR', sql: 'SELECT COUNT(*) as cnt FROM TENSORAPID_PAR' },
      { name: 'TENSORAPID_TBL', sql: 'SELECT COUNT(*) as cnt FROM TENSORAPID_TBL' },
      { name: 'Latest USTER', sql: "SELECT MAX(TIME_STAMP) as latest FROM USTER_PAR" },
      { name: 'Latest TENSOR', sql: "SELECT MAX(TIME_STAMP) as latest FROM TENSORAPID_PAR" }
    ]

    for (const query of queries) {
      const result = await connection.execute(query.sql)
      console.log(`${query.name}:`, result.rows[0])
    }

  } catch (err) {
    console.error('❌ Error:', err)
  } finally {
    if (connection) {
      await connection.close()
    }
  }
}

checkCounts()
