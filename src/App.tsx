import { Canvas } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace } from 'three';
import { Controls } from './components/Controls';
import { HelpOverlay, Hint, MoveStrip, SolvedToast, StatusPanel, TopBar } from './components/Hud';
import { CELEBRATION_MS } from './components/RubiksCube';
import { Scene } from './components/Scene';
import { applyMove, createSolvedCubies } from './cube/CubeState';
import { inverseMove, simplifyMoves } from './cube/moves';
import { DEFAULT_FRAME, moveForLetter, notationInFrame, type MoveLetter, type ViewFrame } from './cube/notation';
import { generateScramble } from './cube/scramble';
import { isSolved } from './cube/solved';
import type { ActiveRotation, CubieState, CubeMove, MoveSource } from './cube/types';
import { STRINGS } from './game/i18n';
import {
  SCRAMBLE_LENGTH,
  loadPreferences,
  loadRecords,
  recordSolve,
  savePreferences,
  type Difficulty,
  type Language,
} from './game/records';
import type { Phase, SolveResult } from './game/session';

const DEBUG = false;

/** Keyboard keys are read by physical position, so they also work with a Russian layout. */
const KEY_TO_LETTER: Record<string, MoveLetter> = {
  KeyR: 'R', KeyL: 'L', KeyU: 'U', KeyD: 'D', KeyF: 'F', KeyB: 'B', KeyM: 'M', KeyE: 'E', KeyS: 'S',
};

const MAX_QUEUED_USER_MOVES = 6;
// A free-play return to the solved state is celebrated only after real effort.
const FREE_SOLVE_MIN_MOVES = 4;

interface QueuedMove {
  readonly move: CubeMove;
  readonly source: MoveSource;
  readonly durationMs: number;
}

