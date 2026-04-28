import { onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useCubeStore, FACE_OFFSETS } from '@/stores/cubeStore'

const COLOR_HEX = {
  white: 0xffffff,
  yellow: 0xffd500,
  red: 0xb71234,
  orange: 0xff5800,
  green: 0x009b48,
  blue: 0x0046ad,
}

const BACKGROUND_COLOR = 0x09090b
const CUBIE_BODY_COLOR = 0x1a1a1a

const CUBIE_SIZE = 1
const GAP = 0.05
const SPACING = CUBIE_SIZE + GAP
const STICKER_SIZE = 0.9
const STICKER_OFFSET = CUBIE_SIZE / 2 + 0.001

const FACE_AXES = {
  U: { axis: 'y', sign: 1 },
  D: { axis: 'y', sign: -1 },
  R: { axis: 'x', sign: 1 },
  L: { axis: 'x', sign: -1 },
  F: { axis: 'z', sign: 1 },
  B: { axis: 'z', sign: -1 },
}

const ALL_MOVES = ['R', "R'", 'L', "L'", 'U', "U'", 'D', "D'", 'F', "F'", 'B', "B'"]

const ANIMATION_DURATION_MS = 300
const CAMERA_RESET_DURATION_MS = 500
const INITIAL_CAMERA_POSITION = [5, 5, 7]
const INITIAL_CAMERA_TARGET = [0, 0, 0]

const faceletIndex = (face, cx, cy, cz) => {
  switch (face) {
    case 'U':
      return FACE_OFFSETS.U + (cz + 1) * 3 + (cx + 1)
    case 'D':
      return FACE_OFFSETS.D + (1 - cz) * 3 + (cx + 1)
    case 'F':
      return FACE_OFFSETS.F + (1 - cy) * 3 + (cx + 1)
    case 'B':
      return FACE_OFFSETS.B + (1 - cy) * 3 + (1 - cx)
    case 'R':
      return FACE_OFFSETS.R + (1 - cy) * 3 + (1 - cz)
    case 'L':
      return FACE_OFFSETS.L + (1 - cy) * 3 + (cz + 1)
    default:
      return 0
  }
}

const parseMove = (move) => ({
  face: move[0],
  prime: move.length > 1 && move[1] === "'",
})

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

