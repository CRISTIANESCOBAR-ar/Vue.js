/* eslint-env browser */
// Paginación real para USTER_PAR y TENSORAPID_PAR
export async function fetchUsterParPaginated(pageSize = 25, lastDoc = null) {
  if (currentSource === 'firebase') {
    return firebaseService.getUsterParPaginated(pageSize, lastDoc)
  } else {
    // No paginación en Oracle, traer todo
    return { docs: await fetchFromOracle('/api/uster/par'), lastVisible: null }
  }
}

export async function fetchTensorapidParPaginated(pageSize = 25, lastDoc = null) {
  if (currentSource === 'firebase') {
    return firebaseService.getTensorapidParPaginated(pageSize, lastDoc)
  } else {
    return { docs: await fetchFromOracle('/api/tensorapid/par'), lastVisible: null }
  }
}
/**
 * Unified Data Service
 * Abstracts data fetching from Oracle (API) or Firebase
 */

import * as firebaseService from './firebaseService'

// Data source: 'oracle' or 'firebase'
// Default to firebase for production/remote access, oracle for localhost
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

let currentSource = isLocalhost ? 'oracle' : 'firebase'

/**
 * Set the data source
 */
export function setDataSource(source) {
  // Solo permitir 'oracle' si es localhost
  if (source === 'oracle' && !isLocalhost) {
    currentSource = 'firebase'
    console.warn('Oracle solo está disponible en entorno local. Usando Firebase.')
    return
  }
  if (source !== 'oracle' && source !== 'firebase') {
    throw new Error(`Invalid data source: ${source}`)
  }
  currentSource = source
  console.log(`📊 Data source changed to: ${currentSource}`)
}

/**
 * Get current data source
 */
export function getDataSource() {
  return currentSource
}

/**
 * Fetch from Oracle API
 */
async function fetchFromOracle(endpoint) {
  const response = await fetch(`http://localhost:3001${endpoint}`)
  if (!response.ok) {
    throw new Error(`Oracle API error: ${response.statusText}`)
  }
  const data = await response.json()
  // Oracle API returns { rows: [...] }, extract the rows array
  return data.rows || data
}

/**
 * Unified fetch USTER_PAR
 */
export async function fetchUsterPar() {
  if (currentSource === 'firebase') {
    return firebaseService.getUsterPar()
  } else {
    return fetchFromOracle('/api/uster/par')
  }
}

/**
 * Unified fetch USTER_TBL
 */
export async function fetchUsterTbl() {
  if (currentSource === 'firebase') {
    return firebaseService.getUsterTbl()
  } else {
    return fetchFromOracle('/api/uster/tbl')
  }
}

/**
 * Unified fetch TENSORAPID_PAR
 */
export async function fetchTensorapidPar() {
  if (currentSource === 'firebase') {
    return firebaseService.getTensorapidPar()
  } else {
    return fetchFromOracle('/api/tensorapid/par')
  }
}

/**
 * Unified fetch TENSORAPID_TBL
 */
export async function fetchTensorapidTbl() {
  if (currentSource === 'firebase') {
    return firebaseService.getTensorapidTbl()
  } else {
    return fetchFromOracle('/api/tensorapid/tbl')
  }
}

/**
 * Fetch all data needed for stats page
 */
export async function fetchAllStatsData() {
  try {
    const [usterPar, usterTbl, tensorapidPar, tensorapidTbl] = await Promise.all([
      fetchUsterPar(),
      fetchUsterTbl(),
      fetchTensorapidPar(),
      fetchTensorapidTbl()
    ])

    return {
      usterPar,
      usterTbl,
      tensorapidPar,
      tensorapidTbl,
      source: currentSource
    }
  } catch (error) {
    console.error(`Error fetching data from ${currentSource}:`, error)
    throw error
  }
}

export default {
  setDataSource,
  getDataSource,
  fetchUsterPar,
  fetchUsterTbl,
  fetchTensorapidPar,
  fetchTensorapidTbl,
  fetchAllStatsData
}
