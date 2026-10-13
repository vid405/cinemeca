export const RECENT_LIMIT = 20;
export const DISTRIBUTION_SLOTS = 10;

export interface Profile {
  version: 1;
  xp: number;
  gamesPlayed: number;
  wins: number;
  currentStreak: number;
  bestStreak: number;
  /** Suma de intentos en partidas ganadas (para el promedio). */
  totalWinAttempts: number;
  /** distribution[i] = partidas ganadas en i+1 intentos. */
  distribution: number[];
  /** Últimas películas secretas, la más reciente primero. */
  recentIds: number[];
}

export function createEmptyProfile(): Profile {
  return {
    version: 1,
    xp: 0,
    gamesPlayed: 0,
    wins: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalWinAttempts: 0,
    distribution: Array(DISTRIBUTION_SLOTS).fill(0),
    recentIds: [],
  };
}

export interface RoundRecord {
  movieId: number;
  won: boolean;
  attempts: number;
  xp: number;
}

export function applyRound(profile: Profile, round: RoundRecord): Profile {
  const currentStreak = round.won ? profile.currentStreak + 1 : 0;
  const distribution = [...profile.distribution];
  if (round.won && round.attempts >= 1) {
    const slot = Math.min(round.attempts, DISTRIBUTION_SLOTS) - 1;
    distribution[slot] = (distribution[slot] ?? 0) + 1;
  }
  return {
    ...profile,
    xp: profile.xp + round.xp,
    gamesPlayed: profile.gamesPlayed + 1,
    wins: profile.wins + (round.won ? 1 : 0),
    currentStreak,
    bestStreak: Math.max(profile.bestStreak, currentStreak),
    totalWinAttempts: profile.totalWinAttempts + (round.won ? round.attempts : 0),
    distribution,
    recentIds: [round.movieId, ...profile.recentIds.filter((id) => id !== round.movieId)].slice(0, RECENT_LIMIT),
  };
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
  const p = { ...base, ...(raw as Partial<Profile>) };
  const dist = Array.isArray(p.distribution) ? p.distribution : [];
  p.distribution = Array.from({ length: DISTRIBUTION_SLOTS }, (_, i) => Number(dist[i]) || 0);
  if (!Array.isArray(p.recentIds)) p.recentIds = [];
  return p;
}
