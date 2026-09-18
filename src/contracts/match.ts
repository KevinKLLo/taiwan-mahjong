import type { GameOutcome, PlayerId } from './game';

/** Stable identities: 0 is human; 1–3 are AIs. Winds here are the original seating draw. */
export interface Seating { seats: PlayerId[]; dealer: number }
export interface RoundPosition { dealer: number; dealerChanges: number; continuations: number }
export interface RoundRecord extends RoundPosition {
  gameId: string; roundNumber: number; kind: GameOutcome['kind'];
  winner?: number; from?: number;
}
export interface MatchView extends RoundPosition {
  baseSeed: number; roundNumber: number;
  status: 'playing' | 'between-rounds' | 'complete';
  next: RoundPosition | null;
  history: RoundRecord[];
}
