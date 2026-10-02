export type Axis = 'x' | 'y' | 'z';
export type GridCoord = -1 | 0 | 1;
export type Vec3i = readonly [number, number, number];
export type Mat3i = readonly [
  number, number, number,
  number, number, number,
  number, number, number,
];

export const IDENTITY_MAT3: Mat3i = [
  1, 0, 0,
  0, 1, 0,
  0, 0, 1,
];

export function axisIndex(axis: Axis): 0 | 1 | 2 {
  if (axis === 'x') return 0;
  if (axis === 'y') return 1;
  return 2;
}

export function rotateVectorQuarter(v: Vec3i, axis: Axis, turns: number): Vec3i {
  const normalized = ((turns % 4) + 4) % 4;
  let result: Vec3i = [v[0], v[1], v[2]];

  for (let i = 0; i < normalized; i += 1) {
    const [x, y, z] = result;
    if (axis === 'x') result = [x, -z, y];
    else if (axis === 'y') result = [z, y, -x];
    else result = [-y, x, z];
  }

  return result;
}

export function rotationMatrixQuarter(axis: Axis, turns: number): Mat3i {
  const ex = rotateVectorQuarter([1, 0, 0], axis, turns);
  const ey = rotateVectorQuarter([0, 1, 0], axis, turns);
  const ez = rotateVectorQuarter([0, 0, 1], axis, turns);

  return [
    ex[0], ey[0], ez[0],
    ex[1], ey[1], ez[1],
    ex[2], ey[2], ez[2],
  ];
}

export function multiplyMat3(a: Mat3i, b: Mat3i): Mat3i {
  const out = new Array<number>(9).fill(0);
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      let sum = 0;
      for (let k = 0; k < 3; k += 1) {
        sum += a[row * 3 + k]! * b[k * 3 + col]!;
      }
      out[row * 3 + col] = Math.round(sum);
    }
  }
  return out as unknown as Mat3i;
}

export function applyMat3(m: Mat3i, v: Vec3i): Vec3i {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}

export function sameVec(a: Vec3i, b: Vec3i): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
