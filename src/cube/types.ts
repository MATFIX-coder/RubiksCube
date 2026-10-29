import type { Axis, GridCoord, Mat3i, Vec3i } from '../math/discrete';

export type StickerColor = 'white' | 'yellow' | 'red' | 'orange' | 'blue' | 'green';

export interface Sticker {
  readonly normal: Vec3i;
  readonly color: StickerColor;
}

export interface CubieState {
  readonly id: string;
  readonly home: Vec3i;
  readonly position: Vec3i;
  readonly orientation: Mat3i;
  readonly stickers: readonly Sticker[];
}

export interface CubeMove {
  readonly axis: Axis;
  readonly layer: GridCoord;
  readonly quarterTurns: -2 | -1 | 1 | 2;
  readonly notation: string;
}

export type MoveSource = 'user' | 'scramble' | 'undo' | 'redo' | 'solve' | 'debug';

export interface ActiveRotation {
  readonly key: number;
  readonly move: CubeMove;
  readonly source: MoveSource;
  readonly fromAngle: number;
  readonly toAngle: number;
  readonly durationMs: number;
}
