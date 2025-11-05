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
GET /api/uster/list
Query params: page (default 1), limit (default 50), sortBy (default 'TESTNR'), sortOrder (default 'DESC')
Response: { records: [...], total: N, page: N, limit: N }
*/
app.get('/api/uster/list', async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = Math.min(parseInt(req.query.limit) || 50, 100) // max 100
  const sortBy = req.query.sortBy || 'TESTNR'
  const sortOrder = (req.query.sortOrder || 'DESC').toUpperCase()
  
  // Validate sortBy to prevent SQL injection
  const allowedSortFields = ['TESTNR', 'NOMCOUNT', 'MASCHNR', 'LOTE', 'LABORANT', 'TIME_STAMP', 'CREATED_AT']
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'TESTNR'
  const order = sortOrder === 'ASC' ? 'ASC' : 'DESC'
  
  const offset = (page - 1) * limit
  
  let conn
  try {
    await initPool()
    conn = await getConnection()
    
    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM ${SCHEMA_PREFIX}USTER_PAR`
    const countResult = await conn.execute(countSql)
    const total = countResult.rows[0][0]
    
    // Get paginated records
    const sql = `
      SELECT TESTNR, NOMCOUNT, MASCHNR, LOTE, LABORANT, TIME_STAMP, CREATED_AT
      FROM ${SCHEMA_PREFIX}USTER_PAR
      ORDER BY ${sortField} ${order}
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `
    
    const result = await conn.execute(sql, { offset, limit })
    
    // Convert rows to objects
    const records = result.rows.map(row => ({
      TESTNR: row[0],
      NOMCOUNT: row[1],
      MASCHNR: row[2],
      LOTE: row[3],
      LABORANT: row[4],
      TIME_STAMP: row[5],
      CREATED_AT: row[6]
    }))
    
    res.json({
      records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (err) {
    globalThis.console.error('List USTER records error', err)
    res.status(500).json({ error: 'Failed to fetch records' })
  } finally {
    if (conn) {
      try {
        await conn.close()
      } catch (e) {
        globalThis.console.error('close conn err', e)
      }
    }
  }
})

app.post('/api/uster/status', async (req, res) => {
  const { testnrs } = req.body

  if (!Array.isArray(testnrs) || testnrs.length === 0) {
    return res.status(400).json({ error: 'testnrs must be a non-empty array' })
  }

  let conn
  try {
    await initPool()
    conn = await getConnection()

    // Use a bind variable for each TESTNR to prevent SQL injection
    const binds = testnrs.reduce((acc, val, i) => {
      acc[`tnr${i}`] = val
      return acc
    }, {})
    const bindNames = Object.keys(binds)
      .map((b) => `:${b}`)
      .join(',')

    const sql = `SELECT TESTNR FROM ${SCHEMA_PREFIX}USTER_PAR WHERE TESTNR IN (${bindNames})`
    const result = await conn.execute(sql, binds)

    // Oracle devuelve filas como arrays por defecto. row[0] es la primera columna (TESTNR)
    const existing = result.rows.map((row) => row[0])
    res.json({ existing })
  } catch (err) {
    globalThis.console.error('Status check error', err)
    res.status(500).json({ error: 'Failed to check status' })
  } finally {
    if (conn) {
      try {
        await conn.close()
      } catch (e) {
        globalThis.console.error('close conn err', e)
      }
    }
  }
})

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
/*
DELETE /api/uster/delete
Body: { testnr: '...' }
Deletes all records for a given TESTNR from both USTER_PAR and USTER_TBL tables.
Response: { success: true, message: '...' }
*/
app.delete('/api/uster/delete', async (req, res) => {
  const payload = req.body || {}
  const testnr = payload.testnr

  globalThis.console.log('DELETE /api/uster/delete received - TESTNR:', testnr)

  if (!testnr) return res.status(400).json({ error: 'Missing testnr' })

  // If SKIP_DB is set run in dry mode
  const dryRun =
    (typeof globalThis !== 'undefined' &&
      globalThis.process &&
      globalThis.process.env &&
      globalThis.process.env.SKIP_DB === 'true') ||
    payload.dry === true

  let conn
  let deleteTblSql
  let deleteParSql

  try {
    if (dryRun) {
      return res.json({
        success: true,
        message: `Ensayo ${testnr} eliminado (dry run)`,
        dryRun: true
      })
    }

    await initPool()
    conn = await getConnection()

    // Start transaction
    // Delete from USTER_TBL first (child table)
    deleteTblSql = `DELETE FROM ${SCHEMA_PREFIX}USTER_TBL WHERE TESTNR = :TESTNR`
    globalThis.console.log('Executing DELETE TBL SQL:', deleteTblSql)
    const tblResult = await conn.execute(deleteTblSql, { TESTNR: testnr }, { autoCommit: false })
    globalThis.console.log('TBL rows deleted:', tblResult.rowsAffected)

    // Delete from USTER_PAR (parent table)
    deleteParSql = `DELETE FROM ${SCHEMA_PREFIX}USTER_PAR WHERE TESTNR = :TESTNR`
    globalThis.console.log('Executing DELETE PAR SQL:', deleteParSql)
    const parResult = await conn.execute(deleteParSql, { TESTNR: testnr }, { autoCommit: false })
    globalThis.console.log('PAR rows deleted:', parResult.rowsAffected)

    await conn.commit()
    res.json({
      success: true,
      message: `Ensayo ${testnr} eliminado correctamente`,
      deletedTblRows: tblResult.rowsAffected,
      deletedParRows: parResult.rowsAffected
    })
  } catch (err) {
    globalThis.console.error('Delete error', err)
    try {
      if (conn) await conn.rollback()
    } catch (er2) {
      globalThis.console.error('rollback failed', er2)
    }

    const baseError = String(err && err.message ? err.message : err)
    res.status(500).json({ error: baseError })
  } finally {
    try {
      if (conn) await conn.close()
    } catch (err2) {
      globalThis.console.error('close conn err', err2)
    }
  }
})

/*
POST /api/tensorapid/upload
Request body shape:
{
  par: { TESTNR: '001234', USTER_TESTNR: '005678', CATALOG: '...', ... },
  tbl: [ { TESTNR: '001234', NO: 1, TIEMPO_ROTURA: 1.23, FUERZA_B: 2.34, ELONGACION: 3.45, TENACIDAD: 4.56, TRABAJO: 5.67 }, ... ]
}
Response: { success: true }
*/
app.post('/api/tensorapid/upload', async (req, res) => {
  const payload = req.body || {}
  const par = payload.par || null
  const tbl = Array.isArray(payload.tbl) ? payload.tbl : []

  globalThis.console.log(
    'POST /api/tensorapid/upload received - TESTNR:',
    par && par.TESTNR,
    'USTER_TESTNR:',
    par && par.USTER_TESTNR,
    'tbl.length=',
    tbl.length
  )

  // Additional lightweight diagnostic log: keys and small snippet of par JSON to detect missing fields
  try {
    const parKeys = par && typeof par === 'object' ? Object.keys(par) : []
    let parSnippet = ''
    try {
      parSnippet = par ? JSON.stringify(par).slice(0, 1000) : ''
    } catch (e) {
      parSnippet = '[could not stringify par]'
    }
    globalThis.console.log('POST /api/tensorapid/upload payload summary:', {
      parKeys,
      parSnippet,
      tblLength: tbl.length
    })
  } catch (e) {
    globalThis.console.warn('Failed to log upload payload summary', e)
  }

  if (!par || !par.TESTNR) return res.status(400).json({ error: 'Missing par.TESTNR' })
  if (!par.USTER_TESTNR) return res.status(400).json({ error: 'Missing par.USTER_TESTNR' })

  // If SKIP_DB is set (or payload.dry === true) run in dry mode and don't attempt DB connection.
  const dryRun =
    (typeof globalThis !== 'undefined' &&
      globalThis.process &&
      globalThis.process.env &&
      globalThis.process.env.SKIP_DB === 'true') ||
    payload.dry === true
  let conn
  let mergeSql
  let deleteSql
  let insertSql
  let bindsArray
  let parBinds
  try {
    if (dryRun) {
      return res.json({ success: true, inserted: tbl.length, dryRun: true })
    }
    await initPool()
    conn = await getConnection()

    // Start transaction
    // Upsert into TENSORAPID_PAR using MERGE
    // Use only the exact .PAR fields from the specification
    mergeSql = `MERGE INTO ${SCHEMA_PREFIX}TENSORAPID_PAR t
    USING (SELECT :TESTNR AS TESTNR FROM dual) s
    ON (t.TESTNR = s.TESTNR)
    WHEN MATCHED THEN
      UPDATE SET
        USTER_TESTNR = :USTER_TESTNR,
        CATALOG = :CATALOG,
        TIME = :TIME,
        SORTIMENT = :SORTIMENT,
        ARTICLE = :ARTICLE,
        MASCHNR = :MASCHNR,
        MATCLASS = :MATCLASS,
        NOMCOUNT = :NOMCOUNT,
        NOMTWIST = :NOMTWIST,
        USCODE = :USCODE,
  LABORANT = :LABORANT,
  COMMENT_TEXT = :COMMENT_TEXT,
        LOTE = :LOTE,
        TUNAME = :TUNAME,
        GROUPS = :GROUPS,
        WITHIN = :WITHIN,
        TOTAL = :TOTAL,
        UNSPOOLGROUPS = :UNSPOOLGROUPS,
        LENGTH = :LENGTH,
        EXTSPEED = :EXTSPEED,
        PRETENSION = :PRETENSION,
        CLAMPPRESSURE = :CLAMPPRESSURE,
        CYCLEFORCELL = :CYCLEFORCELL,
        CYCLEFORCEUL = :CYCLEFORCEUL,
        NMBOFFORCECYCLES = :NMBOFFORCECYCLES,
        CYCLELONGLL = :CYCLELONGLL,
        CYCLELONGUL = :CYCLELONGUL,
        NMBOFELONGCYCLES = :NMBOFELONGCYCLES,
        FORCEF1REL = :FORCEF1REL,
        ELONGATIONE1REL = :ELONGATIONE1REL,
        EVALTIMEREL = :EVALTIMEREL,
        PRELOADCYCLESREL = :PRELOADCYCLESREL,
        FORCEF1RET = :FORCEF1RET,
        ELONGATIONE1RET = :ELONGATIONE1RET,
        EVALTIMERET = :EVALTIMERET,
        PRELOADCYCLESRET = :PRELOADCYCLESRET,
        UPDATED_AT = SYSTIMESTAMP
    WHEN NOT MATCHED THEN
      INSERT (TESTNR, USTER_TESTNR, CATALOG, TIME, SORTIMENT, ARTICLE, MASCHNR, MATCLASS, 
              NOMCOUNT, NOMTWIST, USCODE, LABORANT, COMMENT_TEXT, LOTE, TUNAME, GROUPS, WITHIN, 
              TOTAL, UNSPOOLGROUPS, LENGTH, EXTSPEED, PRETENSION, CLAMPPRESSURE, CYCLEFORCELL, 
              CYCLEFORCEUL, NMBOFFORCECYCLES, CYCLELONGLL, CYCLELONGUL, NMBOFELONGCYCLES, 
              FORCEF1REL, ELONGATIONE1REL, EVALTIMEREL, PRELOADCYCLESREL, FORCEF1RET, 
              ELONGATIONE1RET, EVALTIMERET, PRELOADCYCLESRET)
      VALUES (:TESTNR, :USTER_TESTNR, :CATALOG, :TIME, :SORTIMENT, :ARTICLE, :MASCHNR, :MATCLASS, 
              :NOMCOUNT, :NOMTWIST, :USCODE, :LABORANT, :COMMENT_TEXT, :LOTE, :TUNAME, :GROUPS, :WITHIN, 
              :TOTAL, :UNSPOOLGROUPS, :LENGTH, :EXTSPEED, :PRETENSION, :CLAMPPRESSURE, :CYCLEFORCELL, 
              :CYCLEFORCEUL, :NMBOFFORCECYCLES, :CYCLELONGLL, :CYCLELONGUL, :NMBOFELONGCYCLES, 
              :FORCEF1REL, :ELONGATIONE1REL, :EVALTIMEREL, :PRELOADCYCLESREL, :FORCEF1RET, 
              :ELONGATIONE1RET, :EVALTIMERET, :PRELOADCYCLESRET)`

    // Helper function to safely convert to number or null (avoid NaN)
    const safeNumber = (val) => {
      if (val == null || val === '') return null
      const num = Number(val)
      return isNaN(num) ? null : num
    }

    // Map directly to .PAR field names (no aliases or compatibility columns)
    parBinds = {
      TESTNR: par.TESTNR,
      USTER_TESTNR: par.USTER_TESTNR,
      CATALOG: par.CATALOG || null,
      TIME: par.TIME || null,
      SORTIMENT: par.SORTIMENT || null,
      ARTICLE: par.ARTICLE || null,
      MASCHNR: par.MASCHNR || null,
      MATCLASS: par.MATCLASS || null,
      NOMCOUNT: safeNumber(par.NOMCOUNT),
      NOMTWIST: safeNumber(par.NOMTWIST),
      USCODE: par.USCODE || null,
      LABORANT: par.LABORANT || null,
      COMMENT_TEXT: par.COMMENT_TEXT || par.COMMENT || null,
      LOTE: par.LOTE || null,
      TUNAME: par.TUNAME || null,
      GROUPS: safeNumber(par.GROUPS),
      WITHIN: safeNumber(par.WITHIN),
      TOTAL: safeNumber(par.TOTAL),
      UNSPOOLGROUPS: safeNumber(par.UNSPOOLGROUPS),
      LENGTH: safeNumber(par.LENGTH),
      EXTSPEED: safeNumber(par.EXTSPEED),
      PRETENSION: safeNumber(par.PRETENSION),
      CLAMPPRESSURE: safeNumber(par.CLAMPPRESSURE),
      CYCLEFORCELL: safeNumber(par.CYCLEFORCELL),
      CYCLEFORCEUL: safeNumber(par.CYCLEFORCEUL),
      NMBOFFORCECYCLES: safeNumber(par.NMBOFFORCECYCLES),
      CYCLELONGLL: safeNumber(par.CYCLELONGLL),
      CYCLELONGUL: safeNumber(par.CYCLELONGUL),
      NMBOFELONGCYCLES: safeNumber(par.NMBOFELONGCYCLES),
      FORCEF1REL: safeNumber(par.FORCEF1REL),
      ELONGATIONE1REL: safeNumber(par.ELONGATIONE1REL),
      EVALTIMEREL: safeNumber(par.EVALTIMEREL),
      PRELOADCYCLESREL: safeNumber(par.PRELOADCYCLESREL),
      FORCEF1RET: safeNumber(par.FORCEF1RET),
      ELONGATIONE1RET: safeNumber(par.ELONGATIONE1RET),
      EVALTIMERET: safeNumber(par.EVALTIMERET),
      PRELOADCYCLESRET: safeNumber(par.PRELOADCYCLESRET)
    }

    globalThis.console.log('Executing TENSORAPID MERGE SQL for TESTNR:', par.TESTNR)
    await conn.execute(mergeSql, parBinds, { autoCommit: false })

    // Insert TBL rows: delete existing rows for this TESTNR and insert provided rows
    deleteSql = `DELETE FROM ${SCHEMA_PREFIX}TENSORAPID_TBL WHERE TESTNR = :TESTNR`
    await conn.execute(deleteSql, { TESTNR: par.TESTNR }, { autoCommit: false })

    if (tbl.length > 0) {
      insertSql = `INSERT INTO ${SCHEMA_PREFIX}TENSORAPID_TBL (TESTNR, HUSO_ENSAYOS, HUSO_NUMBER, TIEMPO_ROTURA, FUERZA_B, ELONGACION, TENACIDAD, TRABAJO)
                   VALUES (:TESTNR, :HUSO_ENSAYOS, :HUSO_NUMBER, :TIEMPO_ROTURA, :FUERZA_B, :ELONGACION, :TENACIDAD, :TRABAJO)`

      bindsArray = tbl.map((row) => {
        return {
          TESTNR: row.TESTNR || par.TESTNR,
          HUSO_ENSAYOS: row.HUSO_ENSAYOS || row.NE_TITULO || row.NE || null,
          HUSO_NUMBER: safeNumber(row.HUSO_NUMBER || row.NO || row.NO_), // HUSO_NUMBER es el número extraído
          TIEMPO_ROTURA: safeNumber(row.TIEMPO_ROTURA),
          FUERZA_B: safeNumber(row.FUERZA_B),
          ELONGACION: safeNumber(row.ELONGACION),
          TENACIDAD: safeNumber(row.TENACIDAD),
          TRABAJO: safeNumber(row.TRABAJO)
        }
      })

      globalThis.console.log(`Executing TENSORAPID INSERT TBL SQL: ${tbl.length} rows`)
      await conn.executeMany(insertSql, bindsArray, { autoCommit: false })
    }

    await conn.commit()
    res.json({ success: true, inserted: tbl.length })
  } catch (err) {
    globalThis.console.error('TensoRapid upload error', err)
    try {
      if (conn) await conn.rollback()
    } catch (er2) {
      globalThis.console.error('rollback failed', er2)
    }

    const baseError = String(err && err.message ? err.message : err)
    res.status(500).json({ error: baseError })
  } finally {
    try {
      if (conn) await conn.close()
    } catch (err2) {
      globalThis.console.error('close conn err', err2)
    }
  }
})

/*
POST /api/tensorapid/status
Request body shape:
{
  testnrs: ['001234', '001235', ...]
}
Response: { 
  existing: ['001234', ...],
  details: { '001234': { usterTestnr: '05410' }, ... }
}
*/
app.post('/api/tensorapid/status', async (req, res) => {
  const { testnrs } = req.body

  if (!Array.isArray(testnrs) || testnrs.length === 0) {
    return res.status(400).json({ error: 'testnrs must be a non-empty array' })
  }

  let conn
  try {
    await initPool()
    conn = await getConnection()

    const binds = testnrs.reduce((acc, val, i) => {
      acc[`tnr${i}`] = val
      return acc
    }, {})
    const bindNames = Object.keys(binds)
      .map((b) => `:${b}`)
      .join(',')

    const sql = `SELECT TESTNR, USTER_TESTNR FROM ${SCHEMA_PREFIX}TENSORAPID_PAR WHERE TESTNR IN (${bindNames})`
    const result = await conn.execute(sql, binds)

    const existing = []
    const details = {}
    result.rows.forEach((row) => {
      const testnr = row[0]
      const usterTestnr = row[1]
      existing.push(testnr)
      details[testnr] = { usterTestnr: usterTestnr || null }
    })

    res.json({ existing, details })
  } catch (err) {
    globalThis.console.error('TensoRapid status check error', err)
    res.status(500).json({ error: 'Failed to check status' })
  } finally {
    if (conn) {
      try {
        await conn.close()
      } catch (e) {
        globalThis.console.error('close conn err', e)
      }
    }
  }
})

app.listen(PORT, () => globalThis.console.log(`Server listening on ${PORT}`))
