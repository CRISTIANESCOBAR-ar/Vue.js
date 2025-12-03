/* eslint-env node */
import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'
import { getConnection, initPool } from './db.js'
import oracledb from 'oracledb'

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

// POST /api/uster/husos
// Returns the list of HUSO numbers (NO column) for a specific USTER test
app.post('/api/uster/husos', async (req, res) => {
  const { testnr } = req.body

  if (!testnr) {
    return res.status(400).json({ error: 'testnr is required' })
  }

  let conn
  try {
    await initPool()
    conn = await getConnection()

    // Query to get all NO (Huso) values for the specified TESTNR
    const sql = `SELECT NO FROM ${SCHEMA_PREFIX}USTER_TBL WHERE TESTNR = :testnr ORDER BY SEQNO`
    const result = await conn.execute(sql, { testnr }, { outFormat: oracledb.OUT_FORMAT_OBJECT })

    // Extract NO values (Huso numbers)
    const husos = (result.rows || []).map(row => row.NO).filter(h => h != null && h !== '')
    
    res.json({ husos })
  } catch (err) {
    globalThis.console.error('Husos check error', err)
    res.status(500).json({ error: 'Failed to get Husos' })
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

// GET /api/uster/list
// Returns a list of recent USTER_PAR rows with a subset of columns used by the UI
app.get('/api/uster/list', async (req, res) => {
  let conn
  try {
    await initPool()
    conn = await getConnection()

    // Safer approach: fetch parent rows, then fetch child TITULO rows and compute AVG_TITULO in JS
    const sqlPar = `SELECT TESTNR, NOMCOUNT, MASCHNR, LOTE, LABORANT, TIME_STAMP
      FROM ${SCHEMA_PREFIX}USTER_PAR
      ORDER BY TESTNR DESC
      FETCH FIRST 200 ROWS ONLY`

    const resultPar = await conn.execute(sqlPar, [], { outFormat: oracledb.OUT_FORMAT_OBJECT })
    const parRows = resultPar.rows || []

    // Collect TESTNRs to fetch child TITULO rows
    const testnrs = parRows.map((r) => r.TESTNR).filter(Boolean)
    let tituloRows = []
    if (testnrs.length > 0) {
      const binds = {}
      const placeholders = testnrs
        .map((t, i) => {
          const name = `:tn${i}`
          binds[`tn${i}`] = t
          return name
        })
        .join(',')

      const sqlTit = `SELECT TESTNR, TITULO FROM ${SCHEMA_PREFIX}USTER_TBL WHERE TESTNR IN (${placeholders})`
      const resTit = await conn.execute(sqlTit, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT })
      tituloRows = resTit.rows || []
    }

    // Helper: normalize and parse TITULO to Number (returns null if cannot parse)
    function parseTituloToNumber(val) {
      if (val == null) return null
      let s = String(val).trim()
      if (s === '') return null
      let negative = false
      const parMatch = s.match(/^\((.*)\)$/)
      if (parMatch) {
        negative = true
        s = parMatch[1]
      }
      s = s.replace(/[^0-9.,-]/g, '')
      if (s === '' || s === '-' || s === '.' || s === ',') return null
      if (s.indexOf('.') !== -1 && s.indexOf(',') !== -1) {
        s = s.replace(/\./g, '')
        s = s.replace(/,/g, '.')
      } else if (s.indexOf(',') !== -1 && s.indexOf('.') === -1) {
        s = s.replace(/,/g, '.')
      } else {
        s = s.replace(/\.(?=\d{3}(?:\D|$))/g, '')
      }
      s = s.replace(/^\+/, '')
      if (s === '' || s === '-') return null
      const n = Number(s)
      if (!Number.isFinite(n)) return null
      return negative ? -n : n
    }

    // Group tituloRows by TESTNR and compute average
    const byTest = {}
    for (const t of tituloRows) {
      const k = t.TESTNR
      const parsed = parseTituloToNumber(t.TITULO)
      if (parsed == null) continue
      if (!byTest[k]) byTest[k] = { sum: 0, count: 0 }
      byTest[k].sum += parsed
      byTest[k].count += 1
    }

    const rows = parRows.map((r) => ({
      TESTNR: r.TESTNR,
      NOMCOUNT: r.NOMCOUNT,
      AVG_TITULO:
        byTest[r.TESTNR] && byTest[r.TESTNR].count
          ? byTest[r.TESTNR].sum / byTest[r.TESTNR].count
          : null,
      MASCHNR: r.MASCHNR,
      LOTE: r.LOTE,
      LABORANT: r.LABORANT,
      TIME_STAMP: r.TIME_STAMP
    }))

    res.json({ rows })
  } catch (err) {
    globalThis.console.error('List uster error', err)
    res.status(500).json({ error: String(err && err.message ? err.message : err) })
  } finally {
    try {
      if (conn) await conn.close()
    } catch (err2) {
      globalThis.console.error('close conn err', err2)
    }
  }
})

// GET /api/uster/tbl?testnr=XXXX
// Returns rows from USTER_TBL for a given TESTNR
app.get('/api/uster/tbl', async (req, res) => {
  const testnr = req.query && req.query.testnr ? String(req.query.testnr) : null

  let conn
  try {
    await initPool()
    conn = await getConnection()

    let sql, binds
    if (testnr) {
      sql = `SELECT * FROM ${SCHEMA_PREFIX}USTER_TBL WHERE TESTNR = :TESTNR ORDER BY TESTNR, SEQNO NULLS LAST`
      binds = { TESTNR: testnr }
    } else {
      // Return all records for statistics
      sql = `SELECT * FROM ${SCHEMA_PREFIX}USTER_TBL ORDER BY TESTNR, SEQNO NULLS LAST`
      binds = {}
    }

    const result = await conn.execute(sql, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT })
    const rows = result.rows || []
    res.json({ rows })
  } catch (err) {
    globalThis.console.error('Error fetching USTER_TBL', testnr || 'all', err)
    res.status(500).json({ error: String(err && err.message ? err.message : err) })
  } finally {
    try {
      if (conn) await conn.close()
    } catch (e) {
      globalThis.console.error('close conn err', e)
    }
  }
})

// Get all USTER_PAR records (for NOMCOUNT selector)
app.get('/api/uster/par', async (req, res) => {
  let conn
  try {
    await initPool()
    conn = await getConnection()

    const sql = `SELECT TESTNR, NOMCOUNT, MASCHNR, LOTE, LABORANT, TIME_STAMP, MATCLASS, ESTIRAJE, PASADOR, OBS FROM ${SCHEMA_PREFIX}USTER_PAR ORDER BY TESTNR`
    const result = await conn.execute(
      sql,
      {},
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        fetchInfo: { OBS: { type: oracledb.STRING } }
      }
    )

    // Helper function to format date as yyyy-mm-ddT00:00:00 to ensure local timezone parsing
    const formatDateForTransport = (dt) => {
      if (!dt || !(dt instanceof Date)) return dt
      if (isNaN(dt.getTime())) return dt
      // Format as yyyy-mm-ddT00:00:00 which JavaScript will parse as local midnight
      const yyyy = dt.getFullYear()
      const mm = String(dt.getMonth() + 1).padStart(2, '0')
      const dd = String(dt.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}T00:00:00`
    }

    const rows = (result.rows || []).map(row => ({
      ...row,
      TIME_STAMP: formatDateForTransport(row.TIME_STAMP)
    }))
    res.json({ rows })
  } catch (err) {
    globalThis.console.error('Error fetching USTER_PAR', err)
    res.status(500).json({ error: String(err && err.message ? err.message : err) })
  } finally {
    try {
      if (conn) await conn.close()
    } catch (e) {
      globalThis.console.error('close conn err', e)
    }
  }
})

// Diagnostic endpoint (temporary): return USTER_TBL rows whose TITULO can't be parsed to number
app.get('/api/uster/bad-titulos', async (req, res) => {
  let conn
  try {
    await initPool()
    conn = await getConnection()

    const sql = `SELECT TESTNR, TITULO,
      TRIM(REGEXP_REPLACE(TITULO, '[^0-9\\\.,-]', '')) AS CLEANED
      FROM ${SCHEMA_PREFIX}USTER_TBL
      WHERE TRIM(REGEXP_REPLACE(TITULO, '[^0-9\\\.,-]', '')) IS NOT NULL
        AND NOT REGEXP_LIKE(REPLACE(TRIM(REGEXP_REPLACE(TITULO, '[^0-9\\\.,-]', '')), ',', '.'), '^-?[0-9]+(\\.[0-9]+)?$')
      FETCH FIRST 500 ROWS ONLY`

    const result = await conn.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT })
    const rows = (result.rows || []).map((r) => ({
      TESTNR: r.TESTNR,
      TITULO: r.TITULO,
      CLEANED: r.CLEANED
    }))
    res.json({ rows })
  } catch (err) {
    globalThis.console.error('bad-titulos error', err)
    res.status(500).json({ error: String(err && err.message ? err.message : err) })
  } finally {
    try {
      if (conn) await conn.close()
    } catch (err2) {
      globalThis.console.error('close conn err', err2)
    }
  }
})

// GET /api/report/ensayo?testnr=XXXX
// Returns a consolidated report joining USTER_PAR, aggregates from USTER_TBL and TENSORAPID_TBL
app.get('/api/report/ensayo', async (req, res) => {
  const testnr = req.query && req.query.testnr ? String(req.query.testnr) : null
  if (!testnr) return res.status(400).json({ error: 'Missing testnr query parameter' })

  let conn
  try {
    await initPool()
    conn = await getConnection()

    // 1) Fetch USTER_PAR row
    const parSql = `SELECT TESTNR, TIME_STAMP, MASCHNR, NOMCOUNT, MATCLASS, ESTIRAJE FROM ${SCHEMA_PREFIX}USTER_PAR WHERE TESTNR = :TESTNR`
    const parRes = await conn.execute(
      parSql,
      { TESTNR: testnr },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    )
    const parRow = (parRes.rows || [])[0] || null

    // Helper to parse MASCHNR like "003 LIM" -> { number: 3, rest: 'LIM', formatted: '3 LIM' }
    function parseMaschnr(ms) {
      if (ms == null) return { number: null, rest: '', formatted: ms }
      const s = String(ms).trim()
      const m = s.match(/^0*(\d+)(?:\s*(.*))?$/)
      if (!m) return { number: null, rest: '', formatted: s }
      const num = parseInt(m[1], 10)
      const rest = (m[2] || '').trim()
      return { number: num, rest, formatted: rest ? `${num} ${rest}` : String(num) }
    }

    // 2) Aggregate from USTER_TBL (averages)
    const usterTblSql = `SELECT
      AVG(CVM_PERCENT) AS CVM_PERCENT_AVG,
      AVG(DELG_MINUS30_KM) AS DELG_MINUS30_KM_AVG,
      AVG(DELG_MINUS40_KM) AS DELG_MINUS40_KM_AVG,
      AVG(DELG_MINUS50_KM) AS DELG_MINUS50_KM_AVG,
      AVG(GRUE_35_KM) AS GRUE_35_KM_AVG,
      AVG(GRUE_50_KM) AS GRUE_50_KM_AVG,
      AVG(NEPS_140_KM) AS NEPS_140_KM_AVG,
      AVG(NEPS_280_KM) AS NEPS_280_KM_AVG
      FROM ${SCHEMA_PREFIX}USTER_TBL WHERE TESTNR = :TESTNR`
    const usterTblRes = await conn.execute(
      usterTblSql,
      { TESTNR: testnr },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    )
    const usterAgg = (usterTblRes.rows || [])[0] || {}

    // 3) TITULO average from USTER_TBL: fetch TITULO rows and parse to numbers in JS
    const tituloSql = `SELECT TITULO FROM ${SCHEMA_PREFIX}USTER_TBL WHERE TESTNR = :TESTNR`
    const tituloRes = await conn.execute(
      tituloSql,
      { TESTNR: testnr },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    )
    const tituloRows = tituloRes.rows || []

    function parseTituloToNumber(val) {
      if (val == null) return null
      let s = String(val).trim()
      if (s === '') return null
      let negative = false
      const parMatch = s.match(/^\((.*)\)$/)
      if (parMatch) {
        negative = true
        s = parMatch[1]
      }
      s = s.replace(/[^0-9.,-]/g, '')
      if (s === '' || s === '-' || s === '.' || s === ',') return null
      if (s.indexOf('.') !== -1 && s.indexOf(',') !== -1) {
        s = s.replace(/\./g, '')
        s = s.replace(/,/g, '.')
      } else if (s.indexOf(',') !== -1 && s.indexOf('.') === -1) {
        s = s.replace(/,/g, '.')
      } else {
        s = s.replace(/\.(?=\d{3}(?:\D|$))/g, '')
      }
      s = s.replace(/^\+/, '')
      if (s === '' || s === '-') return null
      const n = Number(s)
      if (!Number.isFinite(n)) return null
      return negative ? -n : n
    }

    let tituloSum = 0
    let tituloCount = 0
    for (const r of tituloRows) {
      const n = parseTituloToNumber(r.TITULO)
      if (n != null) {
        tituloSum += n
        tituloCount += 1
      }
    }
    const tituloAvg = tituloCount ? tituloSum / tituloCount : null

    // 4) TENSORAPID aggregates: find TENSORAPID_PAR rows that reference this USTER TESTNR
    const tensorParSql = `SELECT TESTNR FROM ${SCHEMA_PREFIX}TENSORAPID_PAR WHERE USTER_TESTNR = :USTER_TESTNR`
    const tensorParRes = await conn.execute(
      tensorParSql,
      { USTER_TESTNR: testnr },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    )
    const tensorParRows = tensorParRes.rows || []
    const tensorTestnrs = tensorParRows.map((r) => r.TESTNR).filter(Boolean)

    let tensorAgg = {}
    if (tensorTestnrs.length > 0) {
      const binds = {}
      const placeholders = tensorTestnrs
        .map((t, i) => {
          binds[`tn${i}`] = t
          return `:tn${i}`
        })
        .join(',')
      const tensorTblSql = `SELECT AVG(FUERZA_B) AS FUERZA_B_AVG, AVG(ELONGACION) AS ELONGACION_AVG, AVG(TENACIDAD) AS TENACIDAD_AVG, AVG(FUERZA_B) AS TRABAJO_B_AVG FROM ${SCHEMA_PREFIX}TENSORAPID_TBL WHERE TESTNR IN (${placeholders})`
      const tensorTblRes = await conn.execute(tensorTblSql, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      })
      tensorAgg = (tensorTblRes.rows || [])[0] || {}
    }

    // Helpers for formatting numbers and dates according to the requested spec
    function fmtNumber(val, decimals) {
      if (val == null || val === '') return null
      const n = Number(val)
      if (!Number.isFinite(n)) return null
      if (typeof decimals === 'number') {
        // return Number rounded to given decimals (not string)
        return Number(n.toFixed(decimals))
      }
      return n
    }

    function padTestnr(t) {
      if (t == null) return null
      const s = String(t)
      return s.padStart(5, '0')
    }

    function formatNe(val, matclass) {
      if (val == null || val === '') return null
      const n = Number(val)
      if (!Number.isFinite(n)) return null

      let result
      // If has decimals, format with comma (12.5 -> "12,5")
      // If integer, return as integer (12 -> 12)
      if (n % 1 !== 0) {
        result = String(n).replace('.', ',')
      } else {
        result = String(n)
      }

      // Add 'F' suffix if MATCLASS is 'Hilo de fantasia'
      if (matclass && String(matclass).toLowerCase().trim() === 'hilo de fantasia') {
        result += 'F'
      }

      return result
    }

    function formatDateShort(dt) {
      if (dt == null) return null

      try {
        let d = dt

        // If it's already a Date object from Oracle, use it directly
        if (d instanceof Date) {
          if (Number.isNaN(d.getTime())) return null
          // Use UTC methods to avoid timezone issues
          const dd = String(d.getUTCDate()).padStart(2, '0')
          const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
          const yy = String(d.getUTCFullYear()).slice(-2)
          return `${dd}/${mm}/${yy}`
        }

        // If it's a string, try to parse it
        if (typeof d === 'string') {
          const str = String(d).trim()

          // If already in dd/mm/yyyy or dd/mm/yy format, extract and reformat
          const ddmmyyyyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
          if (ddmmyyyyMatch) {
            const dd = ddmmyyyyMatch[1].padStart(2, '0')
            const mm = ddmmyyyyMatch[2].padStart(2, '0')
            const yyyy = ddmmyyyyMatch[3]
            const yy = yyyy.length === 4 ? yyyy.slice(-2) : yyyy
            return `${dd}/${mm}/${yy}`
          }

          // Try parsing as ISO date
          const parsed = new Date(str)
          if (!Number.isNaN(parsed.getTime())) {
            const dd = String(parsed.getUTCDate()).padStart(2, '0')
            const mm = String(parsed.getUTCMonth() + 1).padStart(2, '0')
            const yy = String(parsed.getUTCFullYear()).slice(-2)
            return `${dd}/${mm}/${yy}`
          }
        }
      } catch (err) {
        globalThis.console.warn('formatDateShort error:', err, 'for value:', dt)
      }

      return null
    }

    // Build the report object following your exact mapping and formatting
    const report = {
      Ensayo: padTestnr(testnr), // TESTNR formatted as 5 digits
      Fecha: parRow ? formatDateShort(parRow.TIME_STAMP) : null, // dd/mm/yy
      OE: parRow ? parseMaschnr(parRow.MASCHNR).formatted : null, // e.g. '3 LIM'
      Ne: parRow ? formatNe(parRow.NOMCOUNT, parRow.MATCLASS) : null,
      Obs: parRow ? parRow.OBS || null : null,

      // From USTER_TBL, averages with 2 decimals
      'CVm %': fmtNumber(usterAgg.CVM_PERCENT_AVG, 2),
      'Delg -30%': fmtNumber(usterAgg.DELG_MINUS30_KM_AVG, 2),
      'Delg -40%': fmtNumber(usterAgg.DELG_MINUS40_KM_AVG, 2),
      'Delg -50%': fmtNumber(usterAgg.DELG_MINUS50_KM_AVG, 2),
      'Grue +35%': fmtNumber(usterAgg.GRUE_35_KM_AVG, 2),
      'Grue +50%': fmtNumber(usterAgg.GRUE_50_KM_AVG, 2),
      'Neps +140%': fmtNumber(usterAgg.NEPS_140_KM_AVG, 2),
      'Neps +280%': fmtNumber(usterAgg.NEPS_280_KM_AVG, 2),

      // From TENSORAPID_TBL: integers (no decimals) for fuerza/trabajo and 2 decimals for elongacion/tenacidad
      'Fuerza B': fmtNumber(tensorAgg.FUERZA_B_AVG, 0),
      'Elong. %': fmtNumber(tensorAgg.ELONGACION_AVG, 2),
      'Tenac.': fmtNumber(tensorAgg.TENACIDAD_AVG, 2),
      'Trabajo B': fmtNumber(tensorAgg.FUERZA_B_AVG, 0),

      // TITULO average (USTER_TBL) with 2 decimals
      Titulo: fmtNumber(tituloAvg, 2)
    }

    res.json({ report })
  } catch (err) {
    globalThis.console.error('report ensayo error', err)
    res.status(500).json({ error: String(err && err.message ? err.message : err) })
  } finally {
    try {
      if (conn) await conn.close()
    } catch (e) {
      globalThis.console.error('close conn err', e)
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
        ESTIRAJE = :ESTIRAJE,
        PASADOR = :PASADOR,
        TUNAME = :TUNAME,
        GROUPS = :GROUPS,
        WITHIN = :WITHIN,
        TOTAL = :TOTAL,
        SPEED = :SPEED,
        TESTTIME = :TESTTIME,
        SLOT = :SLOT,
        ABSORBERPRESSURE = :ABSORBERPRESSURE
    WHEN NOT MATCHED THEN
  INSERT (TESTNR, CATALOG, TIME_STAMP, LOTE, SORTIMENT, ARTICLE, MASCHNR, MATCLASS, NOMCOUNT, NOMTWIST, USCODE, FB_MIC, FB_TIPO, FB_LONG, FB_PORC, LABORANT, OBS, ESTIRAJE, PASADOR, TUNAME, GROUPS, WITHIN, TOTAL, SPEED, TESTTIME, SLOT, ABSORBERPRESSURE)
  VALUES (:TESTNR, :CATALOG, :TIME_STAMP, :LOTE, :SORTIMENT, :ARTICLE, :MASCHNR, :MATCLASS, :NOMCOUNT, :NOMTWIST, :USCODE, :FB_MIC, :FB_TIPO, :FB_LONG, :FB_PORC, :LABORANT, :OBS, :ESTIRAJE, :PASADOR, :TUNAME, :GROUPS, :WITHIN, :TOTAL, :SPEED, :TESTTIME, :SLOT, :ABSORBERPRESSURE)`

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
      ESTIRAJE: par.ESTIRAJE || null,
      PASADOR: par.PASADOR || null,
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

// GET /api/tensorapid/by-uster/:uster
// Returns TENSORAPID_PAR rows for a given USTER_TESTNR
app.get('/api/tensorapid/by-uster/:uster', async (req, res) => {
  const uster = req.params && req.params.uster ? String(req.params.uster) : null
  if (!uster) return res.status(400).json({ error: 'Missing uster param' })
  let conn
  try {
    await initPool()
    conn = await getConnection()
    const sql = `SELECT TESTNR, USTER_TESTNR, CATALOG, TIME FROM ${SCHEMA_PREFIX}TENSORAPID_PAR WHERE USTER_TESTNR = :USTER`
    const r = await conn.execute(sql, { USTER: uster }, { outFormat: oracledb.OUT_FORMAT_OBJECT })
    const rows = r.rows || []
    res.json({ rows })
  } catch (err) {
    globalThis.console.error('tensorapid by-uster error', err)
    res.status(500).json({ error: String(err && err.message ? err.message : err) })
  } finally {
    try {
      if (conn) await conn.close()
    } catch (e) {
      globalThis.console.error('close conn err', e)
    }
  }
})

// GET /api/tensorapid/tbl?testnr=XXXX
// Returns rows from TENSORAPID_TBL for a given TESTNR
app.get('/api/tensorapid/tbl', async (req, res) => {
  const testnr = req.query && req.query.testnr ? String(req.query.testnr) : null

  let conn
  try {
    await initPool()
    conn = await getConnection()

    let sql, binds
    if (testnr) {
      sql = `SELECT * FROM ${SCHEMA_PREFIX}TENSORAPID_TBL WHERE TESTNR = :TESTNR ORDER BY HUSO_NUMBER NULLS LAST`
      binds = { TESTNR: testnr }
    } else {
      // Return all records for statistics
      sql = `SELECT * FROM ${SCHEMA_PREFIX}TENSORAPID_TBL ORDER BY TESTNR, HUSO_NUMBER NULLS LAST`
      binds = {}
    }

    const result = await conn.execute(sql, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT })
    const rows = result.rows || []
    res.json({ rows })
  } catch (err) {
    globalThis.console.error('Error fetching TENSORAPID_TBL', testnr || 'all', err)
    res.status(500).json({ error: String(err && err.message ? err.message : err) })
  } finally {
    try {
      if (conn) await conn.close()
    } catch (e) {
      globalThis.console.error('close conn err', e)
    }
  }
})

/*
GET /api/tensorapid/par
Returns all TENSORAPID_PAR records with TESTNR and USTER_TESTNR mapping
*/
app.get('/api/tensorapid/par', async (req, res) => {
  let conn
  try {
    await initPool()
    conn = await getConnection()

    const sql = `SELECT * FROM ${SCHEMA_PREFIX}TENSORAPID_PAR ORDER BY TESTNR`
    const result = await conn.execute(sql, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT })
    const rows = result.rows || []
    res.json({ rows })
  } catch (err) {
    globalThis.console.error('Error fetching TENSORAPID_PAR', err)
    res.status(500).json({ error: String(err && err.message ? err.message : err) })
  } finally {
    try {
      if (conn) await conn.close()
    } catch (e) {
      globalThis.console.error('close conn err', e)
    }
  }
})

/*
DELETE /api/tensorapid/delete
Body: { testnr: '...' }
Deletes all records for a given TESTNR from TENSORAPID_TBL and TENSORAPID_PAR only.
Response: { success: true, message: '...' }
*/
app.delete('/api/tensorapid/delete', async (req, res) => {
  const payload = req.body || {}
  const testnr = payload.testnr

  globalThis.console.log('DELETE /api/tensorapid/delete received - TESTNR:', testnr)

  if (!testnr) return res.status(400).json({ error: 'Missing testnr' })

  const dryRun =
    (typeof globalThis !== 'undefined' &&
      globalThis.process &&
      globalThis.process.env &&
      globalThis.process.env.SKIP_DB === 'true') ||
    payload.dry === true

  let conn
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

    // Delete from TENSORAPID_TBL first (child table)
    const deleteTblSql = `DELETE FROM ${SCHEMA_PREFIX}TENSORAPID_TBL WHERE TESTNR = :TESTNR`
    globalThis.console.log('Executing DELETE TBL SQL:', deleteTblSql)
    const tblResult = await conn.execute(deleteTblSql, { TESTNR: testnr }, { autoCommit: false })
    globalThis.console.log('TBL rows deleted:', tblResult.rowsAffected)

    // Delete from TENSORAPID_PAR (parent table)
    const deleteParSql = `DELETE FROM ${SCHEMA_PREFIX}TENSORAPID_PAR WHERE TESTNR = :TESTNR`
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
    globalThis.console.error('Delete tensorapid error', err)
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
    } catch (e) {
      globalThis.console.error('close conn err', e)
    }
  }
})

