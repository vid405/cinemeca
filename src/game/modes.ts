import type { RoundRules } from './difficulty';
import type { Hint, HintKind, HintOption } from './hints';
import type { MovieData } from './types';
import type { ScoreInput } from './xp';

/**
 * Contrato común para todos los modos de juego. El hook useGame solo conoce esta
 * interfaz, así que un modo nuevo (frame borroso, emojis, contrarreloj…) se añade
 * implementándola y registrándolo en src/modes/index.ts.
 */
export type GameModeId = 'clues' | 'hollywood' | 'blurred-frame' | 'emoji' | 'time-attack';

export interface EvaluatedGuess {
  movie: MovieData;
  isCorrect: boolean;
}

export interface RoundContext {
  /** Películas que no deben salir (ya jugadas). */
  excludeIds: ReadonlySet<number>;
  rules: RoundRules;
}

export interface GameMode<TResult extends EvaluatedGuess = EvaluatedGuess, TSecret extends MovieData = MovieData> {
  id: GameModeId;
  name: string;
  description: string;
  /** Reglas de la partida según el XP del jugador (los modos fijos ignoran el XP). */
  rules(xp: number): RoundRules;
  /** Para modos contrarreloj (aún no usado por la UI). */
  timeLimitMs?: number;
  /** Elige la película secreta (y cualquier material extra: frames, emojis…). */
  prepareRound(ctx: RoundContext): Promise<TSecret>;
  /** Convierte la selección del buscador en datos completos comparables. */
  resolveGuess(movieId: number): Promise<MovieData>;
  evaluateGuess(guess: MovieData, secret: TSecret): TResult;
  /** Tipos de pista que se ofrecen en el selector. */
  getHintOptions(secret: TSecret): HintOption[];
  /** Calcula una pista en el momento de pedirla (puede depender de los intentos y pedir datos). */
  buildHint(kind: HintKind, secret: TSecret, guesses: MovieData[], previous: Hint[]): Promise<Hint | null>;
  /** XP de la partida; puede ser negativo (el modo Hollywood castiga perder). */
  score(input: ScoreInput, rules: RoundRules): number;
}

/** Cuántas pistas están desbloqueadas tras `attempts` intentos. */
export function unlockedHints(schedule: number[], attempts: number, available: number): number {
  return Math.min(available, schedule.filter((t) => attempts >= t).length);
}

/** Intentos que faltan para la próxima pista (null si no quedan). */
export function attemptsToNextHint(schedule: number[], attempts: number, available: number): number | null {
  const next = schedule.slice(0, available).find((t) => t > attempts);
  return next == null ? null : next - attempts;
}
