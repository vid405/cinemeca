import type { Hint } from './hints';
import type { MovieData } from './types';
import type { ScoreInput } from './xp';

/**
 * Contrato común para todos los modos de juego. El hook useGame solo conoce esta
 * interfaz, así que un modo nuevo (frame borroso, emojis, contrarreloj…) se añade
 * implementándola y registrándolo en src/modes/index.ts.
 */
export type GameModeId = 'clues' | 'blurred-frame' | 'emoji' | 'time-attack';

export interface EvaluatedGuess {
  movie: MovieData;
  isCorrect: boolean;
}

export interface RoundContext {
  /** Películas que no deben salir (últimas jugadas). */
  excludeIds: ReadonlySet<number>;
}

export interface GameMode<TResult extends EvaluatedGuess = EvaluatedGuess, TSecret extends MovieData = MovieData> {
  id: GameModeId;
  name: string;
  description: string;
  maxAttempts: number;
  /** Para modos contrarreloj (aún no usado por la UI). */
  timeLimitMs?: number;
  /** Elige la película secreta (y cualquier material extra: frames, emojis…). */
  prepareRound(ctx: RoundContext): Promise<TSecret>;
  /** Convierte la selección del buscador en datos completos comparables. */
  resolveGuess(movieId: number): Promise<MovieData>;
  evaluateGuess(guess: MovieData, secret: TSecret): TResult;
  getHints(secret: TSecret): Hint[];
  score(input: ScoreInput): number;
}
