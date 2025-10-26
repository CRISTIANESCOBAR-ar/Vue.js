<template>
  <div class="max-w-sm mx-auto mt-10 p-6 border rounded shadow">
    <h2 class="text-xl font-semibold mb-4 text-center">Iniciar sesión</h2>
    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
        <input v-model="email" type="email" id="email" required
          class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">Contraseña</label>
        <input v-model="password" type="password" id="password" required
          class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </div>
      <button type="submit"
        class="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition">Ingresar</button>
      <p v-if="errorMessage" class="text-red-500 text-sm text-center mt-2">{{ errorMessage }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase'

const email = ref('')
const password = ref('')
const errorMessage = ref('')

async function handleLogin() {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
    errorMessage.value = ''
    console.log('Login exitoso')
    // Podés redirigir o mostrar contenido protegido aquí
  } catch (error) {
    errorMessage.value = 'Credenciales inválidas o error de conexión'
    console.error(error.message)
  }
}
</script>