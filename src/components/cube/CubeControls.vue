<script setup>
import { inject } from 'vue'

const cubeApi = inject('cubeApi')

const moves = ['R', "R'", 'L', "L'", 'U', "U'", 'D', "D'", 'F', "F'", 'B', "B'"]

const handleMove = (move) => cubeApi.value?.animateMove(move)
const handleReset = () => cubeApi.value?.resetCube()
const handleScramble = () => cubeApi.value?.scrambleCube()
</script>

<template>
  <div class="flex flex-col items-center gap-3 p-4 select-none">
    <div class="grid grid-cols-6 gap-1.5">
      <button
        v-for="move in moves"
        :key="move"
        class="px-3 py-1.5 text-xs font-mono font-medium rounded-md bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 border border-zinc-800 text-zinc-200 transition-colors"
        @click="handleMove(move)"
      >
        {{ move }}
      </button>
    </div>
    <div class="flex gap-2">
      <button
        class="px-4 py-1.5 text-xs font-medium rounded-md bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 border border-zinc-800 text-zinc-300 transition-colors"
        @click="handleReset"
      >
        Reset
      </button>
      <button
        class="px-4 py-1.5 text-xs font-medium rounded-md bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 border border-zinc-800 text-zinc-300 transition-colors"
        @click="handleScramble"
      >
        Scramble
      </button>
    </div>
  </div>
</template>
