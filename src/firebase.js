import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Leer configuración desde variables de entorno (Vite -> import.meta.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
}

let app = null
let auth = null

const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'TU_API_KEY'

if (!isConfigured) {
  // Evitar peticiones con claves placeholder y dar feedback en desarrollo
  // Un 400 (Bad Request) frecuente proviene de usar "TU_API_KEY" como placeholder
  // o de no tener la variable VITE_FIREBASE_API_KEY definida.
  // No inicializamos Firebase para que la app no haga llamadas inválidas.
  // En producción debes definir las variables de entorno y reiniciar el servidor.
  // No inicializamos Firebase porque faltan variables de entorno VITE_FIREBASE_*
  // Esto evita peticiones inválidas (400) durante desarrollo cuando la API key es un placeholder.
} else {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
}

export { app, auth }
