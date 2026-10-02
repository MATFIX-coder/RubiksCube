import { moveFromNotation, type Face } from './moves';
import type { CubeMove } from './types';

const FACES: readonly Face[] = ['U', 'D', 'L', 'R', 'F', 'B'];
const SUFFIXES = ['', "'", '2'] as const;
const AXIS_FOR_FACE: Record<Face, 'x' | 'y' | 'z'> = {
  U: 'y', D: 'y', L: 'x', R: 'x', F: 'z', B: 'z',
};

export function generateScramble(length = 22): CubeMove[] {
  const moves: CubeMove[] = [];
  let previousFace: Face | null = null;
  let previousAxis: 'x' | 'y' | 'z' | null = null;

  while (moves.length < length) {
    const face = FACES[Math.floor(Math.random() * FACES.length)]!;
    const axis = AXIS_FOR_FACE[face];
    if (face === previousFace) continue;
    if (axis === previousAxis && Math.random() < 0.55) continue;

    const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)]!;
    moves.push(moveFromNotation(`${face}${suffix}`));
    previousFace = face;
    previousAxis = axis;
  }

  return moves;
}
