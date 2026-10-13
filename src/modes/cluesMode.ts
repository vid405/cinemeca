import { pickSecretMovie } from '../api/pool';
import { getMovieDetails } from '../api/tmdb';
import { compareMovies, type GuessResult } from '../game/compare';
import { buildHints } from '../game/hints';
import type { GameMode } from '../game/modes';
import { computeXp } from '../game/xp';

export const cluesMode: GameMode<GuessResult> = {
  id: 'clues',
  name: 'Pistas',
  description: 'Adivina la película comparando año, taquilla, estudio, clasificación, puntuación, géneros y reparto.',
  maxAttempts: 10,
  hintSchedule: [3, 6, 8],
  prepareRound: ({ excludeIds }) => pickSecretMovie(excludeIds),
  resolveGuess: getMovieDetails,
  evaluateGuess: compareMovies,
  getHints: buildHints,
  score: computeXp,
};
