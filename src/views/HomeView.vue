<script setup>
import { ref, computed, provide } from 'vue'
import CubeViewer from '@/components/cube/CubeViewer.vue'
import CubeControls from '@/components/cube/CubeControls.vue'

const viewerRef = ref(null)
const cubeApi = computed(() => viewerRef.value?.api ?? null)
provide('cubeApi', cubeApi)
</script>

<template>
  <div class="w-screen h-screen flex flex-col bg-[#09090b] overflow-hidden">
    <div class="flex-1 min-h-0">
      <CubeViewer ref="viewerRef" />
    </div>
    <CubeControls class="shrink-0" />
  </div>
</template>
