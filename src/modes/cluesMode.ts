import { pickSecretMovie, worldSource } from '../api/pool';
import { getMovieDetails, getPersonCredits } from '../api/tmdb';
import { compareMovies, type GuessResult } from '../game/compare';
import { relaxedTier, rulesFor, tieredXp, tierFor, WORLD_TIERS } from '../game/difficulty';
import { buildHint, hintOptions, pickHintOptions } from '../game/hints';
import type { GameMode } from '../game/modes';
import { computeXp } from '../game/xp';

/** Piezas comunes a los modos que comparan atributos (Es Cine y Hollywood). */
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
  name: 'Es Cine',
  description: 'Cine de todo el mundo. Se vuelve más difícil al subir de rango y fallar resta XP.',
  rules: (xp) => rulesFor(tierFor(WORLD_TIERS, xp)),
  prepareRound: ({ excludeIds, rules }) =>
    pickSecretMovie(excludeIds, (attempt) => worldSource(relaxedTier(WORLD_TIERS, rules.tier?.level ?? 0, attempt))),
  ...cardModeBase,
  score: (input, rules) => (rules.tier ? tieredXp(input, rules.tier) : computeXp(input)),
};
