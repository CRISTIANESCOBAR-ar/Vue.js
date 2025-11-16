import { startAfter, limit } from 'firebase/firestore'
/**
 * Fetch paginated USTER_PAR records
 * @param {number} pageSize
 * @param {any} lastDoc
 */
export async function getUsterParPaginated(pageSize = 25, lastDoc = null) {
  try {
    let q = query(collection(db, 'USTER_PAR'), orderBy('TIME_STAMP', 'desc'), limit(pageSize))
    if (lastDoc)
      q = query(
        collection(db, 'USTER_PAR'),
        orderBy('TIME_STAMP', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      )
    const snapshot = await getDocs(q)
    return {
      docs: snapshot.docs.map((doc) => convertTimestamps(doc.data())),
      lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null
    }
  } catch (error) {
    console.error('Error fetching paginated USTER_PAR from Firebase:', error)
    throw error
  }
}

/**
 * Fetch paginated TENSORAPID_PAR records
 * @param {number} pageSize
 * @param {any} lastDoc
 */
export async function getTensorapidParPaginated(pageSize = 25, lastDoc = null) {
  try {
    let q = query(collection(db, 'TENSORAPID_PAR'), orderBy('TIME_STAMP', 'desc'), limit(pageSize))
    if (lastDoc)
      q = query(
        collection(db, 'TENSORAPID_PAR'),
        orderBy('TIME_STAMP', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      )
    const snapshot = await getDocs(q)
    return {
      docs: snapshot.docs.map((doc) => convertTimestamps(doc.data())),
      lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null
    }
  } catch (error) {
    console.error('Error fetching paginated TENSORAPID_PAR from Firebase:', error)
    throw error
  }
}
/**
 * Firebase Service
 * Provides Firestore data access for the application
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, query, where, orderBy } from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCL406bndqssN7lGAe5t-CVKAHKPeuBRKA',
  authDomain: 'carga-datos-vue.firebaseapp.com',
  projectId: 'carga-datos-vue',
  storageBucket: 'carga-datos-vue.firebasestorage.app',
  messagingSenderId: '344664674693',
  appId: '1:344664674693:web:fcfcea32f646ae877b74ec'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

/**
 * Convert Firestore Timestamp to Date
 */
function convertTimestamps(doc) {
  const data = { ...doc }

  for (const [key, value] of Object.entries(data)) {
    // Firestore Timestamp has toDate() method
    if (value && typeof value === 'object' && typeof value.toDate === 'function') {
      data[key] = value.toDate()
    }
  }

  return data
}

/**
 * Fetch USTER_PAR records
 */
export async function getUsterPar() {
  try {
    const snapshot = await getDocs(collection(db, 'USTER_PAR'))
    return snapshot.docs.map((doc) => convertTimestamps(doc.data()))
  } catch (error) {
    console.error('Error fetching USTER_PAR from Firebase:', error)
    throw error
  }
}

/**
 * Fetch USTER_TBL records
 */
export async function getUsterTbl() {
  try {
    const snapshot = await getDocs(collection(db, 'USTER_TBL'))
    return snapshot.docs.map((doc) => convertTimestamps(doc.data()))
  } catch (error) {
    console.error('Error fetching USTER_TBL from Firebase:', error)
    throw error
  }
}

/**
 * Fetch TENSORAPID_PAR records
 */
export async function getTensorapidPar() {
  try {
    const snapshot = await getDocs(collection(db, 'TENSORAPID_PAR'))
    return snapshot.docs.map((doc) => convertTimestamps(doc.data()))
  } catch (error) {
    console.error('Error fetching TENSORAPID_PAR from Firebase:', error)
    throw error
  }
}

/**
 * Fetch TENSORAPID_TBL records
 */
export async function getTensorapidTbl() {
  try {
    const snapshot = await getDocs(collection(db, 'TENSORAPID_TBL'))
    return snapshot.docs.map((doc) => convertTimestamps(doc.data()))
  } catch (error) {
    console.error('Error fetching TENSORAPID_TBL from Firebase:', error)
    throw error
  }
}

/**
 * Fetch USTER_PAR by NOMCOUNT
 */
export async function getUsterParByNomcount(nomcount) {
  try {
    const q = query(
      collection(db, 'USTER_PAR'),
      where('NOMCOUNT', '==', nomcount),
      orderBy('TIME_STAMP', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => convertTimestamps(doc.data()))
  } catch (error) {
    console.error('Error fetching USTER_PAR by NOMCOUNT from Firebase:', error)
    throw error
  }
}

export default {
  getUsterPar,
  getUsterTbl,
  getTensorapidPar,
  getTensorapidTbl,
  getUsterParByNomcount
}