export default function App() {
  const [preferences] = useState(loadPreferences);
  const [language, setLanguage] = useState<Language>(preferences.language);
  const [difficulty, setDifficulty] = useState<Difficulty>(preferences.difficulty);
  const [hintVisible, setHintVisible] = useState(!preferences.hintSeen);
  const [records, setRecords] = useState(loadRecords);
  const [helpOpen, setHelpOpen] = useState(false);
  const t = STRINGS[language];

  const [cubies, setCubies] = useState<CubieState[]>(() => createSolvedCubies());
  const cubiesRef = useRef(cubies);
  const [history, setHistory] = useState<CubeMove[]>([]);
  const historyRef = useRef<CubeMove[]>([]);
  const [redoStack, setRedoStack] = useState<CubeMove[]>([]);
  const redoRef = useRef<CubeMove[]>([]);
  const [scrambleMoves, setScrambleMoves] = useState<CubeMove[]>([]);
  /** Every move applied since the cube was last solved — the auto-solver rewinds it. */
  const logRef = useRef<CubeMove[]>([]);
  const [logLength, setLogLength] = useState(0);

  const [activeRotation, setActiveRotation] = useState<ActiveRotation | null>(null);
  const activeRef = useRef<ActiveRotation | null>(null);
  const queueRef = useRef<QueuedMove[]>([]);
  const rotationKeyRef = useRef(0);

  const [phase, setPhaseState] = useState<Phase>('idle');
  const phaseRef = useRef<Phase>('idle');
  const [startAt, setStartAt] = useState<number | null>(null);
  const startAtRef = useRef<number | null>(null);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [result, setResult] = useState<SolveResult | null>(null);
  const resultKeyRef = useRef(0);
  const difficultyRef = useRef(difficulty);
  /** Difficulty of the current scramble: records are filed under it. */
  const sessionDifficultyRef = useRef(difficulty);
  const solutionLengthRef = useRef(0);
  const recordsRef = useRef(records);

  const [solvedPulse, setSolvedPulse] = useState(0);
  const celebrateUntilRef = useRef(0);
  const [resetEpoch, setResetEpoch] = useState(0);
  const frameSourceRef = useRef<() => ViewFrame>(() => DEFAULT_FRAME);

  useEffect(() => {
    savePreferences({ language, difficulty, hintSeen: !hintVisible });
    document.documentElement.lang = language;
  }, [language, difficulty, hintVisible]);

  const setPhase = (next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  };

  const setActive = (rotation: ActiveRotation | null) => {
    activeRef.current = rotation;
    setActiveRotation(rotation);
  };

  const setHistoryBoth = (next: CubeMove[]) => {
    historyRef.current = next;
    setHistory(next);
  };

  const setRedoBoth = (next: CubeMove[]) => {
    redoRef.current = next;
    setRedoStack(next);
  };

  const setLog = (next: CubeMove[]) => {
    logRef.current = next;
    setLogLength(next.length);
  };

  const handleFrameSource = useCallback((source: () => ViewFrame) => {
    frameSourceRef.current = source;
  }, []);

  const celebrate = () => {
    celebrateUntilRef.current = performance.now() + CELEBRATION_MS;
    setSolvedPulse((value) => value + 1);
  };

  const isCelebrating = () => performance.now() < celebrateUntilRef.current;

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
    if (next) {
      launch(next);
      return;
    }
    setActive(null);
    if (phaseRef.current === 'scrambling') setPhase('ready');
    else if (phaseRef.current === 'solving') setPhase('idle');
  };

  /** Called right before a move made by the player starts animating. */
  const beginPlayerMove = () => {
    if (hintVisible) setHintVisible(false);
    if (phaseRef.current === 'ready') {
      const now = performance.now();
      startAtRef.current = now;
      setStartAt(now);
      setEndAt(null);
      setPhase('running');
    } else if (phaseRef.current === 'solved') {
      setResult(null);
      setPhase('idle');
    }
  };

  const finishSolve = (kind: SolveResult['kind'], moves: number) => {
    resultKeyRef.current += 1;
    if (kind === 'timed' && startAtRef.current !== null) {
      const now = performance.now();
      const timeMs = now - startAtRef.current;
      setEndAt(now);
      const level = sessionDifficultyRef.current;
      const outcome = recordSolve(recordsRef.current, level, timeMs, moves);
      recordsRef.current = outcome.records;
      setRecords(outcome.records);
      setResult({
        key: resultKeyRef.current,
        kind,
        difficulty: level,
        timeMs,
        moves,
        newBestTime: outcome.newBestTime,
        newBestMoves: outcome.newBestMoves,
      });
      setPhase('solved');
    } else {
      setResult({
        key: resultKeyRef.current,
        kind,
        difficulty: sessionDifficultyRef.current,
        timeMs: null,
        moves,
        newBestTime: false,
        newBestMoves: false,
      });
      setPhase(kind === 'auto' ? 'solved' : 'idle');
    }
    celebrate();
  };

  const handleRotationComplete = (rotation: ActiveRotation) => {
    if (activeRef.current?.key !== rotation.key) return;

    const nextCubies = applyMove(cubiesRef.current, rotation.move);
    cubiesRef.current = nextCubies;
    setCubies(nextCubies);

    if (rotation.source === 'user' || rotation.source === 'redo' || rotation.source === 'debug') {
      setHistoryBoth([...historyRef.current, rotation.move]);
      if (rotation.source === 'user') setRedoBoth([]);
    }

    const effortBefore = simplifyMoves(logRef.current).length;
    if (rotation.source !== 'solve') setLog([...logRef.current, rotation.move]);

    const solved = rotation.source !== 'scramble' && isSolved(nextCubies);
    if (solved) {
      setLog([]);
      // Moves typed ahead would only scramble the freshly solved cube again.
      queueRef.current = [];
      const phaseNow = phaseRef.current;
      if (phaseNow === 'running') finishSolve('timed', historyRef.current.length);
      else if (phaseNow === 'solving') finishSolve('auto', solutionLengthRef.current);
      else if (effortBefore + 1 >= FREE_SOLVE_MIN_MOVES) finishSolve('free', historyRef.current.length);
    }

    launchNext();
  };

  const handleGestureCommit = (move: CubeMove, fromAngle: number) => {
    if (activeRef.current || isCelebrating()) return;
    beginPlayerMove();
    const named = { ...move, notation: notationInFrame(frameSourceRef.current(), move) };
    launch({ move: named, source: 'user', durationMs: 190 }, fromAngle);
  };

  const canPlay = () => phaseRef.current !== 'scrambling' && phaseRef.current !== 'solving' && !isCelebrating();

  const handleKeyMove = (letter: MoveLetter, prime: boolean) => {
    if (!canPlay()) return;
    const move = moveForLetter(frameSourceRef.current(), letter, prime);
    beginPlayerMove();
    const item: QueuedMove = { move, source: 'user', durationMs: 165 };
    if (activeRef.current) {
      if (queueRef.current.length < MAX_QUEUED_USER_MOVES) queueRef.current.push(item);
    } else {
      launch(item);
    }
  };

  const startScramble = (level: Difficulty) => {
    if (activeRef.current || phaseRef.current === 'solving' || phaseRef.current === 'scrambling') return;
    // Let the victory lap finish first: layer turns inside a spinning cube look wrong.
    const wait = celebrateUntilRef.current - performance.now();
    if (wait > 0) {
      window.setTimeout(() => startScramble(level), wait + 30);
      return;
    }
    const moves = generateScramble(SCRAMBLE_LENGTH[level]);
    sessionDifficultyRef.current = level;
    setHistoryBoth([]);
    setRedoBoth([]);
    setScrambleMoves(moves);
    setResult(null);
    startAtRef.current = null;
    setStartAt(null);
    setEndAt(null);
    setPhase('scrambling');
    queueRef.current = moves.slice(1).map((move) => ({ move, source: 'scramble', durationMs: 150 }));
    const first = moves[0];
    if (first) launch({ move: first, source: 'scramble', durationMs: 150 });
  };

  const handleScramble = () => startScramble(difficultyRef.current);

  const handleSolve = () => {
    if (activeRef.current || !canPlay()) return;
    const solution = simplifyMoves(logRef.current).reverse().map(inverseMove);
    if (solution.length === 0) return;
    // Long solutions speed up so that the rewind never drags on.
    const durationMs = Math.max(70, Math.min(150, 3600 / solution.length));
    solutionLengthRef.current = solution.length;
    setLog([]);
    setHistoryBoth([]);
    setRedoBoth([]);
    setResult(null);
    startAtRef.current = null;
    setStartAt(null);
    setEndAt(null);
    setPhase('solving');
    queueRef.current = solution.slice(1).map((move) => ({ move, source: 'solve', durationMs }));
    const first = solution[0];
    if (first) launch({ move: first, source: 'solve', durationMs });
  };

  const handleReset = () => {
    queueRef.current = [];
    setActive(null);
    setPhase('idle');
    setHistoryBoth([]);
    setRedoBoth([]);
    setLog([]);
    setScrambleMoves([]);
    setResult(null);
    startAtRef.current = null;
    setStartAt(null);
    setEndAt(null);
    celebrateUntilRef.current = 0;
    const solved = createSolvedCubies();
    cubiesRef.current = solved;
    setCubies(solved);
    setResetEpoch((value) => value + 1);
  };

  const handleUndo = () => {
    if (activeRef.current || !canPlay() || historyRef.current.length === 0) return;
    const nextHistory = [...historyRef.current];
    const move = nextHistory.pop();
    if (!move) return;
    if (phaseRef.current === 'solved') {
      setResult(null);
      setPhase('idle');
    }
    setHistoryBoth(nextHistory);
    setRedoBoth([...redoRef.current, move]);
    launch({ move: inverseMove(move), source: 'undo', durationMs: 175 });
  };

  const handleRedo = () => {
    if (activeRef.current || !canPlay() || redoRef.current.length === 0) return;
    const nextRedo = [...redoRef.current];
    const move = nextRedo.pop();
    if (!move) return;
    beginPlayerMove();
    setRedoBoth(nextRedo);
    launch({ move, source: 'redo', durationMs: 175 });
  };

  const handleDifficulty = (level: Difficulty) => {
    difficultyRef.current = level;
    setDifficulty(level);
    // Switching level mid-attempt deals a fresh scramble of the new length.
    if (phaseRef.current === 'ready' || phaseRef.current === 'running') startScramble(level);
  };

  // The keyboard listener is attached once and always calls the latest handlers.
  const handlersRef = useRef({ handleKeyMove, handleScramble, handleUndo, handleRedo, handleReset, setHelpOpen, helpOpen });
  handlersRef.current = { handleKeyMove, handleScramble, handleUndo, handleRedo, handleReset, setHelpOpen, helpOpen };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const h = handlersRef.current;
      const onButton = event.target instanceof HTMLButtonElement;

      if (event.code === 'Escape') {
        if (h.helpOpen) h.setHelpOpen(false);
        else h.handleReset();
        return;
      }
      if (h.helpOpen) return;

      if (event.ctrlKey || event.metaKey) {
        if (event.code === 'KeyZ') {
          event.preventDefault();
          if (event.shiftKey) h.handleRedo();
          else h.handleUndo();
        } else if (event.code === 'KeyY') {
          event.preventDefault();
          h.handleRedo();
        }
        return;
      }
      if (event.altKey) return;

      if (event.code === 'Space') {
        if (onButton) return;
        event.preventDefault();
        if (!event.repeat) h.handleScramble();
        return;
      }
      if (event.code === 'KeyH' || event.key === '?') {
        h.setHelpOpen(true);
        return;
      }

      const letter = KEY_TO_LETTER[event.code];
      if (letter && !event.repeat) {
        event.preventDefault();
        h.handleKeyMove(letter, event.shiftKey);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const busy = activeRotation !== null;
  const scrambling = phase === 'scrambling';
  const solving = phase === 'solving';
  const locked = scrambling || solving;
  const stripMoves = scrambling ? scrambleMoves : history;

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
            interactionEnabled={!locked}
            solvedPulse={solvedPulse}
            cubeKey={resetEpoch}
            onGestureCommit={handleGestureCommit}
            onRotationComplete={handleRotationComplete}
            onFrameSource={handleFrameSource}
          />
        </Suspense>
      </Canvas>

      <TopBar
        t={t}
        language={language}
        difficulty={difficulty}
        difficultyLocked={locked}
        onDifficulty={handleDifficulty}
        onLanguage={setLanguage}
        onHelp={() => setHelpOpen(true)}
      />

      <StatusPanel
        t={t}
        phase={phase}
        startAt={startAt}
        endAt={endAt}
        result={result}
        records={records}
        difficulty={difficulty}
        onAgain={handleScramble}
      />

      <SolvedToast t={t} result={result} />

      <div className="bottom-dock">
        {hintVisible && history.length === 0 && !scrambling
          ? <Hint t={t} />
          : <MoveStrip moves={stripMoves} scramble={scrambling} />}
        <Controls
          t={t}
          moves={history.length}
          scrambling={scrambling}
          solving={solving}
          canScramble={!busy && !solving}
          canSolve={!busy && !locked && logLength > 0}
          canUndo={!busy && !locked && history.length > 0}
          canRedo={!busy && !locked && redoStack.length > 0}
          onScramble={handleScramble}
          onSolve={handleSolve}
          onReset={handleReset}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      </div>

      {helpOpen && <HelpOverlay t={t} onClose={() => setHelpOpen(false)} />}

      {DEBUG && (
        <pre className="debug-panel">
          {JSON.stringify({ phase, activeRotation, queued: queueRef.current.length, moves: history.length, log: logLength }, null, 2)}
        </pre>
      )}
    </main>
  );
}
