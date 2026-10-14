import { pickSecretMovie } from '../api/pool';
import { getMovieDetails, getPersonCredits } from '../api/tmdb';
import { compareMovies, type GuessResult } from '../game/compare';
import type { RoundRules } from '../game/difficulty';
import { buildHint, hintOptions, pickHintOptions } from '../game/hints';
import type { GameMode } from '../game/modes';
import { computeXp } from '../game/xp';

/** Una pista tras el intento 4 y otra tras el 8: máximo 2 por partida. */
const CLUES_RULES: RoundRules = { maxAttempts: 10, hintSchedule: [4, 8] };

/** Piezas comunes a los modos que comparan atributos (Pistas y Hollywood). */
export const cardModeBase = {
  resolveGuess: getMovieDetails,
  evaluateGuess: compareMovies,
  // 3 de las 5 opciones, distintas en cada partida.
  getHintOptions: (secret: Parameters<typeof hintOptions>[0]) => pickHintOptions(hintOptions(secret)),
  buildHint: ((kind, secret, guesses, previous) =>
    buildHint(kind, secret, guesses, { personCredits: getPersonCredits }, previous)) as GameMode<GuessResult>['buildHint'],
};

export const cluesMode: GameMode<GuessResult> = {
  id: 'clues',
  name: 'Pistas',
  description: 'Cine de todo el mundo y de cualquier época. 10 intentos, perder no resta XP.',
  rules: () => CLUES_RULES,
  prepareRound: ({ excludeIds }) => pickSecretMovie(excludeIds),
  ...cardModeBase,
  score: (input) => computeXp(input),
};
