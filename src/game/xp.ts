export const XP_RULES = {
  winBase: 100,
  /** Bonus por cada intento que sobró. */
  perUnusedAttempt: 15,
  /** Penalización por cada pista usada. */
  hintPenalty: 25,
  /** Un acierto nunca da menos que esto. */
  minWin: 25,
  /** Consolación al agotar los intentos. */
  loss: 10,
  /** Consolación al rendirse. */
  giveUp: 5,
} as const;

export interface ScoreInput {
  won: boolean;
  gaveUp: boolean;
  attempts: number;
  maxAttempts: number;
  hintsUsed: number;
}

export function computeXp({ won, gaveUp, attempts, maxAttempts, hintsUsed }: ScoreInput): number {
  if (!won) return gaveUp ? XP_RULES.giveUp : XP_RULES.loss;
  const unused = Math.max(0, maxAttempts - attempts);
  const raw = XP_RULES.winBase + unused * XP_RULES.perUnusedAttempt - hintsUsed * XP_RULES.hintPenalty;
  return Math.max(XP_RULES.minWin, raw);
}

export interface Rank {
  name: string;
  minXp: number;
}

export const RANKS: Rank[] = [
  { name: 'Espectador', minXp: 0 },
  { name: 'Cinéfilo', minXp: 500 },
  { name: 'Crítico', minXp: 1500 },
  { name: 'Director', minXp: 3500 },
  { name: 'Leyenda', minXp: 7000 },
];

export interface RankInfo {
  rank: Rank;
  index: number;
  next: Rank | null;
  /** 0..1 dentro del rango actual (1 en el rango máximo). */
  progress: number;
  xpIntoRank: number;
  xpForNext: number | null;
}

export function getRankInfo(xp: number): RankInfo {
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].minXp) index = i;
  const rank = RANKS[index];
  const next = RANKS[index + 1] ?? null;
  const xpIntoRank = xp - rank.minXp;
  if (!next) return { rank, index, next, progress: 1, xpIntoRank, xpForNext: null };
  const span = next.minXp - rank.minXp;
  return { rank, index, next, progress: Math.min(1, xpIntoRank / span), xpIntoRank, xpForNext: span };
}
