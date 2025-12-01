<template>
  <div
    class="flex items-center gap-2 px-3 rounded cursor-pointer transition-colors duration-200"
    style="padding-top: 0.75rem; padding-bottom: 0.75rem;"
    :class="[
      active ? 'bg-blue-600 text-white font-medium' : 'hover:bg-blue-700 text-white/80',
      collapsed ? 'justify-center' : 'justify-start'
    ]"
    role="button"
    :aria-label="label"
    :title="collapsed ? label : ''"
    @click="$emit('click')"
  >
    <!-- Ícono -->
    <span class="text-xl" aria-hidden="true">{{ icon }}</span>

    <!-- Etiqueta -->
    <span v-if="!collapsed" class="text-sm truncate block max-w-[10rem]">
      {{ label }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  icon: String,
  label: String,
  active: Boolean,
  collapsed: Boolean
})

defineEmits(['click'])
</script>
