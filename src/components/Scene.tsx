import { ContactShadows, Environment, Lightformer, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import { frameFromCamera, type ViewFrame } from '../cube/notation';
import type { ActiveRotation, CubieState, CubeMove } from '../cube/types';
import { RubiksCube } from './RubiksCube';

interface SceneProps {
  cubies: readonly CubieState[];
  activeRotation: ActiveRotation | null;
  interactionEnabled: boolean;
  solvedPulse: number;
  cubeKey: number;
  onGestureCommit: (move: CubeMove, fromAngle: number) => void;
  onRotationComplete: (rotation: ActiveRotation) => void;
  onFrameSource: (source: () => ViewFrame) => void;
}

/** Lets the UI ask which side of the cube currently faces the viewer. */
function ViewFrameProbe({ onFrameSource }: { onFrameSource: (source: () => ViewFrame) => void }) {
  const camera = useThree((state) => state.camera);
  useEffect(() => {
    onFrameSource(() => frameFromCamera(camera.position.x, camera.position.z));
  }, [camera, onFrameSource]);
  return null;
}

export function Scene({
  cubies,
  activeRotation,
  interactionEnabled,
  solvedPulse,
  cubeKey,
  onGestureCommit,
  onRotationComplete,
  onFrameSource,
}: SceneProps) {
  const [orbitLocked, setOrbitLocked] = useState(false);
  const { size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  // Keep at least ~31° horizontally so the cube never gets cropped on tall phone screens.
  const fitWidthFov = (2 * Math.atan(Math.tan((31 / 2) * Math.PI / 180) / aspect) * 180) / Math.PI;
  const cameraFov = Math.min(64, Math.max(31, fitWidthFov));

  return (
    <>
      <PerspectiveCamera makeDefault position={[5.7, 4.7, 6.6]} fov={cameraFov} near={0.1} far={100} />
      <ViewFrameProbe onFrameSource={onFrameSource} />
      <OrbitControls
        makeDefault
        enabled={!orbitLocked && !activeRotation}
        enablePan={false}
        enableDamping
        dampingFactor={0.075}
        rotateSpeed={0.68}
        zoomSpeed={0.72}
        minDistance={6.6}
        maxDistance={10.8}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI - 0.28}
        target={[0, 0.08, 0]}
      />

      <ambientLight intensity={0.17} />
      <directionalLight
        position={[4.5, 7.5, 5.2]}
        intensity={1.68}
        castShadow
        shadow-mapSize-width={1536}
        shadow-mapSize-height={1536}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0002}
      />
      <pointLight key={`light-${solvedPulse}`} position={[-3, 3.2, 4]} intensity={solvedPulse > 0 ? 0.75 : 0.25} distance={10} decay={2} />

      <Environment resolution={512} background={false}>
        <Lightformer form="rect" intensity={5.2} position={[0, 5, -7]} scale={[8, 8, 1]} />
        <Lightformer form="rect" intensity={4.6} position={[-5, 1, 3]} rotation={[0, Math.PI / 2, 0]} scale={[5, 7, 1]} />
        <Lightformer form="rect" intensity={3.8} position={[5, 0, 2]} rotation={[0, -Math.PI / 2, 0]} scale={[4, 5, 1]} />
        <Lightformer form="rect" intensity={5.8} position={[-3.8, 3.1, -1.6]} rotation={[0, Math.PI / 2.7, 0]} scale={[1.15, 5.6, 1]} />
        <Lightformer form="rect" intensity={4.5} position={[3.4, 2.3, 4.2]} rotation={[0, -Math.PI / 3.1, 0]} scale={[0.85, 4.8, 1]} />
        <Lightformer form="ring" intensity={1.45} position={[0, -2, 4]} scale={[4, 4, 1]} />
      </Environment>

      <RubiksCube
        key={`cube-${cubeKey}`}
        cubies={cubies}
        activeRotation={activeRotation}
        interactionEnabled={interactionEnabled}
        celebrateKey={solvedPulse}
        onGestureCommit={onGestureCommit}
        onRotationComplete={onRotationComplete}
        onOrbitLockChange={setOrbitLocked}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.47, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#f2f2ee" roughness={0.97} metalness={0} />
      </mesh>
      <ContactShadows
        position={[0, -1.455, 0]}
        opacity={0.43}
        scale={8}
        blur={2.45}
        far={4.8}
        resolution={768}
      />
    </>
  );
}
