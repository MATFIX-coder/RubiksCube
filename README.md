# Rubik's Cube — Premium WebGL

Local interactive 3D Rubik's Cube built with React, TypeScript, Three.js, React Three Fiber and drei.

## Run

```bash
npm install
npm run dev
```

On Windows PowerShell with script execution restricted, use the equivalent commands without changing Execution Policy:

```powershell
npm.cmd install
npm.cmd run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Interaction

- Drag outside the cube: orbit camera.
- Drag a cubie surface: rotate the corresponding row/column/slice.
- Scramble: generates a valid 22-move sequence without immediate same-face cancellation.
- Undo: reverses user moves from move history.
- Reset: cancels animation/queue and restores exact solved state.

## Architecture

The cube uses an integer grid model as the source of truth. Cubie positions are always one of `-1 / 0 / 1`. Cubie orientation is a discrete integer 3×3 rotation matrix. Visual transforms are rebuilt from that state after every completed move; no floating-point transform is accumulated across moves.

During animation, only a transient quaternion is composed over the current logical state. On completion, the move is committed to the discrete model and the render snaps to the exact state.

## v1.1 interaction/graphics pass

- UI intentionally unchanged.
- Stronger glossy plastic reflections without metallic shading.
- Middle-slice drag support (`M`, `E`, `S`) through the same physical gesture model.
- Gesture axis/layer locks after the initial drag direction is established, preventing a curved drag from jumping to another slice.
