import { describe, expect, it } from 'vitest';
import { computeXp, getRankInfo, RANKS, XP_RULES } from './xp';
import { applyRound, createEmptyProfile, getStats, normalizeProfile, RECENT_LIMIT } from './progress';
import { buildHints, redactTitle } from './hints';
import { attemptsToNextHint, unlockedHints } from './modes';
import type { MovieData } from './types';

const base = { maxAttempts: 10, hintsUsed: 0, gaveUp: false };

describe('computeXp', () => {
  it('acierto al primer intento da base + bonus máximo', () => {
    expect(computeXp({ ...base, won: true, attempts: 1 })).toBe(XP_RULES.winBase + 9 * XP_RULES.perUnusedAttempt);
  });

  it('acierto en el último intento da solo la base', () => {
    expect(computeXp({ ...base, won: true, attempts: 10 })).toBe(XP_RULES.winBase);
  });

  it('las pistas restan XP, sin bajar del mínimo', () => {
    expect(computeXp({ ...base, won: true, attempts: 10, hintsUsed: 1 })).toBe(XP_RULES.winBase - XP_RULES.hintPenalty);
    expect(computeXp({ ...base, won: true, attempts: 10, hintsUsed: 10 })).toBe(XP_RULES.minWin);
  });

  it('derrota y rendición dan consolación', () => {
    expect(computeXp({ ...base, won: false, attempts: 10 })).toBe(XP_RULES.loss);
    expect(computeXp({ ...base, won: false, attempts: 2, gaveUp: true })).toBe(XP_RULES.giveUp);
  });
});

describe('getRankInfo', () => {
  it('empieza en Espectador y cambia exactamente en el umbral', () => {
    expect(getRankInfo(0)).toMatchObject({ rank: { name: 'Espectador' }, progress: 0 });
    expect(getRankInfo(RANKS[1].minXp - 1).rank.name).toBe('Espectador');
    expect(getRankInfo(RANKS[1].minXp).rank.name).toBe('Cinéfilo');
  });

  it('rango máximo con progreso completo', () => {
    expect(getRankInfo(999_999)).toMatchObject({ rank: { name: 'Leyenda' }, next: null, progress: 1 });
  });
});

describe('applyRound', () => {
  it('lleva racha, mejor racha y la reinicia al perder', () => {
    let p = createEmptyProfile();
    p = applyRound(p, { movieId: 1, won: true, attempts: 3, xp: 175 });
    p = applyRound(p, { movieId: 2, won: true, attempts: 5, xp: 145 });
    expect(p.currentStreak).toBe(2);
    p = applyRound(p, { movieId: 3, won: false, attempts: 10, xp: 10 });
    expect(p.currentStreak).toBe(0);
    expect(p.bestStreak).toBe(2);
    expect(p.xp).toBe(330);
    expect(p.distribution[2]).toBe(1);
    expect(getStats(p)).toMatchObject({ gamesPlayed: 3, winRate: 67, avgAttempts: 4 });
  });

  it('guarda solo las últimas películas sin duplicados', () => {
    let p = createEmptyProfile();
    for (let i = 0; i < RECENT_LIMIT + 5; i++) p = applyRound(p, { movieId: i, won: false, attempts: 10, xp: 0 });
    p = applyRound(p, { movieId: RECENT_LIMIT + 4, won: false, attempts: 10, xp: 0 });
    expect(p.recentIds).toHaveLength(RECENT_LIMIT);
    expect(new Set(p.recentIds).size).toBe(RECENT_LIMIT);
    expect(p.recentIds[0]).toBe(RECENT_LIMIT + 4);
  });

  it('migra perfiles con distribución de 8 casillas sin perder datos', () => {
    const p = normalizeProfile({ xp: 50, distribution: [1, 2, 3, 0, 0, 0, 0, 4] });
    expect(p.distribution).toEqual([1, 2, 3, 0, 0, 0, 0, 4, 0, 0]);
    expect(p.xp).toBe(50);
  });
});

describe('desbloqueo de pistas', () => {
  const schedule = [3, 6, 8];
  it('cuenta las pistas desbloqueadas y cuánto falta para la siguiente', () => {
    expect(unlockedHints(schedule, 2, 3)).toBe(0);
    expect(attemptsToNextHint(schedule, 2, 3)).toBe(1);
    expect(unlockedHints(schedule, 6, 3)).toBe(2);
    expect(attemptsToNextHint(schedule, 6, 3)).toBe(2);
    expect(attemptsToNextHint(schedule, 8, 3)).toBeNull();
  });

  it('no desbloquea más pistas de las que existen', () => {
    expect(unlockedHints(schedule, 9, 1)).toBe(1);
    expect(attemptsToNextHint(schedule, 4, 1)).toBeNull();
  });
});

describe('hints', () => {
  it('oculta el título dentro de la pista', () => {
    expect(redactTitle('Bienvenidos a Matrix.', { title: 'Matrix', originalTitle: 'The Matrix' })).toBe('Bienvenidos a ▇▇▇.');
  });

  it('genera pistas de origen y primera letra', () => {
    const movie: MovieData = {
      id: 1, title: 'El laberinto del fauno', originalTitle: 'El laberinto del fauno', year: 2006, releaseDate: null,
      genres: [], directors: [], cast: [], runtime: 119, revenue: null, score: null, certification: null, companies: [],
      countries: [{ code: 'ES', name: 'España' }], originalLanguage: { code: 'es', name: 'Español' },
      posterPath: null, backdropPath: null, overview: '', tagline: '',
    };
    const hints = buildHints(movie);
    expect(hints.map((h) => h.id)).toEqual(['origin', 'first-letter']);
    expect(hints[0].value).toBe('España · idioma original: español');
    expect(hints[1].value).toContain('“E”');
  });
});
