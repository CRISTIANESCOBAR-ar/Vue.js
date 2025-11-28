<template>
  <div class="page-container p-4">
    <h1 class="page-title">Página 2</h1>
    
    <div class="content-card">
      <div class="placeholder-content">
        <div class="placeholder-icon">📊</div>
        <h2>Contenido en desarrollo</h2>
        <p>Esta página estará disponible próximamente</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// Lógica de la página 2 aquí
</script>

<style scoped>
.page-container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #2c3e50;
}

@media (prefers-color-scheme: dark) {
  .page-title {
    color: #ecf0f1;
  }
}

.content-card {
  background-color: white;
  padding: 3rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (prefers-color-scheme: dark) {
  .content-card {
    background-color: #2c3e50;
  }
}

.placeholder-content {
  text-align: center;
  padding: 4rem 2rem;
  color: #7f8c8d;
}

.placeholder-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
}

.placeholder-content h2 {
  margin: 1rem 0;
  color: #34495e;
}

@media (prefers-color-scheme: dark) {
  .placeholder-content h2 {
    color: #ecf0f1;
  }
}

.placeholder-content p {
  font-size: 1.1rem;
}
</style>
