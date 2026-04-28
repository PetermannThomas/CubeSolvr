import { defineStore } from 'pinia'
import { ref } from 'vue'

const FACE_ORDER = ['U', 'R', 'F', 'D', 'L', 'B']

const SOLVED_FACE_COLORS = {
  U: 'white',
  R: 'red',
  F: 'green',
  D: 'yellow',
  L: 'orange',
  B: 'blue',
}

const buildSolvedState = () => {
  const state = []
  for (const face of FACE_ORDER) {
    for (let i = 0; i < 9; i++) state.push(SOLVED_FACE_COLORS[face])
  }
  return state
}

export const useCubeStore = defineStore('cube', () => {
  const cubeState = ref(buildSolvedState())

  const setCubeState = (newState) => {
    cubeState.value = [...newState]
  }

  const setFacelet = (index, color) => {
    const next = [...cubeState.value]
    next[index] = color
    cubeState.value = next
  }

  const resetCube = () => {
    cubeState.value = buildSolvedState()
  }

  return { cubeState, setCubeState, setFacelet, resetCube }
})

export const FACE_OFFSETS = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 }
