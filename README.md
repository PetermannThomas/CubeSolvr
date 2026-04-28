# 🧊 CubeSolvr

Scan your Rubik's Cube with your camera and get a step-by-step 3D guided solution.

## Status
🚧 Work in progress — Phase 1: 3D Cube

## Features (planned)
- 📷 Camera scanning with color detection
- 🧊 Interactive 3D cube (Three.js)
- 🧠 Kociemba algorithm (≤22 moves)
- 👆 Step-by-step guided solving
- 📱 PWA — installable on mobile

## Tech Stack
- Vue 3 + Vite
- Three.js
- Tailwind CSS 4
- Pinia
- OpenCV.js (planned)
- cubejs (planned)

## Getting Started
```sh
npm install
npm run dev
```

## Project Structure
```
src/
├── components/
│   ├── cube/           # Cube 3D Three.js
│   ├── scanner/        # Caméra et détection couleurs
│   └── solver/         # Interface solution pas à pas
├── composables/        # useThreeCube, useCubeState, etc.
├── workers/            # Web workers (solver)
├── utils/              # Helpers (notation, color mapping)
├── stores/             # Pinia stores
└── views/              # Pages (Home, Scan, Solve)
```

## License
MIT
