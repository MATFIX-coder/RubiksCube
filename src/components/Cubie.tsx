import { RoundedBox } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { memo } from 'react';
import type { Group } from 'three';
import type { CubieState, Sticker } from '../cube/types';
import { BODY_COLOR, CUBIE_SIZE, STICKER_COLORS, STICKER_DEPTH, STICKER_SIZE } from '../graphics/materials';
import type { Vec3i } from '../math/discrete';

interface CubieProps {
  cubie: CubieState;
  register: (id: string, group: Group | null) => void;
  onPointerDown: (event: ThreeEvent<PointerEvent>, id: string) => void;
  onPointerMove: (event: ThreeEvent<PointerEvent>, id: string) => void;
  onPointerUp: (event: ThreeEvent<PointerEvent>, id: string) => void;
}

function stickerTransform(normal: Vec3i): { position: [number, number, number]; rotation: [number, number, number] } {
  const offset = CUBIE_SIZE / 2 + STICKER_DEPTH / 2 + 0.006;
  if (normal[0] === 1) return { position: [offset, 0, 0], rotation: [0, Math.PI / 2, 0] };
  if (normal[0] === -1) return { position: [-offset, 0, 0], rotation: [0, -Math.PI / 2, 0] };
  if (normal[1] === 1) return { position: [0, offset, 0], rotation: [-Math.PI / 2, 0, 0] };
  if (normal[1] === -1) return { position: [0, -offset, 0], rotation: [Math.PI / 2, 0, 0] };
  if (normal[2] === -1) return { position: [0, 0, -offset], rotation: [0, Math.PI, 0] };
  return { position: [0, 0, offset], rotation: [0, 0, 0] };
}

function StickerMesh({ sticker }: { sticker: Sticker }) {
  const transform = stickerTransform(sticker.normal);
  return (
    <RoundedBox
      args={[STICKER_SIZE, STICKER_SIZE, STICKER_DEPTH]}
      radius={0.055}
      smoothness={4}
      position={transform.position}
      rotation={transform.rotation}
      castShadow
    >
      <meshPhysicalMaterial
        color={STICKER_COLORS[sticker.color]}
        roughness={0.17}
        metalness={0}
        clearcoat={0.78}
        clearcoatRoughness={0.13}
        envMapIntensity={1.9}
        specularIntensity={1}
        specularColor="#ffffff"
      />
    </RoundedBox>
  );
}

function CubieComponent({ cubie, register, onPointerDown, onPointerMove, onPointerUp }: CubieProps) {
  return (
    <group ref={(node) => register(cubie.id, node)}>
      <RoundedBox args={[CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE]} radius={0.075} smoothness={5} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={BODY_COLOR}
          roughness={0.22}
          metalness={0}
          clearcoat={0.68}
          clearcoatRoughness={0.18}
          envMapIntensity={1.85}
          specularIntensity={1}
          specularColor="#ffffff"
        />
      </RoundedBox>

      {cubie.stickers.map((sticker) => (
        <StickerMesh key={`${sticker.normal.join(',')}-${sticker.color}`} sticker={sticker} />
      ))}

      <mesh
        onPointerDown={(event) => onPointerDown(event, cubie.id)}
        onPointerMove={(event) => onPointerMove(event, cubie.id)}
        onPointerUp={(event) => onPointerUp(event, cubie.id)}
        onPointerCancel={(event) => onPointerUp(event, cubie.id)}
      >
        <boxGeometry args={[CUBIE_SIZE + 0.075, CUBIE_SIZE + 0.075, CUBIE_SIZE + 0.075]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

export const Cubie = memo(CubieComponent);
