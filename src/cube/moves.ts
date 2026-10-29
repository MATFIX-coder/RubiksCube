import type { Axis, GridCoord } from '../math/discrete';
import { DEFAULT_FRAME, MOVE_LETTERS, invertNotation, moveForLetter, notationInFrame, type MoveLetter } from './notation';
import type { CubeMove } from './types';

export type Face = 'U' | 'D' | 'L' | 'R' | 'F' | 'B';

/** Parses standard notation (R, U', F2, M, E', S2…) in the default orientation. */
export function moveFromNotation(notation: string): CubeMove {
  const letter = notation[0] as MoveLetter;
  if (!MOVE_LETTERS.includes(letter)) throw new Error(`Unsupported move: ${notation}`);
  return moveForLetter(DEFAULT_FRAME, letter, notation.includes("'"), notation.includes('2'));
}

export function notationForMove(axis: Axis, layer: GridCoord, turns: -2 | -1 | 1 | 2): string {
  return notationInFrame(DEFAULT_FRAME, { axis, layer, quarterTurns: turns });
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
  return { ...move, quarterTurns: inverseTurns, notation: invertNotation(move.notation) };
}

/** Merges neighbouring turns of the same layer (R R → R2, R R' → nothing). */
export function simplifyMoves(moves: readonly CubeMove[]): CubeMove[] {
  const stack: CubeMove[] = [];
  for (const move of moves) {
    const top = stack[stack.length - 1];
    if (!top || top.axis !== move.axis || top.layer !== move.layer) {
      stack.push(move);
      continue;
    }
    stack.pop();
    const sum = (((top.quarterTurns + move.quarterTurns) % 4) + 4) % 4;
    if (sum !== 0) stack.push(createMove(move.axis, move.layer, sum === 3 ? -1 : sum as 1 | 2));
  }
  return stack;
}

export const BASIC_MOVES: readonly string[] = [
  'U', "U'", 'D', "D'", 'L', "L'", 'R', "R'", 'F', "F'", 'B', "B'",
];
