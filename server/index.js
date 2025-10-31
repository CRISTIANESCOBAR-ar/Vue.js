/* eslint-env node */
import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'
import { getConnection, initPool } from './db.js'

const app = express()
// Build SCHEMA_PREFIX robustly: accept env var with or without trailing dot
const SCHEMA_PREFIX = (() => {
  try {
    const env =
      typeof globalThis !== 'undefined' && globalThis.process && globalThis.process.env
        ? globalThis.process.env.SCHEMA_PREFIX
        : undefined
    if (!env) return ''
    const trimmed = String(env).trim()
    if (trimmed === '') return ''
    // Remove any trailing dots the user may have added, then append one
    return trimmed.replace(/\.+$/u, '') + '.'
  } catch {
    return ''
  }
})()
// Allow CORS from local dev origin (enable credentials). In production restrict this appropriately.
const corsOptions = {
  /*   origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173', */
  origin: /^http:\/\/localhost:\d+$/,

  credentials: true
}
app.use(cors(corsOptions))
// respond to preflight requests (reflect headers automatically)
app.options('*', cors(corsOptions))
app.use(express.json({ limit: '5mb' }))

const PORT =
  typeof globalThis !== 'undefined' &&
  globalThis.process &&
  globalThis.process.env &&
  globalThis.process.env.PORT
    ? globalThis.process.env.PORT
    : 3001

// Simple health
app.get('/api/health', (req, res) => res.json({ ok: true }))

