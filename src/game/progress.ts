import type { GameModeId } from './modes';

export const DISTRIBUTION_SLOTS = 10;

/** Modos con XP y rango propios. */
export type ModeKey = 'clues' | 'hollywood';
export const MODE_KEYS: ModeKey[] = ['hollywood', 'clues'];

/** Las partidas sin modo son antiguas: entonces solo existía Es Cine. */
export const modeKey = (mode?: GameModeId): ModeKey => (mode === 'hollywood' ? 'hollywood' : 'clues');

const emptyModeXp = (): Record<ModeKey, number> => ({ clues: 0, hollywood: 0 });

/** Una partida terminada, tal como se muestra en la Filmoteca. */
export interface PlayedMovie {
  movieId: number;
  title: string;
  originalTitle: string;
  year: number | null;
  posterPath: string | null;
  won: boolean;
  gaveUp: boolean;
  attempts: number;
  hintsUsed: number;
  xp: number;
  /** Modo en que se jugó (las partidas antiguas no lo tienen: eran del modo Es Cine). */
  mode?: GameModeId;
  /** Fecha ISO de cuándo terminó la partida. */
  playedAt: string;
}

export interface Profile {
  version: 1;
  /** XP total (suma de los modos). */
  xp: number;
  /** XP de cada modo: cada uno tiene su propio rango y nivel de dificultad. */
  modeXp: Record<ModeKey, number>;
  gamesPlayed: number;
  wins: number;
  currentStreak: number;
  bestStreak: number;
  /** Suma de intentos en partidas ganadas (para el promedio). */
  totalWinAttempts: number;
  /** distribution[i] = partidas ganadas en i+1 intentos. */
  distribution: number[];
  /** Todas las partidas jugadas, la más reciente primero. */
  history: PlayedMovie[];
  /** Películas jugadas antes de existir el historial (solo se conoce su id). */
  legacyPlayedIds: number[];
}

export function createEmptyProfile(): Profile {
  return {
    version: 1,
    xp: 0,
    modeXp: emptyModeXp(),
    gamesPlayed: 0,
    wins: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalWinAttempts: 0,
    distribution: Array(DISTRIBUTION_SLOTS).fill(0),
    history: [],
    legacyPlayedIds: [],
  };
}

export type RoundRecord = PlayedMovie;

export function applyRound(profile: Profile, round: RoundRecord): Profile {
  const currentStreak = round.won ? profile.currentStreak + 1 : 0;
  const distribution = [...profile.distribution];
  if (round.won && round.attempts >= 1) {
    const slot = Math.min(round.attempts, DISTRIBUTION_SLOTS) - 1;
    distribution[slot] = (distribution[slot] ?? 0) + 1;
  }
  // Fallar resta XP del modo jugado, pero el XP de un modo nunca baja de 0.
  const key = modeKey(round.mode);
  const modeXp = { ...profile.modeXp, [key]: Math.max(0, profile.modeXp[key] + round.xp) };
  return {
    ...profile,
    modeXp,
    xp: modeXp.clues + modeXp.hollywood,
    gamesPlayed: profile.gamesPlayed + 1,
    wins: profile.wins + (round.won ? 1 : 0),
    currentStreak,
    bestStreak: Math.max(profile.bestStreak, currentStreak),
    totalWinAttempts: profile.totalWinAttempts + (round.won ? round.attempts : 0),
    distribution,
    history: [round, ...profile.history.filter((h) => h.movieId !== round.movieId)],
  };
}

/** Reproduce el historial en orden para obtener el XP de cada modo (con el mínimo de 0). */
export function modeXpFromHistory(history: PlayedMovie[]): Record<ModeKey, number> {
  const xp = emptyModeXp();
  for (const h of [...history].sort((a, b) => a.playedAt.localeCompare(b.playedAt))) {
    const key = modeKey(h.mode);
    xp[key] = Math.max(0, xp[key] + h.xp);
  }
  return xp;
}

/** Todas las películas que ya salieron: nunca se vuelven a elegir como secretas. */
export function playedIds(profile: Profile): Set<number> {
  return new Set([...profile.history.map((h) => h.movieId), ...profile.legacyPlayedIds]);
}

export function getStats(profile: Profile) {
  return {
    gamesPlayed: profile.gamesPlayed,
    wins: profile.wins,
    winRate: profile.gamesPlayed ? Math.round((profile.wins / profile.gamesPlayed) * 100) : 0,
    avgAttempts: profile.wins ? Math.round((profile.totalWinAttempts / profile.wins) * 10) / 10 : 0,
    currentStreak: profile.currentStreak,
    bestStreak: profile.bestStreak,
  };
}

/** Rellena campos faltantes de perfiles guardados con versiones anteriores. */
export function normalizeProfile(raw: unknown): Profile {
  const base = createEmptyProfile();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<Profile> & { recentIds?: unknown };
  const p: Profile = { ...base, ...r };
  const dist = Array.isArray(r.distribution) ? r.distribution : [];
  p.distribution = Array.from({ length: DISTRIBUTION_SLOTS }, (_, i) => Number(dist[i]) || 0);
  p.history = Array.isArray(r.history) ? r.history : [];
  // Versiones anteriores guardaban solo los ids de las últimas 20 en `recentIds`.
  const legacy = [...(Array.isArray(r.legacyPlayedIds) ? r.legacyPlayedIds : []), ...(Array.isArray(r.recentIds) ? r.recentIds : [])];
  const inHistory = new Set(p.history.map((h) => h.movieId));
  p.legacyPlayedIds = [...new Set(legacy.filter((id): id is number => typeof id === 'number' && !inHistory.has(id)))];
  delete (p as { recentIds?: unknown }).recentIds;

  // Antes el XP era uno solo: se reparte por modo según el historial, y lo que no
  // está en el historial (partidas antiguas) va a Es Cine, el único modo de entonces.
  const m = r.modeXp;
  if (m && typeof m.clues === 'number' && typeof m.hollywood === 'number') {
    p.modeXp = { clues: Math.max(0, m.clues), hollywood: Math.max(0, m.hollywood) };
  } else {
    const fromHistory = modeXpFromHistory(p.history);
    const legacy = Math.max(0, (Number(r.xp) || 0) - fromHistory.clues - fromHistory.hollywood);
    p.modeXp = { clues: fromHistory.clues + legacy, hollywood: fromHistory.hollywood };
  }
  p.xp = p.modeXp.clues + p.modeXp.hollywood;
  return p;
}