// GET /api/report/informe-completo
// Returns a consolidated report for ALL TESTNRs from USTER_PAR with aggregates from USTER_TBL and TENSORAPID_TBL
app.get('/api/report/informe-completo', async (req, res) => {
  let conn
  try {
    await initPool()
    conn = await getConnection()

    // Helper to parse MASCHNR like "003 LIM" -> "3 LIM"
    function parseMaschnr(ms) {
      if (ms == null) return null
      const s = String(ms).trim()
      const m = s.match(/^0*(\d+)(?:\s*(.*))?$/)
      if (!m) return s
      const num = parseInt(m[1], 10)
      const rest = (m[2] || '').trim()
      return rest ? `${num} ${rest}` : String(num)
    }

    // Helper to parse TITULO to number
    function parseTituloToNumber(val) {
      if (val == null) return null
      let s = String(val).trim()
      if (s === '') return null
      let negative = false
      const parMatch = s.match(/^\((.*)\)$/)
      if (parMatch) {
        negative = true
        s = parMatch[1]
      }
      s = s.replace(/[^0-9.,-]/g, '')
      if (s === '' || s === '-' || s === '.' || s === ',') return null
      if (s.indexOf('.') !== -1 && s.indexOf(',') !== -1) {
        s = s.replace(/\./g, '')
        s = s.replace(/,/g, '.')
      } else if (s.indexOf(',') !== -1 && s.indexOf('.') === -1) {
        s = s.replace(/,/g, '.')
      } else {
        s = s.replace(/\.(?=\d{3}(?:\D|$))/g, '')
      }
      s = s.replace(/^\+/, '')
      if (s === '' || s === '-') return null
      const n = Number(s)
      if (!Number.isFinite(n)) return null
      return negative ? -n : n
    }

    function fmtNumber(val, decimals) {
      if (val == null || val === '') return null
      const n = Number(val)
      if (!Number.isFinite(n)) return null
      if (typeof decimals === 'number') {
        return Number(n.toFixed(decimals))
      }
      return n
    }

    function padTestnr(t) {
      if (t == null) return null
      const s = String(t)
      return s.padStart(5, '0')
    }

    function formatNe(val, matclass) {
      if (val == null || val === '') return null
      const n = Number(val)
      if (!Number.isFinite(n)) return null

      let result
      // If has decimals, format with comma (12.5 -> "12,5")
      // If integer, return as integer (12 -> 12)
      if (n % 1 !== 0) {
        result = String(n).replace('.', ',')
      } else {
        result = String(n)
      }

      // Add 'F' suffix if MATCLASS is 'Hilo de fantasia'
      if (matclass && String(matclass).toLowerCase().trim() === 'hilo de fantasia') {
        result += 'F'
      }

      return result
    }

    function formatDateShort(dt) {
      if (dt == null) return null

      try {
        let d = dt

        // If it's already a Date object from Oracle, use it directly
        if (d instanceof Date) {
          if (Number.isNaN(d.getTime())) return null
          // Use local time methods to match frontend
          const dd = String(d.getDate()).padStart(2, '0')
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const yy = String(d.getFullYear()).slice(-2)
          return `${dd}/${mm}/${yy}`
        }

        // If it's a string, try to parse it
        if (typeof d === 'string') {
          const str = String(d).trim()

          // If already in dd/mm/yyyy or dd/mm/yy format, extract and reformat
          const ddmmyyyyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
          if (ddmmyyyyMatch) {
            const dd = ddmmyyyyMatch[1].padStart(2, '0')
            const mm = ddmmyyyyMatch[2].padStart(2, '0')
            const yyyy = ddmmyyyyMatch[3]
            const yy = yyyy.length === 4 ? yyyy.slice(-2) : yyyy
            return `${dd}/${mm}/${yy}`
          }

          // Try parsing as ISO date
          const parsed = new Date(str)
          if (!Number.isNaN(parsed.getTime())) {
            const dd = String(parsed.getDate()).padStart(2, '0')
            const mm = String(parsed.getMonth() + 1).padStart(2, '0')
            const yy = String(parsed.getFullYear()).slice(-2)
            return `${dd}/${mm}/${yy}`
          }
        }
      } catch (err) {
        globalThis.console.warn('formatDateShort error:', err, 'for value:', dt)
      }

      return null
    }

    // 1) Fetch all USTER_PAR rows (descending by TESTNR, limit to recent 200)
    const parSql = `SELECT TESTNR, TIME_STAMP, MASCHNR, NOMCOUNT, MATCLASS, OBS
      FROM ${SCHEMA_PREFIX}USTER_PAR
      ORDER BY TESTNR DESC
      FETCH FIRST 200 ROWS ONLY`
    const parRes = await conn.execute(parSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT })
    const parRowsRaw = parRes.rows || []

    if (parRowsRaw.length === 0) {
      return res.json({ rows: [] })
    }

    // Helper to read LOB (Large Object) as string
    async function readLob(lob) {
      if (!lob || typeof lob.getData !== 'function') {
        return lob == null ? null : String(lob)
      }
      try {
        const data = await lob.getData()
        return data ? String(data) : null
      } catch (err) {
        globalThis.console.warn('Error reading LOB:', err)
        return null
      }
    }

    // Convert LOBs to strings for OBS field
    const parRows = []
    for (const row of parRowsRaw) {
      const obsValue =
        row.OBS && typeof row.OBS === 'object' && row.OBS.getData
          ? await readLob(row.OBS)
          : row.OBS || null
      parRows.push({
        ...row,
        OBS: obsValue
      })
    }

    const testnrs = parRows.map((r) => r.TESTNR).filter(Boolean)

    // 2) Fetch USTER_TBL aggregates for all TESTNRs in one query
    const binds = {}
    const placeholders = testnrs
      .map((t, i) => {
        binds[`tn${i}`] = t
        return `:tn${i}`
      })
      .join(',')

    const usterTblSql = `SELECT TESTNR,
      AVG(CVM_PERCENT) AS CVM_PERCENT_AVG,
      AVG(DELG_MINUS30_KM) AS DELG_MINUS30_KM_AVG,
      AVG(DELG_MINUS40_KM) AS DELG_MINUS40_KM_AVG,
      AVG(DELG_MINUS50_KM) AS DELG_MINUS50_KM_AVG,
      AVG(GRUE_35_KM) AS GRUE_35_KM_AVG,
      AVG(GRUE_50_KM) AS GRUE_50_KM_AVG,
      AVG(NEPS_140_KM) AS NEPS_140_KM_AVG,
      AVG(NEPS_280_KM) AS NEPS_280_KM_AVG
      FROM ${SCHEMA_PREFIX}USTER_TBL
      WHERE TESTNR IN (${placeholders})
      GROUP BY TESTNR`
    const usterTblRes = await conn.execute(usterTblSql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    })
    const usterAggRows = usterTblRes.rows || []

    // Build map: TESTNR -> aggregates
    const usterAggMap = {}
    usterAggRows.forEach((row) => {
      usterAggMap[row.TESTNR] = row
    })

    // 3) Fetch TITULO rows for all TESTNRs and compute average per TESTNR
    const tituloSql = `SELECT TESTNR, TITULO FROM ${SCHEMA_PREFIX}USTER_TBL WHERE TESTNR IN (${placeholders})`
    const tituloRes = await conn.execute(tituloSql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    })
    const tituloRows = tituloRes.rows || []

    const tituloMap = {}
    tituloRows.forEach((row) => {
      const testnr = row.TESTNR
      const n = parseTituloToNumber(row.TITULO)
      if (n != null) {
        if (!tituloMap[testnr]) tituloMap[testnr] = { sum: 0, count: 0 }
        tituloMap[testnr].sum += n
        tituloMap[testnr].count += 1
      }
    })

    // 4) Fetch TENSORAPID_PAR linkages for all USTER TESTNRs
    const tensorParSql = `SELECT USTER_TESTNR, TESTNR FROM ${SCHEMA_PREFIX}TENSORAPID_PAR WHERE USTER_TESTNR IN (${placeholders})`
    const tensorParRes = await conn.execute(tensorParSql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    })
    const tensorParRows = tensorParRes.rows || []

    // Build map: USTER_TESTNR -> [TESTNR list]
    const tensorLinkMap = {}
    tensorParRows.forEach((row) => {
      const uster = row.USTER_TESTNR
      const tensor = row.TESTNR
      if (!tensorLinkMap[uster]) tensorLinkMap[uster] = []
      tensorLinkMap[uster].push(tensor)
    })

    // Collect all TENSORAPID TESTNRs
    const allTensorTestnrs = [...new Set(tensorParRows.map((r) => r.TESTNR).filter(Boolean))]

    // 5) Fetch TENSORAPID_TBL aggregates for all linked TESTNRs
    let tensorAggMap = {}
    if (allTensorTestnrs.length > 0) {
      const tensorBinds = {}
      const tensorPlaceholders = allTensorTestnrs
        .map((t, i) => {
          tensorBinds[`tt${i}`] = t
          return `:tt${i}`
        })
        .join(',')

      const tensorTblSql = `SELECT TESTNR,
        AVG(FUERZA_B) AS FUERZA_B_AVG,
        AVG(ELONGACION) AS ELONGACION_AVG,
        AVG(TENACIDAD) AS TENACIDAD_AVG,
        AVG(TRABAJO) AS TRABAJO_AVG
        FROM ${SCHEMA_PREFIX}TENSORAPID_TBL
        WHERE TESTNR IN (${tensorPlaceholders})
        GROUP BY TESTNR`
      const tensorTblRes = await conn.execute(tensorTblSql, tensorBinds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      })
      const tensorAggRows = tensorTblRes.rows || []

      tensorAggRows.forEach((row) => {
        tensorAggMap[row.TESTNR] = row
      })
    }

    // 6) Build the report rows
    const reportRows = parRows.map((parRow) => {
      const testnr = parRow.TESTNR
      const usterAgg = usterAggMap[testnr] || {}
      const tituloData = tituloMap[testnr]
      const tituloAvg = tituloData ? tituloData.sum / tituloData.count : null

      // Get linked TENSORAPID TESTNRs
      const linkedTensorTestnrs = tensorLinkMap[testnr] || []

      // Aggregate TENSORAPID values across linked TESTNRs
      let fuerzaSum = 0,
        fuerzaCount = 0
      let elongSum = 0,
        elongCount = 0
      let tenacSum = 0,
        tenacCount = 0
      let trabajoSum = 0,
        trabajoCount = 0

      linkedTensorTestnrs.forEach((tt) => {
        const agg = tensorAggMap[tt]
        if (agg) {
          if (agg.FUERZA_B_AVG != null) {
            fuerzaSum += agg.FUERZA_B_AVG
            fuerzaCount += 1
          }
          if (agg.ELONGACION_AVG != null) {
            elongSum += agg.ELONGACION_AVG
            elongCount += 1
          }
          if (agg.TENACIDAD_AVG != null) {
            tenacSum += agg.TENACIDAD_AVG
            tenacCount += 1
          }
          if (agg.TRABAJO_AVG != null) {
            trabajoSum += agg.TRABAJO_AVG
            trabajoCount += 1
          }
        }
      })

      return {
        Ensayo: padTestnr(testnr),
        Fecha: formatDateShort(parRow.TIME_STAMP),
        OE: parseMaschnr(parRow.MASCHNR),
        Ne: formatNe(parRow.NOMCOUNT, parRow.MATCLASS),
        OBS: parRow.OBS || null,
        'CVm %': fmtNumber(usterAgg.CVM_PERCENT_AVG, 2),
        'Delg -30%': fmtNumber(usterAgg.DELG_MINUS30_KM_AVG, 2),
        'Delg -40%': fmtNumber(usterAgg.DELG_MINUS40_KM_AVG, 2),
        'Delg -50%': fmtNumber(usterAgg.DELG_MINUS50_KM_AVG, 2),
        'Grue +35%': fmtNumber(usterAgg.GRUE_35_KM_AVG, 2),
        'Grue +50%': fmtNumber(usterAgg.GRUE_50_KM_AVG, 2),
        'Neps +140%': fmtNumber(usterAgg.NEPS_140_KM_AVG, 2),
        'Neps +280%': fmtNumber(usterAgg.NEPS_280_KM_AVG, 2),
        'Fuerza B': fuerzaCount ? fmtNumber(fuerzaSum / fuerzaCount, 0) : null,
        'Elong. %': elongCount ? fmtNumber(elongSum / elongCount, 2) : null,
        'Tenac.': tenacCount ? fmtNumber(tenacSum / tenacCount, 2) : null,
        'Trabajo B': trabajoCount ? fmtNumber(trabajoSum / trabajoCount, 0) : null,
        Titulo: fmtNumber(tituloAvg, 2)
      }
    })

    res.json({ rows: reportRows })
  } catch (err) {
    globalThis.console.error('informe completo error', err)
    res.status(500).json({ error: String(err && err.message ? err.message : err) })
  } finally {
    try {
      if (conn) await conn.close()
    } catch (e) {
      globalThis.console.error('close conn err', e)
    }
  }
})

