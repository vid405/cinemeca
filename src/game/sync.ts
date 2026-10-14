import { applyRound, createEmptyProfile, DISTRIBUTION_SLOTS, type PlayedMovie, type Profile } from './progress';

/** Reconstruye XP, rachas y estadísticas reproduciendo el historial en orden cronológico. */
export function rebuildFromHistory(history: PlayedMovie[]): Profile {
  return [...history].sort((a, b) => a.playedAt.localeCompare(b.playedAt)).reduce(applyRound, createEmptyProfile());
}

/**
 * Lo que un perfil tiene "de más" respecto a su historial: partidas jugadas antes de que
 * existiera el historial. No se pueden deduplicar, así que al fusionar se toma el mayor.
 */
function legacyPart(p: Profile) {
  const fromHistory = rebuildFromHistory(p.history);
  return {
    xp: Math.max(0, p.xp - fromHistory.xp),
    gamesPlayed: Math.max(0, p.gamesPlayed - fromHistory.gamesPlayed),
    wins: Math.max(0, p.wins - fromHistory.wins),
    totalWinAttempts: Math.max(0, p.totalWinAttempts - fromHistory.totalWinAttempts),
    distribution: p.distribution.map((n, i) => Math.max(0, n - (fromHistory.distribution[i] ?? 0))),
  };
}

export interface MergeResult {
  profile: Profile;
  /** Películas nuevas que aportó el perfil importado. */
  added: number;
}

/**
 * Fusiona el progreso de otro dispositivo con el local. Es idempotente: importar dos
 * veces el mismo código (o uno antiguo) no duplica nada.
 */
export function mergeProfiles(local: Profile, incoming: Profile): MergeResult {
  const byId = new Map<number, PlayedMovie>();
  for (const h of [...local.history, ...incoming.history]) {
    const prev = byId.get(h.movieId);
    if (!prev || h.playedAt > prev.playedAt) byId.set(h.movieId, h);
  }
  const merged = rebuildFromHistory([...byId.values()]);
  const a = legacyPart(local);
  const b = legacyPart(incoming);
  const historyIds = new Set(byId.keys());

  // El XP anterior al historial no tiene modo: es de Es Cine, el único modo de entonces.
  const legacyXp = Math.max(a.xp, b.xp);
  const modeXp = { ...merged.modeXp, clues: merged.modeXp.clues + legacyXp };

  return {
    profile: {
      ...merged,
      modeXp,
      xp: modeXp.clues + modeXp.hollywood,
      gamesPlayed: merged.gamesPlayed + Math.max(a.gamesPlayed, b.gamesPlayed),
      wins: merged.wins + Math.max(a.wins, b.wins),
      totalWinAttempts: merged.totalWinAttempts + Math.max(a.totalWinAttempts, b.totalWinAttempts),
      distribution: Array.from(
        { length: DISTRIBUTION_SLOTS },
        (_, i) => (merged.distribution[i] ?? 0) + Math.max(a.distribution[i] ?? 0, b.distribution[i] ?? 0),
      ),
      bestStreak: Math.max(merged.bestStreak, local.bestStreak, incoming.bestStreak),
      legacyPlayedIds: [...new Set([...local.legacyPlayedIds, ...incoming.legacyPlayedIds])].filter((id) => !historyIds.has(id)),
    },
    added: byId.size - new Set(local.history.map((h) => h.movieId)).size,
  };
}
