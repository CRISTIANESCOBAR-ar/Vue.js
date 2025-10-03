<template>
  <div
    @click="$emit('click')"
    :class="[
      'flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition',
      active ? 'bg-blue-600 font-semibold' : 'hover:bg-blue-700'
    ]"
  >
    <span class="text-lg">{{ icon }}</span>
    <span>{{ label }}</span>
  </div>
</template>

<script setup>
defineProps({
  icon: String,
  label: String,
  active: Boolean
})
</script>