export function useThreeCube(containerRef) {
  const store = useCubeStore()

  let scene = null
  let camera = null
  let renderer = null
  let controls = null
  let cubies = []
  let stickers = []
  let cubieBodyMaterial = null
  let cubieGeometry = null
  let stickerGeometry = null
  let resizeObserver = null
  let frameId = 0
  let animating = false

  const buildCube = () => {
    cubieGeometry = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE)
    cubieBodyMaterial = new THREE.MeshStandardMaterial({
      color: CUBIE_BODY_COLOR,
      roughness: 0.7,
      metalness: 0.05,
    })
    stickerGeometry = new THREE.PlaneGeometry(STICKER_SIZE, STICKER_SIZE)

    for (let cx = -1; cx <= 1; cx++) {
      for (let cy = -1; cy <= 1; cy++) {
        for (let cz = -1; cz <= 1; cz++) {
          if (cx === 0 && cy === 0 && cz === 0) continue
          const cubie = new THREE.Mesh(cubieGeometry, cubieBodyMaterial)
          cubie.position.set(cx * SPACING, cy * SPACING, cz * SPACING)
          cubie.userData = { cx, cy, cz }

          for (const [face, { axis, sign }] of Object.entries(FACE_AXES)) {
            const coord = axis === 'x' ? cx : axis === 'y' ? cy : cz
            if (coord !== sign) continue

            const stickerMaterial = new THREE.MeshBasicMaterial({
              color: 0xffffff,
              side: THREE.FrontSide,
            })
            const sticker = new THREE.Mesh(stickerGeometry, stickerMaterial)

            if (axis === 'x') {
              sticker.position.x = sign * STICKER_OFFSET
              sticker.rotation.y = sign > 0 ? Math.PI / 2 : -Math.PI / 2
            } else if (axis === 'y') {
              sticker.position.y = sign * STICKER_OFFSET
              sticker.rotation.x = sign > 0 ? -Math.PI / 2 : Math.PI / 2
            } else {
              sticker.position.z = sign * STICKER_OFFSET
              if (sign < 0) sticker.rotation.y = Math.PI
            }

            cubie.add(sticker)
            stickers.push({ mesh: sticker, face, cx, cy, cz })
          }

          scene.add(cubie)
          cubies.push(cubie)
        }
      }
    }

    updateColors()
  }

  const updateColors = () => {
    const state = store.cubeState
    for (const { mesh, face, cx, cy, cz } of stickers) {
      const colorName = state[faceletIndex(face, cx, cy, cz)]
      const hex = COLOR_HEX[colorName] ?? 0x000000
      mesh.material.color.setHex(hex)
    }
  }

  const handleResize = () => {
    const container = containerRef.value
    if (!container || !renderer || !camera) return
    const width = container.clientWidth
    const height = container.clientHeight
    if (width === 0 || height === 0) return
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }

  const renderLoop = () => {
    frameId = requestAnimationFrame(renderLoop)
    if (controls) controls.update()
    if (renderer && scene && camera) renderer.render(scene, camera)
  }

  const setup = () => {
    const container = containerRef.value
    if (!container) return

    const width = container.clientWidth || 1
    const height = container.clientHeight || 1

    scene = new THREE.Scene()
    scene.background = new THREE.Color(BACKGROUND_COLOR)

    camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
    camera.position.set(...INITIAL_CAMERA_POSITION)
    camera.lookAt(...INITIAL_CAMERA_TARGET)

    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.75))
    const dir = new THREE.DirectionalLight(0xffffff, 0.6)
    dir.position.set(5, 10, 7)
    scene.add(dir)

    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.1
    controls.enablePan = false
    controls.minDistance = 5
    controls.maxDistance = 20

    buildCube()

    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    renderLoop()
  }

  const animateMove = (move) =>
    new Promise((resolve) => {
      if (animating || !scene) {
        resolve()
        return
      }
      const parsed = parseMove(move)
      if (!FACE_AXES[parsed.face]) {
        resolve()
        return
      }
      animating = true

      const { face, prime } = parsed
      const { axis, sign } = FACE_AXES[face]
      const targetAngle = (prime ? -1 : 1) * sign * (Math.PI / 2)

      const worldPos = new THREE.Vector3()
      const layerCubies = cubies.filter((cubie) => {
        cubie.getWorldPosition(worldPos)
        return Math.abs(worldPos[axis] - sign * SPACING) < SPACING / 2
      })

      const pivot = new THREE.Object3D()
      scene.add(pivot)
      for (const cubie of layerCubies) pivot.attach(cubie)

      const startTime = performance.now()

      const step = () => {
        const elapsed = performance.now() - startTime
        const t = Math.min(1, elapsed / ANIMATION_DURATION_MS)
        const eased = easeOutCubic(t)
        pivot.rotation[axis] = targetAngle * eased

        if (t < 1) {
          requestAnimationFrame(step)
        } else {
          for (const cubie of [...layerCubies]) scene.attach(cubie)
          scene.remove(pivot)
          animating = false
          resolve()
        }
      }
      requestAnimationFrame(step)
    })

  const scrambleCube = async () => {
    let last = ''
    for (let i = 0; i < 20; i++) {
      let move = ALL_MOVES[Math.floor(Math.random() * ALL_MOVES.length)]
      while (move[0] === last) {
        move = ALL_MOVES[Math.floor(Math.random() * ALL_MOVES.length)]
      }
      last = move[0]
      await animateMove(move)
    }
  }

  const resetVisualPositions = () => {
    for (const cubie of cubies) {
      const { cx, cy, cz } = cubie.userData
      cubie.position.set(cx * SPACING, cy * SPACING, cz * SPACING)
      cubie.rotation.set(0, 0, 0)
      cubie.quaternion.set(0, 0, 0, 1)
      cubie.scale.set(1, 1, 1)
      cubie.updateMatrix()
    }
  }

  const resetCube = () => {
    if (animating) return
    store.resetCube()
    resetVisualPositions()
    updateColors()
  }

  const resetCamera = () => {
    if (!camera || !controls) return
    const startPos = camera.position.clone()
    const startTarget = controls.target.clone()
    const targetPos = new THREE.Vector3(...INITIAL_CAMERA_POSITION)
    const targetTarget = new THREE.Vector3(...INITIAL_CAMERA_TARGET)
    const startTime = performance.now()

    const step = () => {
      const elapsed = performance.now() - startTime
      const t = Math.min(1, elapsed / CAMERA_RESET_DURATION_MS)
      const eased = easeOutCubic(t)
      camera.position.lerpVectors(startPos, targetPos, eased)
      controls.target.lerpVectors(startTarget, targetTarget, eased)
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  const dispose = () => {
    if (frameId) cancelAnimationFrame(frameId)
    resizeObserver?.disconnect()
    controls?.dispose()
    if (scene) {
      scene.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry?.dispose?.()
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
          else obj.material?.dispose?.()
        }
      })
    }
    renderer?.dispose()
    renderer?.domElement?.remove()
    cubies = []
    stickers = []
    scene = null
    camera = null
    renderer = null
    controls = null
  }

  watch(
    () => store.cubeState,
    () => {
      if (scene && !animating) updateColors()
    },
    { deep: true },
  )

  onMounted(setup)
  onBeforeUnmount(dispose)

  return { animateMove, scrambleCube, resetCube, resetCamera, updateColors }
}
