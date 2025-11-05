/* eslint-env node */
import oracledb from 'oracledb'

const config = {
  user: process.env.ORACLE_USER || 'SYSTEM',
  password: process.env.ORACLE_PASSWORD || 'Alfa1984',
  connectionString: process.env.ORACLE_CONNECTIONSTRING || 'localhost:1521/XE'
}

async function renameColumn() {
  let conn
  try {
    console.log('Conectando a Oracle...')
    conn = await oracledb.getConnection(config)
    console.log('✓ Conexión exitosa')

    // Verificar si la columna NE_TITULO existe
    console.log('\n1. Verificando columna NE_TITULO...')
    const checkCol = await conn.execute(
      `SELECT column_name FROM user_tab_columns WHERE table_name = 'TENSORAPID_TBL' AND column_name = 'NE_TITULO'`
    )

    if (checkCol.rows.length > 0) {
      console.log('   - Renombrando NE_TITULO a HUSO_ENSAYOS...')
      await conn.execute(`ALTER TABLE TENSORAPID_TBL RENAME COLUMN NE_TITULO TO HUSO_ENSAYOS`)
      await conn.execute(
        `COMMENT ON COLUMN TENSORAPID_TBL.HUSO_ENSAYOS IS 'Número de ensayo / título del hilo (ej: 62/5, 320/5)'`
      )
      console.log('   ✓ Columna renombrada exitosamente')
    } else {
      console.log('   ✓ La columna NE_TITULO no existe (puede que ya se renombró a HUSO_ENSAYOS)')
    }

    await conn.commit()
    console.log('\n✅ Operación completada exitosamente\n')
  } catch (err) {
    console.error('\n❌ Error:', err.message)
    if (conn) {
      try {
        await conn.rollback()
      } catch (e) {
        // ignore
      }
    }
    process.exit(1)
  } finally {
    if (conn) {
      try {
        await conn.close()
      } catch (err) {
        console.error('Error al cerrar conexión:', err.message)
      }
    }
  }
}

renameColumn()
