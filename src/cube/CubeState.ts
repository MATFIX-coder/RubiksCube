import { IDENTITY_MAT3, applyMat3, axisIndex, multiplyMat3, rotationMatrixQuarter, type Vec3i } from '../math/discrete';
import type { CubieState, CubeMove, Sticker, StickerColor } from './types';

const FACE_STICKERS: readonly { test: (position: Vec3i) => boolean; normal: Vec3i; color: StickerColor }[] = [
  { test: ([, y]) => y === 1, normal: [0, 1, 0], color: 'white' },
  { test: ([, y]) => y === -1, normal: [0, -1, 0], color: 'yellow' },
  { test: ([x]) => x === 1, normal: [1, 0, 0], color: 'red' },
  { test: ([x]) => x === -1, normal: [-1, 0, 0], color: 'orange' },
  { test: ([,, z]) => z === 1, normal: [0, 0, 1], color: 'green' },
  { test: ([,, z]) => z === -1, normal: [0, 0, -1], color: 'blue' },
];

function stickersFor(position: Vec3i): readonly Sticker[] {
  return FACE_STICKERS
    .filter((face) => face.test(position))
    .map(({ normal, color }) => ({ normal, color }));
}

export function createSolvedCubies(): CubieState[] {
  const cubies: CubieState[] = [];
  for (let x = -1; x <= 1; x += 1) {
    for (let y = -1; y <= 1; y += 1) {
      for (let z = -1; z <= 1; z += 1) {
        if (x === 0 && y === 0 && z === 0) continue;
        const position: Vec3i = [x, y, z];
        cubies.push({
          id: `${x}:${y}:${z}`,
          home: position,
          position,
          orientation: IDENTITY_MAT3,
          stickers: stickersFor(position),
        });
      }
    }
  }
  return cubies;
}

export function applyMove(cubies: readonly CubieState[], move: CubeMove): CubieState[] {
  const index = axisIndex(move.axis);
  const rotation = rotationMatrixQuarter(move.axis, move.quarterTurns);

  return cubies.map((cubie) => {
    if (cubie.position[index] !== move.layer) return cubie;
    return {
      ...cubie,
      position: applyMat3(rotation, cubie.position),
      orientation: multiplyMat3(rotation, cubie.orientation),
    };
  });
}

export function applyMoves(cubies: readonly CubieState[], moves: readonly CubeMove[]): CubieState[] {
  return moves.reduce<CubieState[]>((state, move) => applyMove(state, move), [...cubies]);
}
