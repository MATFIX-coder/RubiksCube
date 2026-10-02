import { Canvas } from '@react-three/fiber';
import { Suspense, useRef, useState } from 'react';
import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace } from 'three';
import { Controls } from './components/Controls';
import { Scene } from './components/Scene';
import { applyMove, createSolvedCubies } from './cube/CubeState';
import { inverseMove } from './cube/moves';
import { generateScramble } from './cube/scramble';
import { isSolved } from './cube/solved';
import type { ActiveRotation, CubieState, CubeMove, MoveSource } from './cube/types';

const DEBUG = false;

interface QueuedMove {
  readonly move: CubeMove;
  readonly source: MoveSource;
  readonly durationMs: number;
}

export default function App() {
  const [cubies, setCubies] = useState<CubieState[]>(() => createSolvedCubies());
  const cubiesRef = useRef(cubies);
  const [history, setHistory] = useState<CubeMove[]>([]);
  const historyRef = useRef<CubeMove[]>([]);
  const [activeRotation, setActiveRotation] = useState<ActiveRotation | null>(null);
  const activeRef = useRef<ActiveRotation | null>(null);
  const queueRef = useRef<QueuedMove[]>([]);
  const rotationKeyRef = useRef(0);
  const [scrambling, setScrambling] = useState(false);
  const [solvedPulse, setSolvedPulse] = useState(0);
  const [resetEpoch, setResetEpoch] = useState(0);

  const setActive = (rotation: ActiveRotation | null) => {
    activeRef.current = rotation;
    setActiveRotation(rotation);
  };

  const launch = (item: QueuedMove, fromAngle = 0) => {
    const targetAngle = item.move.quarterTurns * Math.PI / 2;
    const remaining = Math.abs(targetAngle - fromAngle);
    const base = Math.abs(item.move.quarterTurns) === 2 ? Math.max(240, item.durationMs * 1.55) : item.durationMs;
    const durationMs = fromAngle === 0 ? base : Math.max(90, Math.min(220, base * (remaining / (Math.PI / 2))));
    rotationKeyRef.current += 1;
    setActive({
      key: rotationKeyRef.current,
      move: item.move,
      source: item.source,
      fromAngle,
      toAngle: targetAngle,
      durationMs,
    });
  };

  const launchNext = () => {
    const next = queueRef.current.shift();
    if (next) launch(next);
    else {
      setActive(null);
      setScrambling(false);
    }
  };

  const handleRotationComplete = (rotation: ActiveRotation) => {
    if (activeRef.current?.key !== rotation.key) return;

    const nextCubies = applyMove(cubiesRef.current, rotation.move);
    cubiesRef.current = nextCubies;
    setCubies(nextCubies);

    if (rotation.source === 'user' || rotation.source === 'debug') {
      const nextHistory = [...historyRef.current, rotation.move];
      historyRef.current = nextHistory;
      setHistory(nextHistory);
    }

    if (rotation.source !== 'scramble' && isSolved(nextCubies)) {
      setSolvedPulse((value) => value + 1);
    }

    launchNext();
  };

  const handleGestureCommit = (move: CubeMove, fromAngle: number) => {
    if (activeRef.current) return;
    launch({ move, source: 'user', durationMs: 190 }, fromAngle);
  };

  const handleScramble = () => {
    if (activeRef.current) return;
    const moves = generateScramble(22);
    historyRef.current = [];
    setHistory([]);
    queueRef.current = moves.slice(1).map((move) => ({ move, source: 'scramble', durationMs: 155 }));
    setScrambling(true);
    const first = moves[0];
    if (first) launch({ move: first, source: 'scramble', durationMs: 155 });
  };

  const handleReset = () => {
    queueRef.current = [];
    setActive(null);
    setScrambling(false);
    historyRef.current = [];
    setHistory([]);
    const solved = createSolvedCubies();
    cubiesRef.current = solved;
    setCubies(solved);
    setResetEpoch((value) => value + 1);
  };

  const handleUndo = () => {
    if (activeRef.current || historyRef.current.length === 0) return;
    const nextHistory = [...historyRef.current];
    const move = nextHistory.pop();
    if (!move) return;
    historyRef.current = nextHistory;
    setHistory(nextHistory);
    launch({ move: inverseMove(move), source: 'undo', durationMs: 175 });
  };

  const busy = activeRotation !== null;

  return (
    <main className="app-shell">
      <Canvas
        className="cube-canvas"
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#f2f2ee');
          gl.shadowMap.type = PCFSoftShadowMap;
          gl.outputColorSpace = SRGBColorSpace;
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.92;
        }}
      >
        <Suspense fallback={null}>
          <Scene
            cubies={cubies}
            activeRotation={activeRotation}
            interactionEnabled={!scrambling}
            solvedPulse={solvedPulse}
            cubeKey={resetEpoch}
            onGestureCommit={handleGestureCommit}
            onRotationComplete={handleRotationComplete}
          />
        </Suspense>
      </Canvas>

      <div key={solvedPulse} className={solvedPulse > 0 ? 'solved-indicator solved-indicator--pulse' : 'solved-indicator'}>
        Solved
      </div>

      <Controls
        moves={history.length}
        busy={busy}
        canUndo={history.length > 0}
        scrambling={scrambling}
        onScramble={handleScramble}
        onReset={handleReset}
        onUndo={handleUndo}
      />

      {DEBUG && (
        <pre className="debug-panel">
          {JSON.stringify({ activeRotation, queued: queueRef.current.length, moves: history.length }, null, 2)}
        </pre>
      )}
    </main>
  );
}
