/**
 * idle      – free play, no timer
 * scrambling – scramble animation is running
 * ready     – cube is scrambled, the timer waits for the first move
 * running   – timed solve in progress
 * solved    – a solve just finished, the result card is shown
 * solving   – the cube is being solved automatically
 */
import type { Difficulty } from './records';

export type Phase = 'idle' | 'scrambling' | 'ready' | 'running' | 'solved' | 'solving';

export interface SolveResult {
  readonly key: number;
  readonly kind: 'timed' | 'auto' | 'free';
  readonly difficulty: Difficulty;
  readonly timeMs: number | null;
  readonly moves: number;
  readonly newBestTime: boolean;
  readonly newBestMoves: boolean;
}
