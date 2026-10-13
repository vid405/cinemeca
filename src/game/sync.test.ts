import { describe, expect, it } from 'vitest';
import { decodeProfile, encodeProfile, TransferCodeError } from '../store/transfer';
import { applyRound, createEmptyProfile, playedIds, type PlayedMovie, type Profile } from './progress';
import { mergeProfiles, rebuildFromHistory } from './sync';

const game = (movieId: number, won: boolean, day: number, xp = won ? 160 : 10): PlayedMovie => ({
  movieId, title: `Peli ${movieId}`, originalTitle: `Peli ${movieId}`, year: 2000, posterPath: `/p${movieId}.jpg`,
  won, gaveUp: false, attempts: won ? 4 : 10, hintsUsed: 0, xp, playedAt: `2026-10-${String(day).padStart(2, '0')}T20:00:00.000Z`,
});

const profileOf = (games: PlayedMovie[]): Profile =>
  [...games].sort((a, b) => a.playedAt.localeCompare(b.playedAt)).reduce(applyRound, createEmptyProfile());

describe('mergeProfiles', () => {
  const pc = profileOf([game(1, true, 1), game(2, false, 3)]);
  const phone = profileOf([game(3, true, 2), game(4, true, 4)]);

  it('une las Filmotecas y recalcula estadísticas en orden cronológico', () => {
    const { profile, added } = mergeProfiles(pc, phone);
    expect(added).toBe(2);
    expect(profile.history.map((h) => h.movieId)).toEqual([4, 2, 3, 1]); // la más reciente primero
    expect(profile.gamesPlayed).toBe(4);
    expect(profile.wins).toBe(3);
    expect(profile.xp).toBe(160 + 10 + 160 + 160);
    // Orden real: gana(1), gana(3), pierde(2), gana(4) → racha actual 1, mejor 2.
    expect(profile.currentStreak).toBe(1);
    expect(profile.bestStreak).toBe(2);
  });

  it('es idempotente: importar el mismo código dos veces no duplica nada', () => {
    const once = mergeProfiles(pc, phone).profile;
    const twice = mergeProfiles(once, phone);
    expect(twice.added).toBe(0);
    expect(twice.profile).toEqual(once);
  });

  it('importar en cualquier dirección da el mismo resultado', () => {
    const a = mergeProfiles(pc, phone).profile;
    const b = mergeProfiles(phone, pc).profile;
    expect(a.history).toEqual(b.history);
    expect(a.xp).toBe(b.xp);
  });

  it('conserva el progreso anterior al historial sin contarlo dos veces', () => {
    const legacy: Profile = { ...pc, xp: pc.xp + 165, gamesPlayed: pc.gamesPlayed + 1, wins: pc.wins + 1, legacyPlayedIds: [99] };
    const { profile } = mergeProfiles(legacy, phone);
    expect(profile.xp).toBe(rebuildFromHistory([...pc.history, ...phone.history]).xp + 165);
    expect(profile.gamesPlayed).toBe(5);
    expect(playedIds(profile).has(99)).toBe(true);
    expect(mergeProfiles(profile, legacy).profile.xp).toBe(profile.xp);
  });
});

describe('código de transferencia', () => {
  it('ida y vuelta sin pérdidas, aun con un historial grande', async () => {
    const big = profileOf(Array.from({ length: 300 }, (_, i) => game(i + 1, i % 3 !== 0, (i % 28) + 1)));
    const code = await encodeProfile(big);
    expect(code.startsWith('CINEMECA1:')).toBe(true);
    expect(await decodeProfile(code)).toEqual(big);
  });

  it('tolera espacios y saltos de línea al pegar', async () => {
    const code = await encodeProfile(profileOf([game(1, true, 1)]));
    const messy = `  ${code.slice(0, 20)}\n${code.slice(20)}  `;
    expect((await decodeProfile(messy)).history).toHaveLength(1);
  });

  it('rechaza códigos ajenos o cortados', async () => {
    await expect(decodeProfile('hola')).rejects.toBeInstanceOf(TransferCodeError);
    const code = await encodeProfile(profileOf([game(1, true, 1)]));
    await expect(decodeProfile(code.slice(0, code.length - 15))).rejects.toBeInstanceOf(TransferCodeError);
  });
});
