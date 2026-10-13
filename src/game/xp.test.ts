import { describe, expect, it } from 'vitest';
import { computeXp, getRankInfo, RANKS, XP_RULES } from './xp';
import { applyRound, createEmptyProfile, getStats, normalizeProfile, RECENT_LIMIT } from './progress';
import {
  buildHint,
  hintOptions,
  pickCastHint,
  pickRelatedFilm,
  redactTitle,
  sharesTitleWord,
  type HintDeps,
  type PersonCredit,
} from './hints';
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
  const schedule = [4, 8];
  it('una pista cada 4 intentos', () => {
    expect(unlockedHints(schedule, 3, 5)).toBe(0);
    expect(attemptsToNextHint(schedule, 3, 5)).toBe(1);
    expect(unlockedHints(schedule, 4, 5)).toBe(1);
    expect(attemptsToNextHint(schedule, 4, 5)).toBe(4);
    expect(unlockedHints(schedule, 8, 5)).toBe(2);
  });

  it('máximo 2 por partida aunque haya más opciones', () => {
    expect(unlockedHints(schedule, 10, 5)).toBe(2);
    expect(attemptsToNextHint(schedule, 9, 5)).toBeNull();
  });

  it('no desbloquea más pistas de las que existen', () => {
    expect(unlockedHints(schedule, 9, 1)).toBe(1);
    expect(attemptsToNextHint(schedule, 5, 1)).toBeNull();
  });
});

describe('hints', () => {
  it('oculta el título dentro de la pista', () => {
    expect(redactTitle('Bienvenidos a Matrix.', { title: 'Matrix', originalTitle: 'The Matrix' })).toBe('Bienvenidos a ▇▇▇.');
  });

  const p = (id: number) => ({ id, name: `Actor ${id}`, profilePath: null });
  const movie = (overrides: Partial<MovieData> = {}): MovieData => ({
    id: 1, title: 'El laberinto del fauno', originalTitle: 'El laberinto del fauno', year: 2006, releaseDate: null,
    genres: [], directors: [], cast: [p(1), p(2), p(3)], runtime: 119, revenue: null, score: null, certification: null,
    companies: [], countries: [], originalLanguage: { code: 'es', name: 'Español' }, posterPath: null, backdropPath: null,
    overview: 'En 1944, Ofelia descubre un laberinto. Allí conoce a un fauno.', tagline: '',
    keywords: ['fairy tale', 'spanish civil war', 'el laberinto del fauno'],
    ...overrides,
  });

  const credit = (id: number, title: string, voteCount = 5000, isFiller = false): PersonCredit => ({
    id, title, year: 2000, posterPath: null, voteCount, isFiller,
  });
  const noDeps: HintDeps = { personCredits: async () => [] };

  it('ofrece las 5 opciones y marca las que no tienen datos', () => {
    expect(hintOptions(movie({ directors: [p(50)] })).map((o) => [o.kind, o.available])).toEqual([
      ['tagline', true],
      ['cast', true],
      ['keywords', true],
      ['director-film', true],
      ['cast-film', true],
    ]);
    const empty = hintOptions(movie({ overview: '', cast: [], keywords: [], directors: [] }));
    expect(empty.every((o) => !o.available)).toBe(true);
  });

  it('frase: usa la tagline o, si falta, la primera frase de la sinopsis', async () => {
    expect(await buildHint('tagline', movie({ tagline: 'Un cuento.' }), [], noDeps)).toMatchObject({ label: 'Frase promocional', text: '“Un cuento.”' });
    expect(await buildHint('tagline', movie(), [], noDeps)).toMatchObject({ label: 'Fragmento de la sinopsis', text: '“En 1944, Ofelia descubre un laberinto.”' });
  });

  it('película relacionada: la más votada, sin la secreta, intentadas, secuelas ni documentales', () => {
    const secret = { id: 1, title: 'El laberinto del fauno', originalTitle: 'El laberinto del fauno' };
    const credits = [
      credit(1, 'El laberinto del fauno', 9000),
      credit(2, 'El regreso del fauno', 8000), // comparte "fauno": regalaría el título
      credit(3, 'Documental de rodaje', 7000, true),
      credit(4, 'Ya intentada', 6000),
      credit(5, 'Hellboy', 5000),
      credit(6, 'Cronos', 3000),
      credit(7, 'Desconocida', 20),
    ];
    expect(pickRelatedFilm(credits, secret, new Set([4]))?.title).toBe('Hellboy');
    expect(pickRelatedFilm([credit(7, 'Desconocida', 20)], secret, new Set())).toBeNull();
    expect(sharesTitleWord('Matrix Reloaded', 'The Matrix')).toBe(true);
    expect(sharesTitleWord('Hellboy', 'El laberinto del fauno')).toBe(false);
  });

  it('director y coestrella: buscan en la filmografía de cada persona en orden', async () => {
    const deps: HintDeps = {
      personCredits: async (id, role) =>
        role === 'director' ? [credit(10, 'Hellboy')] : id === 1 ? [] : id === 2 ? [credit(20, 'Volver')] : [],
    };
    const secret = movie({ directors: [p(50)] });
    expect(await buildHint('director-film', secret, [], deps)).toMatchObject({ label: 'Del mismo director', film: { title: 'Hellboy' } });
    // El actor 1 no tiene otras películas válidas, así que usa al actor 2.
    expect(await buildHint('cast-film', secret, [], deps)).toMatchObject({ label: 'Comparte actor con', film: { title: 'Volver' } });
    expect(await buildHint('cast-film', secret, [], noDeps)).toBeNull();
  });

  it('no repite la película que ya mostró la otra pista', async () => {
    const deps: HintDeps = { personCredits: async () => [credit(10, 'Rompenieves', 9000), credit(11, 'Memories of Murder', 4000)] };
    const secret = movie({ directors: [p(50)] });
    const first = await buildHint('director-film', secret, [], deps);
    expect(first?.film?.title).toBe('Rompenieves');
    const second = await buildHint('cast-film', secret, [], deps, [first!]);
    expect(second?.film?.title).toBe('Memories of Murder');
  });

  it('reparto: revela un secundario que el jugador no haya descubierto aún', () => {
    expect(pickCastHint(movie(), [])?.id).toBe(2);
    const found = movie({ id: 9, cast: [p(2)] });
    expect(pickCastHint(movie(), [found])?.id).toBe(3);
    const all = movie({ id: 9, cast: [p(2), p(3)] });
    expect(pickCastHint(movie(), [all])?.id).toBe(1);
  });

  it('temas: palabras clave con el título oculto', async () => {
    expect((await buildHint('keywords', movie(), [], noDeps))?.tags).toEqual(['fairy tale', 'spanish civil war', '▇▇▇']);
    expect(await buildHint('keywords', movie({ keywords: [] }), [], noDeps)).toBeNull();
  });
});
