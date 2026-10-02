import type { Axis, GridCoord } from '../math/discrete';
import type { CubeMove } from './types';

const FACE_MAP = {
  R: { axis: 'x', layer: 1, base: -1 },
  L: { axis: 'x', layer: -1, base: 1 },
  U: { axis: 'y', layer: 1, base: -1 },
  D: { axis: 'y', layer: -1, base: 1 },
  F: { axis: 'z', layer: 1, base: -1 },
  B: { axis: 'z', layer: -1, base: 1 },
} as const;

export type Face = keyof typeof FACE_MAP;

function clampQuarterTurns(value: number): -2 | -1 | 1 | 2 {
  if (value === 2 || value === -2) return 2;
  return value >= 0 ? 1 : -1;
}

export function moveFromNotation(notation: string): CubeMove {
  const face = notation[0] as Face;
  const mapping = FACE_MAP[face];
  if (!mapping) throw new Error(`Unsupported move: ${notation}`);

  const isDouble = notation.includes('2');
  const isPrime = notation.includes("'");
  const quarterTurns = isDouble
    ? 2
    : clampQuarterTurns(mapping.base * (isPrime ? -1 : 1));

  return {
    axis: mapping.axis,
    layer: mapping.layer,
    quarterTurns,
    notation: `${face}${isDouble ? '2' : isPrime ? "'" : ''}`,
  };
}

export function notationForMove(axis: Axis, layer: GridCoord, turns: -2 | -1 | 1 | 2): string {
  const absDouble = Math.abs(turns) === 2;

  if (layer === 0) {
    const middle = axis === 'x' ? 'M' : axis === 'y' ? 'E' : 'S';
    const conventionalBase = axis === 'z' ? -1 : 1;
    const prime = turns !== 2 && turns !== -2 && Math.sign(turns) !== conventionalBase;
    return `${middle}${absDouble ? '2' : prime ? "'" : ''}`;
  }

  let face: Face;
  let base: number;
  if (axis === 'x') {
    face = layer === 1 ? 'R' : 'L';
    base = layer === 1 ? -1 : 1;
  } else if (axis === 'y') {
    face = layer === 1 ? 'U' : 'D';
    base = layer === 1 ? -1 : 1;
  } else {
    face = layer === 1 ? 'F' : 'B';
    base = layer === 1 ? -1 : 1;
  }

  const prime = !absDouble && Math.sign(turns) !== base;
  return `${face}${absDouble ? '2' : prime ? "'" : ''}`;
}

export function createMove(axis: Axis, layer: GridCoord, turns: -2 | -1 | 1 | 2): CubeMove {
  return {
    axis,
    layer,
    quarterTurns: turns,
    notation: notationForMove(axis, layer, turns),
  };
}

export function inverseMove(move: CubeMove): CubeMove {
  const inverseTurns = Math.abs(move.quarterTurns) === 2
    ? move.quarterTurns
    : (move.quarterTurns * -1) as -1 | 1;
  return createMove(move.axis, move.layer, inverseTurns);
}

export const BASIC_MOVES: readonly string[] = [
  'U', "U'", 'D', "D'", 'L', "L'", 'R', "R'", 'F', "F'", 'B', "B'",
];