/*
Request body shape:
{
  par: { TESTNR: '001234', CATALOG: '...', ... },
  tbl: [ { SEQNO: 1, NO: 1, TIEMPO_ROTURA: 1.23, FUERZA_B: 2.34, ELONGACION: 3.45, TENACIDAD: 4.56, TRABAJO: 5.67 }, ... ]
}








Response: { success: true }
*/
app.post('/api/uster/upload', async (req, res) => {
  const payload = req.body || {}
  const par = payload.par || null
  const tbl = Array.isArray(payload.tbl) ? payload.tbl : []

  globalThis.console.log(
    'POST /api/uster/upload received - TESTNR:',
    par && par.TESTNR,
    'tbl.length=',
    tbl.length
  )

  if (!par || !par.TESTNR) return res.status(400).json({ error: 'Missing par.TESTNR' })

  // If SKIP_DB is set (or payload.dry === true) run in dry mode and don't attempt DB connection.
  const dryRun =
    (typeof globalThis !== 'undefined' &&
      globalThis.process &&
      globalThis.process.env &&
      globalThis.process.env.SKIP_DB === 'true') ||
    payload.dry === true
  let conn
  // Vars captured for diagnostics / optional inclusion in error responses
  let mergeSql
  let deleteSql
  let insertSql
  let bindsArray
  let parBinds
  try {
    if (dryRun) {
      // Return a simulated success (useful for testing without Oracle Instant Client)
      return res.json({ success: true, inserted: tbl.length, dryRun: true })
    }
    await initPool()
    conn = await getConnection()
    // Diagnostic queries: log DB session user and current schema to debug ORA-00942
    try {
      const userRes = await conn.execute(`SELECT user FROM dual`)
      globalThis.console.log(
        'DB session user:',
        userRes && userRes.rows && userRes.rows[0] && userRes.rows[0][0]
      )
      const curSchemaRes = await conn.execute(
        `SELECT sys_context('USERENV','CURRENT_SCHEMA') FROM dual`
      )
      globalThis.console.log(
        'DB session current_schema:',
        curSchemaRes && curSchemaRes.rows && curSchemaRes.rows[0] && curSchemaRes.rows[0][0]
      )
      const ownerRes = await conn.execute(
        `SELECT owner FROM all_tables WHERE table_name = 'USTER_PAR'`
      )
      globalThis.console.log(
        'All_tables owner for USTER_PAR:',
        ownerRes && ownerRes.rows && ownerRes.rows.map((r) => r[0]).join(', ')
      )
    } catch (diagErr) {
      globalThis.console.warn(
        'Diagnostic queries failed:',
        String(diagErr && diagErr.message ? diagErr.message : diagErr)
      )
    }
    // Start transaction
    // Upsert into Uster_PAR using MERGE
    mergeSql = `MERGE INTO ${SCHEMA_PREFIX}USTER_PAR t
    USING (SELECT :TESTNR AS TESTNR FROM dual) s
    ON (t.TESTNR = s.TESTNR)
    WHEN MATCHED THEN
      UPDATE SET
        CATALOG = :CATALOG,
        TIME_STAMP = :TIME_STAMP,
        LOTE = :LOTE,
        SORTIMENT = :SORTIMENT,
        ARTICLE = :ARTICLE,
        MASCHNR = :MASCHNR,
        MATCLASS = :MATCLASS,
        NOMCOUNT = :NOMCOUNT,
        NOMTWIST = :NOMTWIST,
        USCODE = :USCODE,
        FB_MIC = :FB_MIC,
        FB_TIPO = :FB_TIPO,
        FB_LONG = :FB_LONG,
        FB_PORC = :FB_PORC,
        LABORANT = :LABORANT,
        OBS = :OBS,
        TUNAME = :TUNAME,
        GROUPS = :GROUPS,
        WITHIN = :WITHIN,
        TOTAL = :TOTAL,
        SPEED = :SPEED,
        TESTTIME = :TESTTIME,
        SLOT = :SLOT,
        ABSORBERPRESSURE = :ABSORBERPRESSURE
    WHEN NOT MATCHED THEN
  INSERT (TESTNR, CATALOG, TIME_STAMP, LOTE, SORTIMENT, ARTICLE, MASCHNR, MATCLASS, NOMCOUNT, NOMTWIST, USCODE, FB_MIC, FB_TIPO, FB_LONG, FB_PORC, LABORANT, OBS, TUNAME, GROUPS, WITHIN, TOTAL, SPEED, TESTTIME, SLOT, ABSORBERPRESSURE)
  VALUES (:TESTNR, :CATALOG, :TIME_STAMP, :LOTE, :SORTIMENT, :ARTICLE, :MASCHNR, :MATCLASS, :NOMCOUNT, :NOMTWIST, :USCODE, :FB_MIC, :FB_TIPO, :FB_LONG, :FB_PORC, :LABORANT, :OBS, :TUNAME, :GROUPS, :WITHIN, :TOTAL, :SPEED, :TESTTIME, :SLOT, :ABSORBERPRESSURE)`

    parBinds = {
      TESTNR: par.TESTNR,
      CATALOG: par.CATALOG || null,
      TIME_STAMP: par.TIME || par.TIME_STAMP || null,
      LOTE: par.LOTE || null,
      SORTIMENT: par.SORTIMENT || null,
      ARTICLE: par.ARTICLE || null,
      MASCHNR: par.MASCHNR || null,
      MATCLASS: par.MATCLASS || null,
      NOMCOUNT: par.NOMCOUNT != null ? Number(par.NOMCOUNT) : null,
      NOMTWIST: par.NOMTWIST || null,
      USCODE: par.USCODE || null,
      FB_MIC: par.FB_MIC || null,
      FB_TIPO: par.FB_TIPO || null,
      FB_LONG: par.FB_LONG || null,
      FB_PORC: par.FB_PORC != null ? Number(par.FB_PORC) : null,
      LABORANT: par.LABORANT || null,
      OBS: par.OBS || null,
      TUNAME: par.TUNAME || null,
      GROUPS: par.GROUPS || null,
      WITHIN: par.WITHIN || null,
      TOTAL: par.TOTAL != null ? Number(par.TOTAL) : null,
      SPEED: par.SPEED || null,
      TESTTIME: par.TESTTIME || null,
      SLOT: par.SLOT || null,
      ABSORBERPRESSURE: par.ABSORBERPRESSURE || null
    }

    globalThis.console.log('Executing MERGE SQL:', mergeSql)
    await conn.execute(mergeSql, parBinds, { autoCommit: false })

    // Insert TBL rows: delete existing rows for this TESTNR and insert provided rows
    // We choose to remove previous TBL rows for the TESTNR to keep data consistent
    deleteSql = `DELETE FROM ${SCHEMA_PREFIX}USTER_TBL WHERE TESTNR = :TESTNR`
    await conn.execute(deleteSql, { TESTNR: par.TESTNR }, { autoCommit: false })

    if (tbl.length > 0) {
      // Map frontend TBL column names to actual DB column names for USTER_TBL.
      // We intentionally omit the older per-row force/elongation/tenacidad/trabajo columns
      // which are not required in the target table.
      const insertCols = [
        'TESTNR',
        'SEQNO',
        'NO_',
        'U_PERCENT',
        'CVM_PERCENT',
        'INDICE_PERCENT',
        'CVM_1M_PERCENT',
        'CVM_3M_PERCENT',
        'CVM_10M_PERCENT',
        'TITULO',
        'TITULO_REL_PERC',
        'H',
        'SH',
        'SH_1M',
        'SH_3M',
        'SH_10M',
        'DELG_MINUS30_KM',
        'DELG_MINUS40_KM',
        'DELG_MINUS50_KM',
        'DELG_MINUS60_KM',
        'GRUE_35_KM',
        'GRUE_50_KM',
        'GRUE_70_KM',
        'GRUE_100_KM',
        'NEPS_140_KM',
        'NEPS_200_KM',
        'NEPS_280_KM',
        'NEPS_400_KM'
      ]

      insertSql = `INSERT INTO ${SCHEMA_PREFIX}USTER_TBL (${insertCols.join(',')}) VALUES (${insertCols.map((c) => ':' + c).join(',')})`

      bindsArray = tbl.map((r, idx) => ({
        TESTNR: par.TESTNR,
        SEQNO: r.SEQNO != null ? Number(r.SEQNO) : idx + 1,
        NO_: r.NO != null ? Number(r.NO) : null,
        U_PERCENT: r['U%_%'] != null ? Number(r['U%_%']) : null,
        CVM_PERCENT: r['CVM_%'] != null ? Number(r['CVM_%']) : null,
        INDICE_PERCENT: r['INDICE_%'] != null ? Number(r['INDICE_%']) : null,
        CVM_1M_PERCENT: r['CVM_1M_%'] != null ? Number(r['CVM_1M_%']) : null,
        CVM_3M_PERCENT: r['CVM_3M_%'] != null ? Number(r['CVM_3M_%']) : null,
        CVM_10M_PERCENT: r['CVM_10M_%'] != null ? Number(r['CVM_10M_%']) : null,
        TITULO: r['TITULO'] || null,
        // some files might use slightly different header name for titulo relative percent
        TITULO_REL_PERC: r['TITULO_REL_±_%'] || r['TITULO_REL_%'] || null,
        H: r['H'] != null ? Number(r['H']) : null,
        SH: r['SH'] != null ? Number(r['SH']) : null,
        SH_1M: r['SH_1M'] != null ? Number(r['SH_1M']) : null,
        SH_3M: r['SH_3M'] != null ? Number(r['SH_3M']) : null,
        SH_10M: r['SH_10M'] != null ? Number(r['SH_10M']) : null,
        DELG_MINUS30_KM: r['DELG_-30%_KM'] != null ? Number(r['DELG_-30%_KM']) : null,
        DELG_MINUS40_KM: r['DELG_-40%_KM'] != null ? Number(r['DELG_-40%_KM']) : null,
        DELG_MINUS50_KM: r['DELG_-50%_KM'] != null ? Number(r['DELG_-50%_KM']) : null,
        DELG_MINUS60_KM: r['DELG_-60%_KM'] != null ? Number(r['DELG_-60%_KM']) : null,
        GRUE_35_KM: r['GRUE_35%_KM'] != null ? Number(r['GRUE_35%_KM']) : null,
        GRUE_50_KM: r['GRUE_50%_KM'] != null ? Number(r['GRUE_50%_KM']) : null,
        GRUE_70_KM: r['GRUE_70%_KM'] != null ? Number(r['GRUE_70%_KM']) : null,
        GRUE_100_KM: r['GRUE_100%_KM'] != null ? Number(r['GRUE_100%_KM']) : null,
        NEPS_140_KM: r['NEPS_140%_KM'] != null ? Number(r['NEPS_140%_KM']) : null,
        NEPS_200_KM: r['NEPS_200%_KM'] != null ? Number(r['NEPS_200%_KM']) : null,
        NEPS_280_KM: r['NEPS_280%_KM'] != null ? Number(r['NEPS_280%_KM']) : null,
        NEPS_400_KM: r['NEPS_400%_KM'] != null ? Number(r['NEPS_400%_KM']) : null
      }))

      globalThis.console.log('Executing INSERT SQL:', insertSql)
      globalThis.console.log('First insert bind example:', bindsArray && bindsArray[0])
      await conn.executeMany(insertSql, bindsArray, { autoCommit: false })
    }

    await conn.commit()
    res.json({ success: true, inserted: tbl.length })
  } catch (err) {
    globalThis.console.error('Upload error', err)
    try {
      if (conn) await conn.rollback()
    } catch (er2) {
      globalThis.console.error('rollback failed', er2)
    }

    // Optionally include the SQL we attempted in the error response to help debugging.
    const showSql =
      typeof globalThis !== 'undefined' &&
      globalThis.process &&
      globalThis.process.env &&
      globalThis.process.env.SHOW_SQL_IN_RESPONSE === 'true'

    const baseError = String(err && err.message ? err.message : err)
    if (showSql) {
      return res.status(500).json({
        error: baseError,
        mergeSql,
        deleteSql,
        insertSql,
        firstInsertBind: bindsArray && bindsArray[0]
      })
    }

    res.status(500).json({ error: baseError })
  } finally {
    try {
      if (conn) await conn.close()
    } catch (err2) {
      globalThis.console.error('close conn err', err2)
    }
  }
})

app.listen(PORT, () => globalThis.console.log(`Server listening on ${PORT}`))
