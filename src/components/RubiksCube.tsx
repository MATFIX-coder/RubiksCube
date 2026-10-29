import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Matrix4, Plane, Quaternion, Ray, Vector3, type Group } from 'three';
import type { ActiveRotation, CubieState, CubeMove } from '../cube/types';
import { CUBIE_SPACING } from '../graphics/materials';
import { detectFaceDragLock, projectLockedFaceDrag, snapNormalToAxis, type GestureLock } from '../interaction/gesture';
import { axisIndex, type Axis } from '../math/discrete';
import { Cubie } from './Cubie';

interface RubiksCubeProps {
  cubies: readonly CubieState[];
  activeRotation: ActiveRotation | null;
  interactionEnabled: boolean;
  celebrateKey: number;
  onGestureCommit: (move: CubeMove, fromAngle: number) => void;
  onRotationComplete: (rotation: ActiveRotation) => void;
  onOrbitLockChange: (locked: boolean) => void;
}

export const CELEBRATION_MS = 1350;

interface DragState {
  readonly cubieId: string;
  readonly pointerId: number;
  readonly plane: Plane;
  readonly startPoint: Vector3;
  readonly faceNormal: Vector3;
  lock: GestureLock | null;
  projection: { move: CubeMove; angle: number } | null;
}

interface SettleState {
  readonly move: CubeMove;
  readonly fromAngle: number;
  elapsedMs: number;
}

const tmpPosition = new Vector3();
const tmpQuaternion = new Quaternion();
const tmpRotationQuaternion = new Quaternion();
const tmpMatrix = new Matrix4();
const tmpPoint = new Vector3();
const axisVectors: Record<Axis, Vector3> = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1),
};

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function quaternionFromCubie(cubie: CubieState, target: Quaternion): Quaternion {
  const m = cubie.orientation;
  tmpMatrix.set(
    m[0], m[1], m[2], 0,
    m[3], m[4], m[5], 0,
    m[6], m[7], m[8], 0,
    0, 0, 0, 1,
  );
  return target.setFromRotationMatrix(tmpMatrix).normalize();
}

function intersectRayPlane(ray: Ray, plane: Plane): Vector3 | null {
  return ray.intersectPlane(plane, tmpPoint);
}

