import { applyMat3 } from '../math/discrete';
import type { CubieState, StickerColor } from './types';

/**
 * A cube is solved when every visible face shows a single colour.
 * Comparing faces (not fixed colours) also accepts a solved cube that was
 * turned as a whole, e.g. after slice moves like M, E or S.
 */
export function isSolved(cubies: readonly CubieState[]): boolean {
  const faceColors = new Map<string, StickerColor>();
  for (const cubie of cubies) {
    for (const sticker of cubie.stickers) {
      const key = applyMat3(cubie.orientation, sticker.normal).join(',');
      const color = faceColors.get(key);
      if (color === undefined) faceColors.set(key, sticker.color);
      else if (color !== sticker.color) return false;
    }
  }
  return true;
}
