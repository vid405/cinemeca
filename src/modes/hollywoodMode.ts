import { hollywoodSource, pickSecretMovie } from '../api/pool';
import type { GuessResult } from '../game/compare';
import { HOLLYWOOD_TIERS, relaxedTier, rulesFor, tieredXp, tierFor } from '../game/difficulty';
import type { GameMode } from '../game/modes';
import { computeXp } from '../game/xp';
import { cardModeBase } from './cluesMode';

export const hollywoodMode: GameMode<GuessResult> = {
  id: 'hollywood',
  name: 'Hollywood',
  description: 'Solo cine de Hollywood, como Spotle. Se vuelve más difícil al subir de rango y fallar resta XP.',
  rules: (xp) => rulesFor(tierFor(HOLLYWOOD_TIERS, xp)),
  prepareRound: ({ excludeIds, rules }) =>
    pickSecretMovie(excludeIds, (attempt) => hollywoodSource(relaxedTier(HOLLYWOOD_TIERS, rules.tier?.level ?? 0, attempt))),
  ...cardModeBase,
  score: (input, rules) => (rules.tier ? tieredXp(input, rules.tier) : computeXp(input)),
};
