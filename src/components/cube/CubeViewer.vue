<script setup>
import { ref } from 'vue'
import { useThreeCube } from '@/composables/useThreeCube'

const containerRef = ref(null)
const api = useThreeCube(containerRef)

defineExpose({ api })
</script>

<template>
  <div ref="containerRef" class="w-full h-full"></div>
</template>
