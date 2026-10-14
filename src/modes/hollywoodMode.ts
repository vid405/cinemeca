import { hollywoodSource, pickSecretMovie } from '../api/pool';
import type { GuessResult } from '../game/compare';
import { HOLLYWOOD_TIERS, hollywoodRules, hollywoodXp } from '../game/difficulty';
import type { GameMode } from '../game/modes';
import { computeXp } from '../game/xp';
import { cardModeBase } from './cluesMode';

/** Reintentos con el nivel propio antes de abrirse al siguiente (si ya jugaste casi todo). */
const TRIES_PER_TIER = 4;

export const hollywoodMode: GameMode<GuessResult> = {
  id: 'hollywood',
  name: 'Hollywood',
  description: 'Solo cine de Hollywood, como Spotle. Se vuelve más difícil al subir de rango y fallar resta XP.',
  rules: hollywoodRules,
  prepareRound: ({ excludeIds, rules }) => {
    const level = rules.tier?.level ?? 0;
    return pickSecretMovie(
      excludeIds,
      (attempt) => hollywoodSource(HOLLYWOOD_TIERS[Math.min(level + Math.floor(attempt / TRIES_PER_TIER), HOLLYWOOD_TIERS.length - 1)]),
      12,
    );
  },
  ...cardModeBase,
  score: (input, rules) => (rules.tier ? hollywoodXp(input, rules.tier) : computeXp(input)),
};
