import oracledb from 'oracledb'
import dotenv from 'dotenv'

dotenv.config()

async function checkLatest() {
  let connection
  
  try {
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECTIONSTRING
    })

    console.log('🔍 Verificando últimos registros en Oracle...\n')

    // Consultar los últimos 15 registros ordenados por TESTNR descendente
    const result = await connection.execute(
      `SELECT TESTNR, TIME_STAMP, MASCHNR, NOMCOUNT, MATCLASS 
       FROM ${process.env.SCHEMA_PREFIX}USTER_PAR 
       ORDER BY TESTNR DESC 
       FETCH FIRST 15 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    )

    console.log('📊 Últimos 15 registros en USTER_PAR:')
    console.log('TESTNR\tTIME_STAMP\t\tMASCHNR\tNOMCOUNT\tMATCLASS')
    console.log(''.padEnd(80, '-'))

    result.rows.forEach(row => {
      const timestamp = row.TIME_STAMP ? new Date(row.TIME_STAMP).toLocaleString('es-AR') : 'N/A'
      console.log(`${row.TESTNR}\t${timestamp}\t${row.MASCHNR || 'N/A'}\t${row.NOMCOUNT || 'N/A'}\t${row.MATCLASS || 'N/A'}`)
    })

    // Contar total
    const countResult = await connection.execute(
      `SELECT COUNT(*) as total FROM ${process.env.SCHEMA_PREFIX}USTER_PAR`
    )
    
    console.log(`\n📊 Total de registros en Oracle: ${countResult.rows[0][0]}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    if (connection) {
      await connection.close()
    }
  }
}

checkLatest()
