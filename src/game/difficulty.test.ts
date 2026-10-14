import { describe, expect, it } from 'vitest';
import { HOLLYWOOD_TIERS, hollywoodRules, hollywoodTier, hollywoodXp } from './difficulty';
import { applyRound, createEmptyProfile, type PlayedMovie } from './progress';
import { computeXp, RANKS } from './xp';

const input = { maxAttempts: 10, hintsUsed: 0, gaveUp: false };

describe('niveles de Hollywood', () => {
  it('hay un nivel por rango y el nivel sigue al XP', () => {
    expect(HOLLYWOOD_TIERS).toHaveLength(RANKS.length);
    expect(hollywoodTier(0).rank).toBe('Espectador');
    expect(hollywoodTier(RANKS[2].minXp - 1).rank).toBe('Cinéfilo');
    expect(hollywoodTier(RANKS[2].minXp).rank).toBe('Crítico');
    expect(hollywoodTier(99_999).rank).toBe('Leyenda');
  });

  it('cada nivel es igual o más difícil que el anterior', () => {
    for (let i = 1; i < HOLLYWOOD_TIERS.length; i++) {
      const [prev, cur] = [HOLLYWOOD_TIERS[i - 1], HOLLYWOOD_TIERS[i]];
      expect(cur.minVotes).toBeLessThan(prev.minVotes); // películas menos conocidas
      expect(cur.fromYear).toBeLessThan(prev.fromYear); // y más antiguas
      expect(cur.maxAttempts).toBeLessThanOrEqual(prev.maxAttempts);
      expect(cur.hintSchedule.length).toBeLessThanOrEqual(prev.hintSchedule.length);
      expect(cur.lossPenalty).toBeGreaterThan(prev.lossPenalty);
      expect(cur.winBonus).toBeGreaterThanOrEqual(prev.winBonus);
    }
  });

  it('las reglas de la partida salen del nivel', () => {
    const rules = hollywoodRules(RANKS[3].minXp);
    expect(rules).toMatchObject({ maxAttempts: 8, hintSchedule: [5], tier: { rank: 'Director' } });
  });

  it('las pistas siempre llegan antes del último intento', () => {
    for (const t of HOLLYWOOD_TIERS) for (const at of t.hintSchedule) expect(at).toBeLessThan(t.maxAttempts);
  });
});

describe('XP de Hollywood', () => {
  const tier = HOLLYWOOD_TIERS[2];

  it('acertar da el XP normal más el bonus del nivel', () => {
    const won = { ...input, won: true, attempts: 3, maxAttempts: tier.maxAttempts };
    expect(hollywoodXp(won, tier)).toBe(computeXp(won) + tier.winBonus);
  });

  it('perder y rendirse restan XP', () => {
    expect(hollywoodXp({ ...input, won: false, attempts: 9 }, tier)).toBe(-tier.lossPenalty);
    expect(hollywoodXp({ ...input, won: false, attempts: 2, gaveUp: true }, tier)).toBe(-tier.lossPenalty);
  });

  it('el XP total nunca baja de 0', () => {
    const loss: PlayedMovie = {
      movieId: 1, title: 'X', originalTitle: 'X', year: 2000, posterPath: null, won: false, gaveUp: true,
      attempts: 1, hintsUsed: 0, xp: -65, mode: 'hollywood', playedAt: '2026-10-13T10:00:00.000Z',
    };
    const p = applyRound({ ...createEmptyProfile(), xp: 20 }, loss);
    expect(p.xp).toBe(0);
    expect(p.history[0].xp).toBe(-65);
  });
});
