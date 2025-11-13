<template>
    <div class="p-6 max-w-4xl mx-auto">
        <h2 class="text-2xl font-semibold mb-4">Configuración — Vista previa de fuentes</h2>

        <p class="mb-6 text-sm text-gray-600">Selecciona la familia que más te guste. Esto es sólo una vista previa
            rápida usando Google Fonts (import rápido). Para producción recomendamos self-host.</p>

        <div class="space-y-6">
            <section v-for="f in fonts" :key="f.id" class="border rounded p-4">
                <div class="flex items-center justify-between mb-3">
                    <div>
                        <div class="text-base font-medium">{{ f.name }}</div>
                        <div class="text-xs text-gray-500">{{ f.note }}</div>
                    </div>
                    <div class="text-sm text-gray-600">Import: Google Fonts (preview)</div>
                </div>

                <div :class="f.class" class="p-4 bg-white rounded">
                    <h3 class="text-xl font-semibold mb-2">The quick brown fox jumps over the lazy dog</h3>
                    <p class="text-sm text-gray-700">0123456789 — Ejemplo de texto: Lorem ipsum dolor sit amet,
                        consectetur adipiscing elit. Aquí se muestra cómo se vería un párrafo con la familia {{ f.name
                        }}.</p>
                </div>
            </section>
        </div>

        <div class="mt-6 text-sm text-gray-600">
            <p><strong>Nota:</strong> esto usa import rápido desde Google Fonts sólo para previsualización. Para
                producción puedes elegir “self-host” (me lo pides y preparo los archivos woff2 y `@font-face`).</p>
        </div>
    </div>
</template>

<script setup>
const fonts = [
    { id: 'inter', name: 'Inter', note: 'Neutral, alta legibilidad', class: 'font-inter' },
    { id: 'poppins', name: 'Poppins', note: 'Redondeado, amistoso', class: 'font-poppins' },
    { id: 'source-sans-3', name: 'Source Sans 3', note: 'Sobrio y profesional', class: 'font-source' },
    { id: 'merriweather', name: 'Merriweather', note: 'Serif elegante (bueno para títulos)', class: 'font-merri' }
]
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap');

.font-inter {
    font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
}

.font-poppins {
    font-family: 'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, Arial;
}

.font-source {
    font-family: 'Source Sans 3', system-ui, -apple-system, 'Segoe UI', Roboto, Arial;
}

.font-merri {
    font-family: 'Merriweather', Georgia, 'Times New Roman', Times, serif;
}

/* Small visual tweaks for the preview cards */
section {
    background: #f8fafc;
}
</style>
