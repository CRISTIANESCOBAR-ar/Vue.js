/* eslint-env node */
import oracledb from 'oracledb'

const env = typeof process !== 'undefined' && process.env ? process.env : {}
const config = {
  user: env.ORACLE_USER || 'SYSTEM',
  password: env.ORACLE_PASSWORD || 'Alfa1984',
  connectionString: env.ORACLE_CONNECTIONSTRING || 'localhost:1521/XE'
}

const cols = [
  ['TIME_STAMP', 'VARCHAR2(100)'],
  ['USTER_TESTNR', 'VARCHAR2(50)'],
  ['CATALOG', 'VARCHAR2(200)'],
  ['TIME', 'VARCHAR2(100)'],
  ['SORTIMENT', 'VARCHAR2(200)'],
  ['ARTICLE', 'VARCHAR2(200)'],
  ['ARTIGO', 'VARCHAR2(200)'],
  ['LOTE', 'VARCHAR2(200)'],
  ['MAQUINA', 'VARCHAR2(200)'],
  ['TITULO', 'VARCHAR2(200)'],
  ['COMPRIMENTO', 'NUMBER'],
  ['COMPRIMENTO_UN', 'VARCHAR2(50)'],
  ['PRE_TENSAO', 'NUMBER'],
  ['VELOCIDADE', 'NUMBER'],
  ['COND_TESTE_1', 'NUMBER'],
  ['COND_TESTE_2', 'NUMBER'],
  ['COND_TESTE_3', 'NUMBER'],
  ['COND_TESTE_4', 'NUMBER'],
  ['REPET', 'NUMBER'],
  ['PAUSA', 'NUMBER'],
  ['CALIB_ELONG_A', 'NUMBER'],
  ['CALIB_ELONG_B', 'NUMBER'],
  ['CALIB_CARGA_A', 'NUMBER'],
  ['CALIB_CARGA_B', 'NUMBER'],
  ['ESCALA_CARGA', 'NUMBER'],
  ['TEMPO_MAX', 'NUMBER'],
  ['AJUDA_TEN', 'VARCHAR2(100)'],
  ['OBSERVACAO', 'VARCHAR2(1000)'],
  ['MAQUINA_AUX', 'VARCHAR2(100)'],
  ['TECNICO', 'VARCHAR2(200)'],
  ['N_PROVAS', 'NUMBER'],
  ['PESO_BOB', 'NUMBER'],
  ['TOLERANCIA', 'NUMBER'],
  ['BOBINA_ESP', 'VARCHAR2(100)'],
  ['MAT_TIPO', 'VARCHAR2(100)'],
  ['MAT_CODIGO', 'VARCHAR2(100)'],
  ['LEITURAS', 'VARCHAR2(100)'],
  ['TABELA_CONF', 'VARCHAR2(100)'],
  ['PAR_JSON', 'CLOB'],
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

async function run() {
  let conn
  try {
    conn = await oracledb.getConnection(config)
    console.log('Connected to Oracle')
    for (const [col, type] of cols) {
      const res = await conn.execute(
        `SELECT column_name FROM user_tab_columns WHERE table_name = 'TENSORAPID_PAR' AND column_name = :c`,
        [col]
      )
      if (res.rows && res.rows.length > 0) {
        console.log(`✓ ${col} exists`)
      } else {
        console.log(`Adding ${col} ${type}...`)
        await conn.execute(`ALTER TABLE TENSORAPID_PAR ADD (${col} ${type})`)
        console.log(`✓ ${col} added`)
      }
    }
    await conn.commit()
    console.log('All done')
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
