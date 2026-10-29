import { applyMoves, createSolvedCubies } from './CubeState';
import { moveFromNotation, simplifyMoves, type Face } from './moves';
import { isSolved } from './solved';
import type { CubeMove } from './types';

const FACES: readonly Face[] = ['U', 'D', 'L', 'R', 'F', 'B'];
const SUFFIXES = ['', "'", '2'] as const;
const AXIS_FOR_FACE: Record<Face, 'x' | 'y' | 'z'> = {
  U: 'y', D: 'y', L: 'x', R: 'x', F: 'z', B: 'z',
};

function randomSequence(length: number): CubeMove[] {
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

/**
 * Short scrambles can accidentally cancel out (R L R' L'), so a sequence is
 * accepted only if nothing collapses and the cube really ends up scrambled.
 */
export function generateScramble(length = 22): CubeMove[] {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const moves = randomSequence(length);
    if (simplifyMoves(moves).length !== length) continue;
    if (isSolved(applyMoves(createSolvedCubies(), moves))) continue;
    return moves;
  }
  return randomSequence(length);
}
