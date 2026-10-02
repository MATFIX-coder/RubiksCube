import { Vector3 } from 'three';
import type { Axis, GridCoord, Vec3i } from '../math/discrete';
import { createMove } from '../cube/moves';
import type { CubeMove } from '../cube/types';

const AXIS_VECTORS: Record<Axis, Vector3> = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1),
};

const LOCK_DRAG_DISTANCE = 0.045;
const MIN_DIRECTION_CONFIDENCE = 0.58;
const ANGLE_PER_WORLD_UNIT = 1.55;
const MAX_PREVIEW_ANGLE = Math.PI * 0.47;

function dominantAxis(vector: Vector3): Axis {
  const ax = Math.abs(vector.x);
  const ay = Math.abs(vector.y);
  return ax > ay && ax > Math.abs(vector.z) ? 'x' : ay > Math.abs(vector.z) ? 'y' : 'z';
}

export function snapNormalToAxis(normal: Vector3): Vector3 {
  const axis = dominantAxis(normal);
  const sign = Math.sign(normal[axis]) || 1;
  return AXIS_VECTORS[axis].clone().multiplyScalar(sign);
}

export interface GestureLock {
  readonly axis: Axis;
  readonly layer: GridCoord;
  readonly positiveTangent: Vector3;
  readonly confidence: number;
}

export interface GestureProjection {
  readonly move: CubeMove;
  readonly angle: number;
  readonly confidence: number;
}

/**
 * Picks the slice only once, at the beginning of a drag.
 * After this lock is created the gesture can reverse direction, but it can no
 * longer jump to another axis/layer when the pointer path curves.
 */
export function detectFaceDragLock(
  faceNormal: Vector3,
  cubiePosition: Vec3i,
  drag: Vector3,
): GestureLock | null {
  const dragLength = drag.length();
  if (dragLength < LOCK_DRAG_DISTANCE) return null;

  const n = snapNormalToAxis(faceNormal);
  const normalAxis = dominantAxis(n);
  const candidates = (['x', 'y', 'z'] as const).filter((axis) => axis !== normalAxis);
  const r = new Vector3(cubiePosition[0], cubiePosition[1], cubiePosition[2]);
  const d = drag.clone().normalize();

  let best: { axis: Axis; tangent: Vector3; score: number } | null = null;

  for (const axis of candidates) {
    // +90 degrees around this axis moves the touched point along axis x radius.
    // Project that velocity into the touched face plane to get the visible drag tangent.
    const tangent = new Vector3().crossVectors(AXIS_VECTORS[axis], r);
    tangent.addScaledVector(n, -tangent.dot(n));
    if (tangent.lengthSq() < 1e-6) continue;
    tangent.normalize();

    const score = Math.abs(tangent.dot(d));
    if (!best || score > best.score) best = { axis, tangent, score };
  }

  if (!best || best.score < MIN_DIRECTION_CONFIDENCE) return null;

  const axisIndex = best.axis === 'x' ? 0 : best.axis === 'y' ? 1 : 2;
  return {
    axis: best.axis,
    layer: cubiePosition[axisIndex] as GridCoord,
    positiveTangent: best.tangent,
    confidence: best.score,
  };
}

export function projectLockedFaceDrag(lock: GestureLock, drag: Vector3): GestureProjection {
  const signedDistance = drag.dot(lock.positiveTangent);
  const rawAngle = signedDistance * ANGLE_PER_WORLD_UNIT;
  const angle = Math.max(-MAX_PREVIEW_ANGLE, Math.min(MAX_PREVIEW_ANGLE, rawAngle));
  const direction: -1 | 1 = angle < 0 ? -1 : 1;

  return {
    move: createMove(lock.axis, lock.layer, direction),
    angle,
    confidence: lock.confidence,
  };
}
