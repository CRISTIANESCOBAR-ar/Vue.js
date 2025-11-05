/* eslint-env node */
/* global require, process, console, Buffer, __dirname */
import oracledb from 'oracledb'

/* eslint-env node */
const env = typeof process !== 'undefined' && process.env ? process.env : {}
const config = {
  user: env.ORACLE_USER || 'SYSTEM',
  password: env.ORACLE_PASSWORD || 'Alfa1984',
  connectionString: env.ORACLE_CONNECTIONSTRING || 'localhost:1521/XE'
}

async function checkAndUpdateTables() {
  let conn
  try {
    console.log('Conectando a Oracle...')
    conn = await oracledb.getConnection(config)
    console.log('✓ Conexión exitosa')

    // Verificar si las tablas existen
    console.log('\n1. Verificando tablas existentes...')
    const checkTables = await conn.execute(
      `SELECT table_name FROM user_tables WHERE table_name IN ('TENSORAPID_PAR', 'TENSORAPID_TBL')`
    )
    const existingTables = checkTables.rows.map((r) => r[0])
    console.log(
      'Tablas encontradas:',
      existingTables.length > 0 ? existingTables.join(', ') : 'Ninguna'
    )

    if (existingTables.length === 0) {
      // Las tablas no existen, crear desde cero
      console.log('\n2. Las tablas no existen. Creando tablas nuevas...')

      // Crear TENSORAPID_PAR
      console.log('   - Creando TENSORAPID_PAR...')
      await conn.execute(`
        CREATE TABLE TENSORAPID_PAR (
          TESTNR VARCHAR2(10) PRIMARY KEY,
          USTER_TESTNR VARCHAR2(10) NOT NULL,
          CATALOG VARCHAR2(50),
          TIME_STAMP VARCHAR2(50),
          ARTIGO VARCHAR2(100),
          LOTE VARCHAR2(100),
          MAQUINA VARCHAR2(50),
          TITULO VARCHAR2(50),
          COMPRIMENTO NUMBER,
          COMPRIMENTO_UN VARCHAR2(20),
          PRE_TENSAO NUMBER,
          VELOCIDADE NUMBER,
          COND_TESTE_1 NUMBER,
          COND_TESTE_2 NUMBER,
          COND_TESTE_3 NUMBER,
          COND_TESTE_4 NUMBER,
          REPET NUMBER,
          PAUSA NUMBER,
          CALIB_ELONG_A NUMBER,
          CALIB_ELONG_B NUMBER,
          CALIB_CARGA_A NUMBER,
          CALIB_CARGA_B NUMBER,
          ESCALA_CARGA NUMBER,
          TEMPO_MAX NUMBER,
          AJUDA_TEN VARCHAR2(50),
          OBSERVACAO VARCHAR2(500),
          MAQUINA_AUX VARCHAR2(50),
          TECNICO VARCHAR2(100),
          N_PROVAS NUMBER,
          PESO_BOB NUMBER,
          TOLERANCIA NUMBER,
          BOBINA_ESP VARCHAR2(50),
          MAT_TIPO VARCHAR2(50),
          MAT_CODIGO VARCHAR2(50),
          LEITURAS VARCHAR2(50),
          TABELA_CONF VARCHAR2(50),
          PAR_JSON CLOB,
          CREATED_AT TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
          CONSTRAINT FK_TENSORAPID_USTER FOREIGN KEY (USTER_TESTNR) REFERENCES USTER_PAR(TESTNR)
        )
      `)
      console.log('   ✓ TENSORAPID_PAR creada')

      // Crear TENSORAPID_TBL
      console.log('   - Creando TENSORAPID_TBL...')
      await conn.execute(`
        CREATE TABLE TENSORAPID_TBL (
          TESTNR VARCHAR2(10) NOT NULL,
          NE_TITULO VARCHAR2(20),
          HUSO_NUMBER NUMBER NOT NULL,
          TIEMPO_ROTURA NUMBER,
          FUERZA_B NUMBER,
          ELONGACION NUMBER,
          TENACIDAD NUMBER,
          TRABAJO NUMBER,
          CREATED_AT TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
          CONSTRAINT PK_TENSORAPID_TBL PRIMARY KEY (TESTNR, HUSO_NUMBER),
          CONSTRAINT FK_TENSORAPID_TBL_PAR FOREIGN KEY (TESTNR) REFERENCES TENSORAPID_PAR(TESTNR) ON DELETE CASCADE
        )
      `)
      console.log('   ✓ TENSORAPID_TBL creada')

      // Crear índices
      console.log('   - Creando índices...')
      await conn.execute(`CREATE INDEX IDX_TENSORAPID_PAR_USTER ON TENSORAPID_PAR(USTER_TESTNR)`)
      await conn.execute(`CREATE INDEX IDX_TENSORAPID_TBL_TESTNR ON TENSORAPID_TBL(TESTNR)`)
      console.log('   ✓ Índices creados')

      // Agregar comentarios
      console.log('   - Agregando comentarios...')
      await conn.execute(
        `COMMENT ON TABLE TENSORAPID_PAR IS 'Datos de parámetros de ensayos TensoRapid vinculados a ensayos USTER'`
      )
      await conn.execute(
        `COMMENT ON TABLE TENSORAPID_TBL IS 'Datos de mediciones individuales de ensayos TensoRapid'`
      )
      await conn.execute(
        `COMMENT ON COLUMN TENSORAPID_PAR.USTER_TESTNR IS 'Referencia al ensayo USTER correspondiente'`
      )
      await conn.execute(
        `COMMENT ON COLUMN TENSORAPID_PAR.CREATED_AT IS 'Fecha y hora de creación del registro'`
      )
      await conn.execute(
        `COMMENT ON COLUMN TENSORAPID_TBL.NE_TITULO IS 'Título del hilo en formato completo (ej: 62/5, 320/5)'`
      )
      await conn.execute(
        `COMMENT ON COLUMN TENSORAPID_TBL.HUSO_NUMBER IS 'Número de huso extraído del título (ej: 62 de "62/5")'`
      )
      await conn.execute(
        `COMMENT ON COLUMN TENSORAPID_PAR.PAR_JSON IS 'JSON completo con todos los campos parseados del archivo .PAR'`
      )
      await conn.execute(
        `COMMENT ON COLUMN TENSORAPID_TBL.CREATED_AT IS 'Fecha y hora de creación del registro'`
      )
      console.log('   ✓ Comentarios agregados')
    } else if (existingTables.length === 2) {
      // Las tablas ya existen, verificar si tienen las columnas nuevas
      console.log('\n2. Las tablas ya existen. Verificando estructura...')

      // Verificar columnas de TENSORAPID_PAR
      const parCols = await conn.execute(
        `SELECT column_name FROM user_tab_columns WHERE table_name = 'TENSORAPID_PAR' AND column_name = 'CREATED_AT'`
      )

      if (parCols.rows.length === 0) {
        console.log('   - Agregando CREATED_AT a TENSORAPID_PAR...')
        await conn.execute(
          `ALTER TABLE TENSORAPID_PAR ADD (CREATED_AT TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL)`
        )
        await conn.execute(
          `COMMENT ON COLUMN TENSORAPID_PAR.CREATED_AT IS 'Fecha y hora de creación del registro'`
        )
        console.log('   ✓ CREATED_AT agregado a TENSORAPID_PAR')
      } else {
        console.log('   ✓ TENSORAPID_PAR ya tiene CREATED_AT')
      }

      // Asegurarse de que PAR_JSON exista
      const parJsonCol = await conn.execute(
        `SELECT column_name FROM user_tab_columns WHERE table_name = 'TENSORAPID_PAR' AND column_name = 'PAR_JSON'`
      )
      if (parJsonCol.rows.length === 0) {
        console.log('   - Agregando PAR_JSON a TENSORAPID_PAR...')
        await conn.execute(`ALTER TABLE TENSORAPID_PAR ADD (PAR_JSON CLOB)`)
        await conn.execute(
          `COMMENT ON COLUMN TENSORAPID_PAR.PAR_JSON IS 'JSON completo con todos los campos parseados del archivo .PAR'`
        )
        console.log('   ✓ PAR_JSON agregado a TENSORAPID_PAR')
      } else {
        console.log('   ✓ TENSORAPID_PAR ya tiene PAR_JSON')
      }

      // Asegurarse de que las columnas con nombres originales del .PAR existan
      const desiredCols = [
        ['TIME', 'VARCHAR2(50)'],
        ['SORTIMENT', 'VARCHAR2(50)'],
        ['ARTICLE', 'VARCHAR2(100)'],
        ['MASCHNR', 'VARCHAR2(50)'],
        ['MATCLASS', 'VARCHAR2(50)'],
        ['NOMCOUNT', 'NUMBER'],
        ['NOMTWIST', 'NUMBER'],
        ['USCODE', 'VARCHAR2(500)'],
        ['LABORANT', 'VARCHAR2(200)'],
        ['COMMENT_', 'VARCHAR2(1000)'],
        ['TUNAME', 'VARCHAR2(100)'],
        ['GROUPS', 'NUMBER'],
        ['WITHIN', 'NUMBER'],
        ['TOTAL', 'NUMBER'],
        ['UNSPOOLGROUPS', 'NUMBER'],
        ['LENGTH', 'NUMBER'],
        ['EXTSPEED', 'NUMBER'],
        ['PRETENSION', 'NUMBER'],
        ['CLAMPPRESSURE', 'NUMBER'],
        ['CYCLEFORCELL', 'NUMBER'],
        ['CYCLEFORCEUL', 'NUMBER'],
        ['NMBOFFORCECYCLES', 'NUMBER'],
        ['CYCLELONGLL', 'NUMBER'],
        ['CYCLELONGUL', 'NUMBER'],
        ['NMBOFELONGCYCLES', 'NUMBER'],
        ['FORCEF1REL', 'NUMBER'],
        ['ELONGATIONE1REL', 'NUMBER'],
        ['EVALTIMEREL', 'NUMBER'],
        ['PRELOADCYCLESREL', 'NUMBER'],
        ['FORCEF1RET', 'NUMBER'],
        ['ELONGATIONE1RET', 'NUMBER'],
        ['EVALTIMERET', 'NUMBER'],
        ['PRELOADCYCLESRET', 'NUMBER']
      ]

      for (const [col, type] of desiredCols) {
        const exists = await conn.execute(
          `SELECT column_name FROM user_tab_columns WHERE table_name = 'TENSORAPID_PAR' AND column_name = :c`,
          [col]
        )
        if (exists.rows.length === 0) {
          console.log(`   - Agregando columna ${col} a TENSORAPID_PAR...`)
          await conn.execute(`ALTER TABLE TENSORAPID_PAR ADD (${col} ${type})`)
          await conn.execute(
            `COMMENT ON COLUMN TENSORAPID_PAR.${col} IS 'Campo importado desde .PAR: ${col.replace(/_$/, ' (originally COMMENT)')}'`
          )
          console.log(`   ✓ ${col} agregado a TENSORAPID_PAR`)
        }
      }

      // Verificar columnas de TENSORAPID_TBL
      const tblCols = await conn.execute(
        `SELECT column_name FROM user_tab_columns WHERE table_name = 'TENSORAPID_TBL' AND column_name IN ('NE_TITULO', 'HUSO_NUMBER', 'CREATED_AT')`
      )
      const tblColNames = tblCols.rows.map((r) => r[0])

      if (!tblColNames.includes('HUSO_NUMBER')) {
        console.log('   - Migrando TENSORAPID_TBL...')

        // Verificar si tiene NO_
        const hasNo = await conn.execute(
          `SELECT column_name FROM user_tab_columns WHERE table_name = 'TENSORAPID_TBL' AND column_name = 'NO_'`
        )

        if (hasNo.rows.length > 0) {
          console.log('     * Eliminando constraint PK...')
          await conn.execute(`ALTER TABLE TENSORAPID_TBL DROP CONSTRAINT PK_TENSORAPID_TBL`)

          console.log('     * Renombrando NO_ a HUSO_NUMBER...')
          await conn.execute(`ALTER TABLE TENSORAPID_TBL RENAME COLUMN NO_ TO HUSO_NUMBER`)

          console.log('     * Recreando PK...')
          await conn.execute(
            `ALTER TABLE TENSORAPID_TBL ADD CONSTRAINT PK_TENSORAPID_TBL PRIMARY KEY (TESTNR, HUSO_NUMBER)`
          )
        }

        if (!tblColNames.includes('NE_TITULO')) {
          console.log('     * Agregando NE_TITULO...')
          await conn.execute(`ALTER TABLE TENSORAPID_TBL ADD (NE_TITULO VARCHAR2(20))`)
          await conn.execute(
            `COMMENT ON COLUMN TENSORAPID_TBL.NE_TITULO IS 'Título del hilo en formato completo (ej: 62/5, 320/5)'`
          )
        }

        if (!tblColNames.includes('CREATED_AT')) {
          console.log('     * Agregando CREATED_AT...')
          await conn.execute(
            `ALTER TABLE TENSORAPID_TBL ADD (CREATED_AT TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL)`
          )
          await conn.execute(
            `COMMENT ON COLUMN TENSORAPID_TBL.CREATED_AT IS 'Fecha y hora de creación del registro'`
          )
        }

        await conn.execute(
          `COMMENT ON COLUMN TENSORAPID_TBL.HUSO_NUMBER IS 'Número de huso extraído del título (ej: 62 de "62/5")'`
        )
        console.log('   ✓ TENSORAPID_TBL migrada exitosamente')
      } else {
        console.log('   ✓ TENSORAPID_TBL ya tiene la estructura actualizada')
      }
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

checkAndUpdateTables()