export function RubiksCube({
  cubies,
  activeRotation,
  interactionEnabled,
  celebrateKey,
  onGestureCommit,
  onRotationComplete,
  onOrbitLockChange,
}: RubiksCubeProps) {
  const refs = useRef(new Map<string, Group>());
  const spinRef = useRef<Group>(null);
  const celebrateRef = useRef<{ elapsedMs: number } | null>(null);
  const lastCelebrateKey = useRef(celebrateKey);
  const dragRef = useRef<DragState | null>(null);
  const previewRef = useRef<{ move: CubeMove; angle: number } | null>(null);
  const settleRef = useRef<SettleState | null>(null);
  const animationRef = useRef<{ key: number; elapsedMs: number; completed: boolean } | null>(null);
  const introRef = useRef(0);

  const cubiesById = useMemo(() => new Map(cubies.map((cubie) => [cubie.id, cubie])), [cubies]);

  useEffect(() => {
    if (activeRotation) {
      animationRef.current = { key: activeRotation.key, elapsedMs: 0, completed: false };
      settleRef.current = null;
      previewRef.current = null;
    } else {
      animationRef.current = null;
    }
  }, [activeRotation]);

  useEffect(() => () => onOrbitLockChange(false), [onOrbitLockChange]);

  useEffect(() => {
    if (celebrateKey === lastCelebrateKey.current) return;
    lastCelebrateKey.current = celebrateKey;
    celebrateRef.current = { elapsedMs: 0 };
  }, [celebrateKey]);

  const register = (id: string, group: Group | null) => {
    if (group) refs.current.set(id, group);
    else refs.current.delete(id);
  };

  const handlePointerDown = (event: ThreeEvent<PointerEvent>, id: string) => {
    if (!interactionEnabled || activeRotation || celebrateRef.current) return;
    const cubie = cubiesById.get(id);
    if (!cubie || !event.face) return;

    event.stopPropagation();
    (event.target as unknown as Element).setPointerCapture(event.pointerId);
    const worldNormal = snapNormalToAxis(event.face.normal.clone().transformDirection(event.object.matrixWorld));
    const startPoint = event.point.clone();
    dragRef.current = {
      cubieId: id,
      pointerId: event.pointerId,
      plane: new Plane().setFromNormalAndCoplanarPoint(worldNormal, startPoint),
      startPoint,
      faceNormal: worldNormal,
      lock: null,
      projection: null,
    };
    previewRef.current = null;
    settleRef.current = null;
    onOrbitLockChange(true);
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>, id: string) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || drag.cubieId !== id || activeRotation) return;
    const cubie = cubiesById.get(id);
    if (!cubie) return;

    event.stopPropagation();
    const hit = intersectRayPlane(event.ray, drag.plane);
    if (!hit) return;
    const delta = hit.clone().sub(drag.startPoint);

    if (!drag.lock) {
      drag.lock = detectFaceDragLock(drag.faceNormal, cubie.position, delta);
      if (!drag.lock) return;
    }

    const projection = projectLockedFaceDrag(drag.lock, delta);
    drag.projection = { move: projection.move, angle: projection.angle };
    previewRef.current = drag.projection;
  };

  const releasePointer = (event: ThreeEvent<PointerEvent>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    (event.target as unknown as Element).releasePointerCapture(event.pointerId);
    dragRef.current = null;
    onOrbitLockChange(false);

    const projection = drag.projection;
    if (!projection) {
      previewRef.current = null;
      return;
    }

    const commitThreshold = Math.PI / 10;
    if (Math.abs(projection.angle) >= commitThreshold) {
      previewRef.current = null;
      onGestureCommit(projection.move, projection.angle);
    } else {
      settleRef.current = { move: projection.move, fromAngle: projection.angle, elapsedMs: 0 };
      previewRef.current = null;
    }
  };

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => releasePointer(event);

  useFrame((_, deltaSeconds) => {
    introRef.current = Math.min(1, introRef.current + deltaSeconds / 0.55);
    const introScale = 0.965 + 0.035 * easeInOutCubic(introRef.current);

    // Victory lap: one smooth turn around the vertical axis with a gentle lift.
    const spin = spinRef.current;
    if (spin) {
      const celebrate = celebrateRef.current;
      if (celebrate) {
        celebrate.elapsedMs += deltaSeconds * 1000;
        const t = Math.min(1, celebrate.elapsedMs / CELEBRATION_MS);
        const lift = Math.sin(Math.PI * t);
        spin.rotation.y = Math.PI * 2 * easeInOutCubic(t);
        spin.position.y = 0.22 * lift;
        spin.scale.setScalar(1 + 0.035 * lift);
        if (t >= 1) celebrateRef.current = null;
      } else if (spin.rotation.y !== 0) {
        spin.rotation.y = 0;
        spin.position.y = 0;
        spin.scale.setScalar(1);
      }
    }

    let rotationMove: CubeMove | null = null;
    let rotationAngle = 0;

    if (activeRotation) {
      const state = animationRef.current;
      if (state && state.key === activeRotation.key) {
        state.elapsedMs += deltaSeconds * 1000;
        const t = Math.min(1, state.elapsedMs / activeRotation.durationMs);
        const eased = easeInOutCubic(t);
        rotationAngle = activeRotation.fromAngle + (activeRotation.toAngle - activeRotation.fromAngle) * eased;
        rotationMove = activeRotation.move;

        if (t >= 1 && !state.completed) {
          state.completed = true;
          queueMicrotask(() => onRotationComplete(activeRotation));
        }
      }
    } else if (previewRef.current) {
      rotationMove = previewRef.current.move;
      rotationAngle = previewRef.current.angle;
    } else if (settleRef.current) {
      const settle = settleRef.current;
      settle.elapsedMs += deltaSeconds * 1000;
      const t = Math.min(1, settle.elapsedMs / 115);
      rotationMove = settle.move;
      rotationAngle = settle.fromAngle * (1 - easeInOutCubic(t));
      if (t >= 1) settleRef.current = null;
    }

    const rotatingAxisIndex = rotationMove ? axisIndex(rotationMove.axis) : 0;
    if (rotationMove) {
      tmpRotationQuaternion.setFromAxisAngle(axisVectors[rotationMove.axis], rotationAngle).normalize();
    } else {
      tmpRotationQuaternion.identity();
    }

    for (const cubie of cubies) {
      const group = refs.current.get(cubie.id);
      if (!group) continue;

      tmpPosition.set(
        cubie.position[0] * CUBIE_SPACING,
        cubie.position[1] * CUBIE_SPACING,
        cubie.position[2] * CUBIE_SPACING,
      );
      quaternionFromCubie(cubie, tmpQuaternion);

      const isRotating = rotationMove !== null && cubie.position[rotatingAxisIndex] === rotationMove.layer;
      if (isRotating) {
        tmpPosition.applyQuaternion(tmpRotationQuaternion);
        tmpQuaternion.premultiply(tmpRotationQuaternion).normalize();
      }

      group.position.copy(tmpPosition);
      group.quaternion.copy(tmpQuaternion);
      group.scale.setScalar(introScale);
    }
  });

  return (
    <group position={[0, 0.18, 0]}>
      <group ref={spinRef}>
        <mesh scale={1.43}>
          <boxGeometry args={[1.12, 1.12, 1.12]} />
          <meshPhysicalMaterial color="#070809" roughness={0.5} metalness={0} />
        </mesh>
        {cubies.map((cubie) => (
          <Cubie
            key={cubie.id}
            cubie={cubie}
            register={register}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        ))}
      </group>
    </group>
  );
}
