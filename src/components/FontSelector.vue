<template>
    <div class="p-6 max-w-6xl mx-auto">
        <h2 class="text-3xl font-bold mb-2">🎨 Selector de Fuentes</h2>
        <p class="mb-6 text-sm text-slate-600">Haz clic en "Aplicar" para usar esa fuente en toda la aplicación.</p>

        <div class="grid gap-6">
            <section v-for="f in fonts" :key="f.id"
                class="border-2 rounded-xl p-6 hover:border-blue-400 transition-all duration-200"
                :class="currentFont === f.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <div class="text-xl font-bold" :class="f.class">{{ f.name }}</div>
                        <div class="text-sm text-slate-500 mt-1">{{ f.note }}</div>
                    </div>
                    <button @click="applyFont(f.id)" class="px-4 py-2 rounded-lg font-medium transition-colors" :class="currentFont === f.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'">
                        {{ currentFont === f.id ? '✓ Aplicada' : 'Aplicar' }}
                    </button>
                </div>

                <div :class="f.class" class="space-y-3">
                    <div class="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg">
                        <h3 class="text-2xl font-bold mb-2">Detalle completo del ensayo Uster 05411</h3>
                        <p class="text-base text-slate-700">
                            Informe Completo de Ensayos — Este es un ejemplo de cómo se verían
                            los títulos y el texto principal de la aplicación.
                        </p>
                    </div>

                    <div class="flex gap-4 text-sm">
                        <div class="flex-1 p-3 bg-white border border-slate-200 rounded-lg">
                            <div class="font-semibold text-slate-600 mb-1">Números y datos</div>
                            <div class="text-base">12.54 | 11.75 | 708.50 | 20.10</div>
                        </div>
                        <div class="flex-1 p-3 bg-white border border-slate-200 rounded-lg">
                            <div class="font-semibold text-slate-600 mb-1">Botones y acciones</div>
                            <button class="px-3 py-1.5 bg-blue-600 text-white rounded font-medium">
                                Ver detalle
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <div class="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p class="text-sm text-slate-700">
                <strong>💡 Tip:</strong> Después de aplicar una fuente, recarga la aplicación
                (Ctrl+Shift+R) para ver todos los cambios.
            </p>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const currentFont = ref('inter') // Default

const fonts = [
    {
        id: 'inter',
        name: 'Inter',
        note: '🏆 Actual — Neutral, alta legibilidad, diseñada para UI',
        class: 'font-inter',
        cssVars: {
            ui: "'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            heading: "'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        }
    },
    {
        id: 'poppins',
        name: 'Poppins',
        note: '✨ Moderna — Geométrica, redondeada y muy amistosa',
        class: 'font-poppins',
        cssVars: {
            ui: "'Poppins', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
            heading: "'Poppins', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"
        }
    },
    {
        id: 'dmsans',
        name: 'DM Sans',
        note: '🎯 Profesional — Limpia, versátil y muy legible',
        class: 'font-dmsans',
        cssVars: {
            ui: "'DM Sans', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
            heading: "'DM Sans', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"
        }
    },
    {
        id: 'outfit',
        name: 'Outfit',
        note: '🚀 Tech — Geométrica moderna, perfecta para dashboards',
        class: 'font-outfit',
        cssVars: {
            ui: "'Outfit', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
            heading: "'Outfit', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"
        }
    },
    {
        id: 'jakarta',
        name: 'Plus Jakarta Sans',
        note: '💼 Elegante — Sofisticada y profesional, muy de moda',
        class: 'font-jakarta',
        cssVars: {
            ui: "'Plus Jakarta Sans', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
            heading: "'Plus Jakarta Sans', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"
        }
    }
]

function applyFont(fontId) {
    const selectedFont = fonts.find(f => f.id === fontId)
    if (!selectedFont) return

    currentFont.value = fontId

    // Apply CSS variables to root (guard window/document for SSR/lint)
    if (typeof window !== 'undefined' && window.document && window.document.documentElement && window.document.documentElement.style) {
        window.document.documentElement.style.setProperty('--ui-font', selectedFont.cssVars.ui)
        window.document.documentElement.style.setProperty('--heading-font', selectedFont.cssVars.heading)
    }

    // Save preference to localStorage (guard for SSR/test env)
    if (typeof localStorage !== 'undefined') {
        try { localStorage.setItem('preferred-font', fontId) } catch { /* ignore */ }
    }

    console.log(`✅ Fuente aplicada: ${selectedFont.name}`)
}

// Load saved preference on mount (guarded)
onMounted(() => {
    if (typeof localStorage !== 'undefined') {
        try {
            const savedFont = localStorage.getItem('preferred-font')
            if (savedFont) applyFont(savedFont)
        } catch { /* ignore */ }
    }
})
</script>

<style scoped>
.font-inter {
    font-family: 'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.font-poppins {
    font-family: 'Poppins', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
}

.font-dmsans {
    font-family: 'DM Sans', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
}

.font-outfit {
    font-family: 'Outfit', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
}

.font-jakarta {
    font-family: 'Plus Jakarta Sans', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
}
</style>
