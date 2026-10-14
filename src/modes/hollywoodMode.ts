import { hollywoodSource, pickFromList, pickSecretMovie } from '../api/pool';
import { ACCLAIMED_INTERNATIONAL_IDS } from '../data/acclaimedInternational';
import type { GuessResult } from '../game/compare';
import { CURATED_SHARE, HOLLYWOOD_TIERS, relaxedTier, rulesFor, tieredXp, tierFor } from '../game/difficulty';
import type { GameMode } from '../game/modes';
import { computeXp } from '../game/xp';
import { cardModeBase } from './cluesMode';

export const hollywoodMode: GameMode<GuessResult> = {
  id: 'hollywood',
  name: 'Hollywood',
  description: 'Los grandes éxitos.',
  rules: (xp) => rulesFor(tierFor(HOLLYWOOD_TIERS, xp)),
  prepareRound: async ({ excludeIds, rules }) => {
    // A veces, un clásico internacional premiado de la lista curada (si quedan sin jugar).
    if (Math.random() < CURATED_SHARE) {
      const curated = await pickFromList(ACCLAIMED_INTERNATIONAL_IDS, excludeIds);
      if (curated) return curated;
    }
    return pickSecretMovie(excludeIds, (attempt) => hollywoodSource(relaxedTier(HOLLYWOOD_TIERS, rules.tier?.level ?? 0, attempt)));
  },
  ...cardModeBase,
  score: (input, rules) => (rules.tier ? tieredXp(input, rules.tier) : computeXp(input)),
};
