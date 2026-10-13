import { describe, expect, it } from 'vitest';
import { computeXp, getRankInfo, RANKS, XP_RULES } from './xp';
import { applyRound, createEmptyProfile, getStats, RECENT_LIMIT } from './progress';
import { buildHints, redactTitle } from './hints';

const base = { maxAttempts: 8, hintsUsed: 0, gaveUp: false };

describe('computeXp', () => {
  it('acierto al primer intento da base + bonus máximo', () => {
    expect(computeXp({ ...base, won: true, attempts: 1 })).toBe(XP_RULES.winBase + 7 * XP_RULES.perUnusedAttempt);
  });

  it('acierto en el último intento da solo la base', () => {
    expect(computeXp({ ...base, won: true, attempts: 8 })).toBe(XP_RULES.winBase);
  });

  it('las pistas restan XP, sin bajar del mínimo', () => {
    expect(computeXp({ ...base, won: true, attempts: 8, hintsUsed: 1 })).toBe(XP_RULES.winBase - XP_RULES.hintPenalty);
    expect(computeXp({ ...base, won: true, attempts: 8, hintsUsed: 10 })).toBe(XP_RULES.minWin);
  });

  it('derrota y rendición dan consolación', () => {
    expect(computeXp({ ...base, won: false, attempts: 8 })).toBe(XP_RULES.loss);
    expect(computeXp({ ...base, won: false, attempts: 2, gaveUp: true })).toBe(XP_RULES.giveUp);
  });
});

describe('getRankInfo', () => {
  it('empieza en Espectador', () => {
    const r = getRankInfo(0);
    expect(r.rank.name).toBe('Espectador');
    expect(r.progress).toBe(0);
  });

  it('cambia de rango exactamente en el umbral', () => {
    expect(getRankInfo(RANKS[1].minXp - 1).rank.name).toBe('Espectador');
    expect(getRankInfo(RANKS[1].minXp).rank.name).toBe('Cinéfilo');
  });

  it('rango máximo con progreso completo', () => {
    const r = getRankInfo(999_999);
    expect(r.rank.name).toBe('Leyenda');
    expect(r.next).toBeNull();
    expect(r.progress).toBe(1);
  });
});

describe('applyRound', () => {
  it('lleva racha, mejor racha y la reinicia al perder', () => {
    let p = createEmptyProfile();
    p = applyRound(p, { movieId: 1, won: true, attempts: 3, xp: 175 });
    p = applyRound(p, { movieId: 2, won: true, attempts: 5, xp: 145 });
    expect(p.currentStreak).toBe(2);
    p = applyRound(p, { movieId: 3, won: false, attempts: 8, xp: 10 });
    expect(p.currentStreak).toBe(0);
    expect(p.bestStreak).toBe(2);
    expect(p.xp).toBe(330);
    expect(p.distribution[2]).toBe(1);
    expect(getStats(p)).toMatchObject({ gamesPlayed: 3, winRate: 67, avgAttempts: 4 });
  });

  it('guarda solo las últimas películas sin duplicados', () => {
    let p = createEmptyProfile();
    for (let i = 0; i < RECENT_LIMIT + 5; i++) p = applyRound(p, { movieId: i, won: false, attempts: 8, xp: 0 });
    p = applyRound(p, { movieId: RECENT_LIMIT + 4, won: false, attempts: 8, xp: 0 });
    expect(p.recentIds).toHaveLength(RECENT_LIMIT);
    expect(new Set(p.recentIds).size).toBe(RECENT_LIMIT);
    expect(p.recentIds[0]).toBe(RECENT_LIMIT + 4);
  });
});

describe('hints', () => {
  it('oculta el título dentro de la pista', () => {
    expect(redactTitle('Bienvenidos a Matrix.', { title: 'Matrix', originalTitle: 'The Matrix' })).toBe('Bienvenidos a ▇▇▇.');
  });

  it('genera la pista de primera letra', () => {
    const hints = buildHints({
      id: 1, title: 'El laberinto del fauno', originalTitle: 'El laberinto del fauno', year: 2006, releaseDate: null,
      genres: [], directors: [], cast: [], runtime: 119, countries: [], originalLanguage: { code: 'es', name: 'Español' },
      posterPath: null, backdropPath: null, overview: '', tagline: '', companies: ['Tequila Gang'],
    });
    expect(hints.map((h) => h.id)).toEqual(['first-letter', 'company']);
    expect(hints[0].value).toContain('“E”');
  });
});
