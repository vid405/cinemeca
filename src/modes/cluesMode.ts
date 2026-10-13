import { pickSecretMovie } from '../api/pool';
import { getMovieDetails, getPersonCredits } from '../api/tmdb';
import { compareMovies, type GuessResult } from '../game/compare';
import { buildHint, hintOptions } from '../game/hints';
import type { GameMode } from '../game/modes';
import { computeXp } from '../game/xp';

export const cluesMode: GameMode<GuessResult> = {
  id: 'clues',
  name: 'Pistas',
  description: 'Adivina la película comparando año, taquilla, estudio, clasificación, puntuación, géneros y reparto.',
  maxAttempts: 10,
  /** Una pista tras el intento 4 y otra tras el 8: máximo 2 por partida. */
  hintSchedule: [4, 8],
  prepareRound: ({ excludeIds }) => pickSecretMovie(excludeIds),
  resolveGuess: getMovieDetails,
  evaluateGuess: compareMovies,
  getHintOptions: hintOptions,
  buildHint: (kind, secret, guesses, previous) =>
    buildHint(kind, secret, guesses, { personCredits: getPersonCredits }, previous),
  score: computeXp,
};
