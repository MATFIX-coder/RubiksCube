import { applyMat3, sameVec, type Vec3i } from '../math/discrete';
import type { CubieState, StickerColor } from './types';

const EXPECTED_NORMAL: Record<StickerColor, Vec3i> = {
  white: [0, 1, 0],
  yellow: [0, -1, 0],
  red: [1, 0, 0],
  orange: [-1, 0, 0],
  green: [0, 0, 1],
  blue: [0, 0, -1],
};

export function isSolved(cubies: readonly CubieState[]): boolean {
  return cubies.every((cubie) => cubie.stickers.every((sticker) => {
    const worldNormal = applyMat3(cubie.orientation, sticker.normal);
    return sameVec(worldNormal, EXPECTED_NORMAL[sticker.color]);
  }));
}
