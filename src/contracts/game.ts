import type { TileCode } from '../mahjong/tiles';
import type { RuleMode } from '../mahjong/rules';

export type PlayerId = 'east' | 'south' | 'west' | 'north';
export const PLAYER_IDS: readonly PlayerId[] = ['east', 'south', 'west', 'north'];
export interface Tile { id: string; code: TileCode }
export interface GameConfig {
  seed: number; ruleMode: RuleMode; gameId: string;
  viewer?: PlayerId;
  /** Even tile offset in the shuffled clockwise wall; omitted for legacy replays. */
  wallStart?: number;
  openingSummary?: string;
}
export type Phase = 'awaiting-discard' | 'awaiting-win-response' | 'awaiting-meld-response' | 'finished';
export interface Meld { type: 'chi' | 'pon' | 'open-kan' | 'closed-kan' | 'added-kan'; tiles: Tile[]; from?: PlayerId }
export interface VisibleMeld extends Omit<Meld, 'tiles'> { tiles: Tile[] | null }
export type GameAction =
  | { type: 'discard'; playerId: PlayerId; tileId: string }
  | { type: 'chi'; playerId: PlayerId; tileIds: string[] }
  | { type: 'pon' | 'open-kan'; playerId: PlayerId }
  | { type: 'closed-kan' | 'added-kan'; playerId: PlayerId; tileId: string }
  | { type: 'win'; playerId: PlayerId }
  | { type: 'pass'; playerId: PlayerId };
export interface ActionEnvelope { gameId: string; revision: number; action: GameAction }
export interface GameOutcome {
  kind: 'self-draw' | 'discard-win' | 'draw';
  winner?: PlayerId;
  from?: PlayerId;
  reason: string;
}
export interface VisiblePlayer {
  id: PlayerId;
  name: string;
  handCount: number;
  /** null while an opponent's hand is concealed; revealed at game end. */
  hand: Tile[] | null;
  flowers: Tile[];
  discards: Tile[];
  melds: VisibleMeld[];
}
export interface PlayerView {
  openingSummary?: string;
  gameId: string;
  revision: number;
  seed: number;
  ruleMode: RuleMode;
  viewer: PlayerId;
  phase: Phase;
  currentPlayer: PlayerId;
  /** Only this player can act; null at game end. */
  actingPlayer: PlayerId | null;
  players: VisiblePlayer[];
  wallRemaining: number;
  lastDiscard: { playerId: PlayerId; tile: Tile } | null;
  pendingKan?: { playerId: PlayerId; tile: Tile } | null;
  drawnTileId: string | null;
  legalActions: GameAction[];
  outcome: GameOutcome | null;
  message: string;
}
export interface UIHandlers {
  onAction(envelope: ActionEnvelope): void;
  /** UI handles restart confirmation, then supplies a validated seed and mode. */
  onNewGame(config: Omit<GameConfig, 'gameId'>): void;
}
export interface GameUI {
  render(view: PlayerView): void;
  showError(message: string): void;
  destroy(): void;
}
