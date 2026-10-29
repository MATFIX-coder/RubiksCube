import type { Axis } from '../math/discrete';
import type { CubeMove } from './types';

export interface Direction {
  readonly axis: Axis;
  readonly sign: 1 | -1;
}

/** Which world directions the viewer currently calls Up, Front and Right. */
export interface ViewFrame {
  readonly up: Direction;
  readonly front: Direction;
  readonly right: Direction;
}

export type FaceLetter = 'U' | 'D' | 'F' | 'B' | 'R' | 'L';
export type SliceLetter = 'M' | 'E' | 'S';
export type MoveLetter = FaceLetter | SliceLetter;

export const MOVE_LETTERS: readonly MoveLetter[] = ['U', 'D', 'F', 'B', 'R', 'L', 'M', 'E', 'S'];

/** Classic orientation: white on top, green in front, red on the right. */
export const DEFAULT_FRAME: ViewFrame = {
  up: { axis: 'y', sign: 1 },
  front: { axis: 'z', sign: 1 },
  right: { axis: 'x', sign: 1 },
};

// Slice moves follow the turning direction of a reference face (WCA convention).
const SLICE_REFERENCE: Record<SliceLetter, FaceLetter> = { M: 'L', E: 'D', S: 'F' };

function flip(direction: Direction): Direction {
  return { axis: direction.axis, sign: direction.sign === 1 ? -1 : 1 };
}

function faceDirection(frame: ViewFrame, face: FaceLetter): Direction {
  switch (face) {
    case 'U': return frame.up;
    case 'D': return flip(frame.up);
    case 'F': return frame.front;
    case 'B': return flip(frame.front);
    case 'R': return frame.right;
    case 'L': return flip(frame.right);
  }
}

function isSlice(letter: MoveLetter): letter is SliceLetter {
  return letter === 'M' || letter === 'E' || letter === 'S';
}

/**
 * Picks the frame from where the camera stands: the horizontal side closest to
 * the viewer becomes Front, so keyboard moves always match what is on screen.
 */
export function frameFromCamera(x: number, z: number): ViewFrame {
  const front: Direction = Math.abs(x) > Math.abs(z)
    ? { axis: 'x', sign: x >= 0 ? 1 : -1 }
    : { axis: 'z', sign: z >= 0 ? 1 : -1 };
  // right = up(+y) x front
  const right: Direction = front.axis === 'z'
    ? { axis: 'x', sign: front.sign }
    : { axis: 'z', sign: front.sign === 1 ? -1 : 1 };
  return { up: { axis: 'y', sign: 1 }, front, right };
}

export function moveForLetter(frame: ViewFrame, letter: MoveLetter, prime: boolean, double = false): CubeMove {
  const reference = isSlice(letter) ? SLICE_REFERENCE[letter] : letter;
  const direction = faceDirection(frame, reference);
  // A clockwise turn seen from outside the face is a negative turn around its outward normal.
  const clockwise: -1 | 1 = direction.sign === 1 ? -1 : 1;
  const quarterTurns = double ? 2 : prime ? (-clockwise as -1 | 1) : clockwise;
  return {
    axis: direction.axis,
    layer: isSlice(letter) ? 0 : direction.sign,
    quarterTurns,
    notation: `${letter}${double ? '2' : prime ? "'" : ''}`,
  };
}

export function notationInFrame(frame: ViewFrame, move: Pick<CubeMove, 'axis' | 'layer' | 'quarterTurns'>): string {
  const candidates: readonly MoveLetter[] = move.layer === 0 ? ['M', 'E', 'S'] : ['U', 'D', 'F', 'B', 'R', 'L'];
  for (const letter of candidates) {
    const reference = isSlice(letter) ? SLICE_REFERENCE[letter] : letter;
    const direction = faceDirection(frame, reference);
    if (direction.axis !== move.axis) continue;
    if (move.layer !== 0 && direction.sign !== move.layer) continue;
    const clockwise = direction.sign === 1 ? -1 : 1;
    const suffix = Math.abs(move.quarterTurns) === 2 ? '2' : move.quarterTurns === clockwise ? '' : "'";
    return `${letter}${suffix}`;
  }
  return '?';
}

export function invertNotation(notation: string): string {
  if (notation.endsWith('2')) return notation;
  if (notation.endsWith("'")) return notation.slice(0, -1);
  return `${notation}'`;
}
