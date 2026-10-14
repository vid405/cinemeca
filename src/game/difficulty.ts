import { computeXp, getRankInfo, RANKS, type ScoreInput } from './xp';

/** Reglas de una partida (pueden depender del nivel del jugador). */
export interface RoundRules {
  maxAttempts: number;
  /** hintSchedule[i] = intentos necesarios para desbloquear la pista i. */
  hintSchedule: number[];
  /** Nivel de dificultad aplicado (solo en modos que escalan). */
  tier?: HollywoodTier;
}

/**
 * Nivel del modo Hollywood: cada rango del jugador amplía el grupo de películas
 * (menos famosas y más antiguas), quita intentos y pistas y castiga más perder.
 * Tamaños aproximados del grupo medidos en TMDB (origen EE. UU., inglés).
 */
export interface HollywoodTier {
  level: number;
  rank: string;
  minVotes: number;
  fromYear: number;
  maxAttempts: number;
  hintSchedule: number[];
  /** XP extra al acertar. */
  winBonus: number;
  /** XP que se pierde al fallar o rendirse. */
  lossPenalty: number;
  /** Páginas aproximadas de resultados en /discover (20 por página). */
  pages: number;
}

export const HOLLYWOOD_TIERS: HollywoodTier[] = [
  { level: 0, rank: RANKS[0].name, minVotes: 10000, fromYear: 1990, maxAttempts: 10, hintSchedule: [4, 8], winBonus: 0, lossPenalty: 15, pages: 16 },
  { level: 1, rank: RANKS[1].name, minVotes: 7000, fromYear: 1980, maxAttempts: 10, hintSchedule: [4, 8], winBonus: 20, lossPenalty: 25, pages: 30 },
  { level: 2, rank: RANKS[2].name, minVotes: 4000, fromYear: 1970, maxAttempts: 9, hintSchedule: [5, 8], winBonus: 40, lossPenalty: 35, pages: 63 },
  { level: 3, rank: RANKS[3].name, minVotes: 2000, fromYear: 1960, maxAttempts: 8, hintSchedule: [5], winBonus: 60, lossPenalty: 50, pages: 120 },
  { level: 4, rank: RANKS[4].name, minVotes: 1000, fromYear: 1940, maxAttempts: 8, hintSchedule: [6], winBonus: 80, lossPenalty: 65, pages: 200 },
];

export function hollywoodTier(xp: number): HollywoodTier {
  return HOLLYWOOD_TIERS[Math.min(getRankInfo(xp).index, HOLLYWOOD_TIERS.length - 1)];
}

export function hollywoodRules(xp: number): RoundRules {
  const tier = hollywoodTier(xp);
  return { maxAttempts: tier.maxAttempts, hintSchedule: tier.hintSchedule, tier };
}

/** Acertar da el XP normal más el bonus del nivel; fallar o rendirse resta XP. */
export function hollywoodXp(input: ScoreInput, tier: HollywoodTier): number {
  if (!input.won) return -tier.lossPenalty;
  return computeXp(input) + tier.winBonus;
}
