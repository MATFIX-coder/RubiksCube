export type Difficulty = 'easy' | 'medium' | 'hard';
export type Language = 'ru' | 'en';

export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'];

export const SCRAMBLE_LENGTH: Record<Difficulty, number> = {
  easy: 5,
  medium: 12,
  hard: 22,
};

export interface DifficultyRecords {
  readonly bestTimeMs: number | null;
  readonly bestMoves: number | null;
  readonly solves: number;
}

export type AllRecords = Record<Difficulty, DifficultyRecords>;

export interface SolveOutcome {
  readonly records: AllRecords;
  readonly newBestTime: boolean;
  readonly newBestMoves: boolean;
}

const RECORDS_KEY = 'rubiks.records.v1';
const PREFS_KEY = 'rubiks.prefs.v1';

const EMPTY: DifficultyRecords = { bestTimeMs: null, bestMoves: null, solves: 0 };

// Storage can be missing or blocked (private mode), so every access is guarded.
function readJson(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Not critical: the game simply forgets records after a reload.
  }
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

export function loadRecords(): AllRecords {
  const stored = readJson(RECORDS_KEY) as Partial<Record<Difficulty, Partial<DifficultyRecords>>> | null;
  const result = {} as Record<Difficulty, DifficultyRecords>;
  for (const difficulty of DIFFICULTIES) {
    const entry = stored?.[difficulty];
    result[difficulty] = entry
      ? {
        bestTimeMs: numberOrNull(entry.bestTimeMs),
        bestMoves: numberOrNull(entry.bestMoves),
        solves: typeof entry.solves === 'number' ? entry.solves : 0,
      }
      : EMPTY;
  }
  return result;
}

export function recordSolve(records: AllRecords, difficulty: Difficulty, timeMs: number, moves: number): SolveOutcome {
  const current = records[difficulty];
  const newBestTime = current.bestTimeMs === null || timeMs < current.bestTimeMs;
  const newBestMoves = current.bestMoves === null || moves < current.bestMoves;
  const next: AllRecords = {
    ...records,
    [difficulty]: {
      bestTimeMs: newBestTime ? timeMs : current.bestTimeMs,
      bestMoves: newBestMoves ? moves : current.bestMoves,
      solves: current.solves + 1,
    },
  };
  writeJson(RECORDS_KEY, next);
  // The very first solve is a record by definition, but celebrating it as one feels hollow.
  const firstSolve = current.solves === 0;
  return { records: next, newBestTime: newBestTime && !firstSolve, newBestMoves: newBestMoves && !firstSolve };
}

export interface Preferences {
  readonly language: Language;
  readonly difficulty: Difficulty;
  readonly hintSeen: boolean;
}

export function loadPreferences(): Preferences {
  const stored = readJson(PREFS_KEY) as Partial<Preferences> | null;
  const browserRussian = typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('ru');
  return {
    language: stored?.language === 'en' || stored?.language === 'ru' ? stored.language : browserRussian ? 'ru' : 'en',
    difficulty: stored?.difficulty && DIFFICULTIES.includes(stored.difficulty) ? stored.difficulty : 'medium',
    hintSeen: stored?.hintSeen === true,
  };
}

export function savePreferences(preferences: Preferences): void {
  writeJson(PREFS_KEY, preferences);
}

export function formatTime(ms: number): string {
  const totalCentis = Math.max(0, Math.floor(ms / 10));
  const centis = totalCentis % 100;
  const totalSeconds = Math.floor(totalCentis / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
}
