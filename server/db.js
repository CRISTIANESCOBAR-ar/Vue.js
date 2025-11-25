/*
  db.js
  Helper to create Oracle DB pool and provide connections.
  Configure via environment variables: ORACLE_USER, ORACLE_PASSWORD, ORACLE_CONNECTIONSTRING
*/
import 'dotenv/config'
import oracledb from 'oracledb'

// Resolve environment variables safely in Node and non-Node runtimes (avoids "process is not defined")
const _env =
  typeof globalThis !== 'undefined' &&
  'process' in globalThis &&
  globalThis.process &&
  globalThis.process.env
    ? globalThis.process.env
    : typeof globalThis !== 'undefined' && globalThis.__env__
      ? globalThis.__env__
      : {}

const poolConfig = {
  user: _env.ORACLE_USER || 'your_user',
  password: _env.ORACLE_PASSWORD || 'your_pass',
  connectString: _env.ORACLE_CONNECTIONSTRING || 'localhost/XEPDB1',
  poolMin: 0,
  poolMax: 10,
  poolIncrement: 1,
  queueTimeout: 120000  // 2 minutes timeout for waiting for a connection
}

let pool

async function initPool() {
  if (pool) return pool
  pool = await oracledb.createPool(poolConfig)
  return pool
}

async function getConnection() {
  if (!pool) await initPool()
  return pool.getConnection()
}

async function closePool() {
  if (pool) {
    try {
      await pool.close(10)
    } catch (err) {
      globalThis.console?.error('Error closing pool', err)
    }
    pool = null
  }
}

export { initPool, getConnection, closePool }
