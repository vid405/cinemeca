import { describe, expect, it } from 'vitest';
import {
  HOLLYWOOD_TIERS,
  relaxedTier,
  rulesFor,
  tieredXp,
  tierFor,
  WORLD_TIERS,
  type DifficultyTier,
  type HollywoodTier,
  type WorldTier,
} from './difficulty';
import { applyRound, createEmptyProfile, type PlayedMovie } from './progress';
import { computeXp, RANKS } from './xp';

const input = { maxAttempts: 10, hintsUsed: 0, gaveUp: false };

const MODES: [string, (HollywoodTier | WorldTier)[]][] = [
  ['Hollywood', HOLLYWOOD_TIERS],
  ['Es Cine', WORLD_TIERS],
];

describe.each(MODES)('niveles de %s', (_, tiers) => {
  it('hay un nivel por rango y el nivel sigue al XP', () => {
    expect(tiers).toHaveLength(RANKS.length);
    expect(tierFor(tiers, 0).rank).toBe('Espectador');
    expect(tierFor(tiers, RANKS[2].minXp - 1).rank).toBe('Cinéfilo');
    expect(tierFor(tiers, RANKS[2].minXp).rank).toBe('Crítico');
    expect(tierFor(tiers, 99_999).rank).toBe('Leyenda');
  });

  it('cada nivel es igual o más difícil que el anterior', () => {
    for (let i = 1; i < tiers.length; i++) {
      const [prev, cur] = [tiers[i - 1], tiers[i]];
      expect(cur.minVotes).toBeLessThan(prev.minVotes); // películas menos conocidas
      expect(cur.fromYear).toBeLessThan(prev.fromYear); // y más antiguas
      expect(cur.maxAttempts).toBeLessThanOrEqual(prev.maxAttempts);
      expect(cur.hintSchedule.length).toBeLessThanOrEqual(prev.hintSchedule.length);
      expect(cur.lossPenalty).toBeGreaterThan(prev.lossPenalty);
      expect(cur.winBonus).toBeGreaterThanOrEqual(prev.winBonus);
    }
  });

  it('las pistas siempre llegan antes del último intento', () => {
    for (const t of tiers) for (const at of t.hintSchedule) expect(at).toBeLessThan(t.maxAttempts);
  });

  it('si el nivel se agota, se abre al siguiente sin pasar del último', () => {
    expect(relaxedTier(tiers, 0, 0).level).toBe(0);
    expect(relaxedTier(tiers, 0, 3).level).toBe(0);
    expect(relaxedTier(tiers, 0, 4).level).toBe(1);
    expect(relaxedTier(tiers, 4, 11).level).toBe(4);
  });
});

describe('niveles de Es Cine (cine mundial)', () => {
  it('el cine extranjero tiene su propio umbral, más bajo', () => {
    for (const t of WORLD_TIERS) expect(t.foreignMinVotes).toBeLessThanOrEqual(t.minVotes);
  });

  it('cada nivel suma idiomas y más cine extranjero, sin quitar los anteriores', () => {
    for (let i = 1; i < WORLD_TIERS.length; i++) {
      const [prev, cur] = [WORLD_TIERS[i - 1], WORLD_TIERS[i]];
      expect(cur.foreignShare).toBeGreaterThan(prev.foreignShare);
      expect(cur.languages.length).toBeGreaterThan(prev.languages.length);
      for (const lang of prev.languages) expect(cur.languages).toContain(lang);
    }
  });

  it('castiga algo menos que Hollywood en el mismo rango', () => {
    WORLD_TIERS.forEach((t, i) => expect(t.lossPenalty).toBeLessThan(HOLLYWOOD_TIERS[i].lossPenalty));
  });
});

describe('XP por nivel', () => {
  const tier: DifficultyTier = WORLD_TIERS[2];

  it('las reglas de la partida salen del nivel', () => {
    expect(rulesFor(HOLLYWOOD_TIERS[3])).toMatchObject({ maxAttempts: 8, hintSchedule: [5], tier: { rank: 'Director' } });
  });

  it('acertar da el XP normal más el bonus del nivel', () => {
    const won = { ...input, won: true, attempts: 3, maxAttempts: tier.maxAttempts };
    expect(tieredXp(won, tier)).toBe(computeXp(won) + tier.winBonus);
  });

  it('perder y rendirse restan XP', () => {
    expect(tieredXp({ ...input, won: false, attempts: 9 }, tier)).toBe(-tier.lossPenalty);
    expect(tieredXp({ ...input, won: false, attempts: 2, gaveUp: true }, tier)).toBe(-tier.lossPenalty);
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