// Sync Oracle to Firebase endpoint
app.post('/api/sync-firebase', async (req, res) => {
  try {
    console.log('🔄 Starting Oracle to Firebase sync...')
    
    // Importar dinámicamente los módulos necesarios
    const { spawn } = await import('child_process')
    const { promisify } = await import('util')
    const execPromise = promisify(spawn)
    
    // Paso 1: Exportar de Oracle a JSON
    console.log('📤 Step 1: Exporting from Oracle...')
    const exportProcess = spawn('node', ['firebase/export-oracle.js'], {
      cwd: new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'),
      shell: true
    })
    
    let exportOutput = ''
    let exportError = ''
    
    exportProcess.stdout.on('data', (data) => {
      exportOutput += data.toString()
      console.log(data.toString())
    })
    
    exportProcess.stderr.on('data', (data) => {
      exportError += data.toString()
      console.error(data.toString())
    })
    
    await new Promise((resolve, reject) => {
      exportProcess.on('close', (code) => {
        if (code === 0) resolve()
        else reject(new Error(`Export failed with code ${code}: ${exportError}`))
      })
    })
    
    // Paso 2: Importar a Firebase
    console.log('📥 Step 2: Importing to Firebase...')
    const importProcess = spawn('node', ['firebase/import-temp.js'], {
      cwd: new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'),
      shell: true
    })
    
    let importOutput = ''
    let importError = ''
    
    importProcess.stdout.on('data', (data) => {
      importOutput += data.toString()
      console.log(data.toString())
    })
    
    importProcess.stderr.on('data', (data) => {
      importError += data.toString()
      console.error(data.toString())
    })
    
    await new Promise((resolve, reject) => {
      importProcess.on('close', (code) => {
        if (code === 0) resolve()
        else reject(new Error(`Import failed with code ${code}: ${importError}`))
      })
    })
    
    console.log('✅ Sync completed successfully')
    res.json({ 
      success: true, 
      message: 'Datos sincronizados exitosamente con Firebase',
      exportOutput,
      importOutput
    })
    
  } catch (error) {
    console.error('❌ Sync error:', error)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

// Print registered routes (helps debugging 'Cannot GET /...')
function printRegisteredRoutes() {
  try {
    const routes = []
    if (app && app._router && app._router.stack) {
      app._router.stack.forEach((middleware) => {
        if (middleware.route) {
          const methods = Object.keys(middleware.route.methods).join(',').toUpperCase()
          routes.push(`${methods} ${middleware.route.path}`)
        } else if (middleware.name === 'router' && middleware.handle && middleware.handle.stack) {
          middleware.handle.stack.forEach((handler) => {
            if (handler.route) {
              const methods = Object.keys(handler.route.methods).join(',').toUpperCase()
              routes.push(`${methods} ${handler.route.path}`)
            }
          })
        }
      })
    }
    globalThis.console.log('Registered routes:\n' + routes.join('\n'))
  } catch (e) {
    globalThis.console.warn('Failed to list routes', e)
  }
}

printRegisteredRoutes()
app.listen(PORT, () => globalThis.console.log(`Server listening on ${PORT}`))
