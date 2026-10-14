import { computeXp, getRankInfo, RANKS, type ScoreInput } from './xp';

/**
 * Nivel de dificultad ligado al rango del jugador: cada rango amplía el grupo de
 * películas (menos famosas, más antiguas), quita intentos y pistas, da más XP al
 * acertar y resta más al fallar.
 */
export interface DifficultyTier {
  level: number;
  rank: string;
  /** Año más antiguo que puede salir. */
  fromYear: number;
  maxAttempts: number;
  /** hintSchedule[i] = intentos necesarios para desbloquear la pista i. */
  hintSchedule: number[];
  /** XP extra al acertar. */
  winBonus: number;
  /** XP que se pierde al fallar o rendirse. */
  lossPenalty: number;
}

/** Reglas de una partida, fijadas al empezar según el modo y el nivel. */
export interface RoundRules {
  maxAttempts: number;
  hintSchedule: number[];
  tier?: DifficultyTier;
}

/**
 * Hollywood: los grandes éxitos. Sobre todo cine de EE. UU. en inglés (~330, ~600,
 * ~1.300, ~2.400 y ~4.000 películas por nivel, medido en TMDB), más cine
 * internacional premiado: una lista curada (ver data/acclaimedInternational.ts) y
 * una búsqueda de películas extranjeras o británicas con nota ≥ 7,5.
 */
export interface HollywoodTier extends DifficultyTier {
  minVotes: number;
  /** Páginas aproximadas de resultados en /discover (20 por página). */
  pages: number;
  /** Votos mínimos del cine internacional premiado (~31, ~60, ~95, ~170 y ~310 películas). */
  intlMinVotes: number;
  /** Probabilidad de buscar en cine internacional premiado en vez de en EE. UU. */
  intlShare: number;
}

export const HOLLYWOOD_TIERS: HollywoodTier[] = [
  { level: 0, rank: RANKS[0].name, minVotes: 10000, intlMinVotes: 4000, intlShare: 0.1, fromYear: 1990, maxAttempts: 10, hintSchedule: [4, 8], winBonus: 0, lossPenalty: 15, pages: 16 },
  { level: 1, rank: RANKS[1].name, minVotes: 7000, intlMinVotes: 3000, intlShare: 0.12, fromYear: 1980, maxAttempts: 10, hintSchedule: [4, 8], winBonus: 20, lossPenalty: 25, pages: 30 },
  { level: 2, rank: RANKS[2].name, minVotes: 4000, intlMinVotes: 2000, intlShare: 0.15, fromYear: 1970, maxAttempts: 9, hintSchedule: [5, 8], winBonus: 40, lossPenalty: 35, pages: 63 },
  { level: 3, rank: RANKS[3].name, minVotes: 2000, intlMinVotes: 1200, intlShare: 0.18, fromYear: 1960, maxAttempts: 8, hintSchedule: [5], winBonus: 60, lossPenalty: 50, pages: 120 },
  { level: 4, rank: RANKS[4].name, minVotes: 1000, intlMinVotes: 700, intlShare: 0.2, fromYear: 1940, maxAttempts: 8, hintSchedule: [6], winBonus: 80, lossPenalty: 65, pages: 200 },
];

/** Probabilidad de que la secreta de Hollywood salga de la lista curada internacional. */
export const CURATED_SHARE = 0.15;
/** Nota mínima (0–10) del cine internacional que entra en Hollywood por búsqueda. */
export const ACCLAIMED_MIN_RATING = 7.5;

/**
 * Es Cine (cine mundial). El cine no anglófono tiene muchos menos votos en TMDB
 * (p. ej. solo ~17 películas en español superan 2.000), así que lleva su propio
 * umbral y se abre a más idiomas en cada nivel. Castiga algo menos que Hollywood
 * porque adivinar cine de todo el mundo ya es más difícil.
 */
export interface WorldTier extends DifficultyTier {
  minVotes: number;
  foreignMinVotes: number;
  /** Probabilidad de que la búsqueda se centre en cine no anglófono. */
  foreignShare: number;
  languages: string[];
}

const LANGS_1 = ['es', 'fr', 'ja', 'ko', 'it', 'de'];
const LANGS_2 = [...LANGS_1, 'zh', 'pt', 'sv', 'da'];
const LANGS_3 = [...LANGS_2, 'hi', 'ru'];
const LANGS_4 = [...LANGS_3, 'tr', 'fa', 'pl', 'no', 'nl', 'th'];
const LANGS_5 = [...LANGS_4, 'cn', 'ta', 'te', 'ml'];

export const WORLD_TIERS: WorldTier[] = [
  { level: 0, rank: RANKS[0].name, minVotes: 2000, foreignMinVotes: 1000, fromYear: 1980, foreignShare: 0.25, languages: LANGS_1, maxAttempts: 10, hintSchedule: [4, 8], winBonus: 0, lossPenalty: 10 },
  { level: 1, rank: RANKS[1].name, minVotes: 1000, foreignMinVotes: 600, fromYear: 1970, foreignShare: 0.35, languages: LANGS_2, maxAttempts: 10, hintSchedule: [4, 8], winBonus: 15, lossPenalty: 20 },
  { level: 2, rank: RANKS[2].name, minVotes: 500, foreignMinVotes: 400, fromYear: 1960, foreignShare: 0.45, languages: LANGS_3, maxAttempts: 9, hintSchedule: [5, 8], winBonus: 30, lossPenalty: 30 },
  { level: 3, rank: RANKS[3].name, minVotes: 300, foreignMinVotes: 250, fromYear: 1950, foreignShare: 0.55, languages: LANGS_4, maxAttempts: 9, hintSchedule: [5], winBonus: 45, lossPenalty: 40 },
  { level: 4, rank: RANKS[4].name, minVotes: 200, foreignMinVotes: 150, fromYear: 1930, foreignShare: 0.65, languages: LANGS_5, maxAttempts: 8, hintSchedule: [6], winBonus: 60, lossPenalty: 55 },
];

/** Nivel que corresponde al XP actual. */
export function tierFor<T extends DifficultyTier>(tiers: T[], xp: number): T {
  return tiers[Math.min(getRankInfo(xp).index, tiers.length - 1)];
}

export function rulesFor(tier: DifficultyTier): RoundRules {
  return { maxAttempts: tier.maxAttempts, hintSchedule: tier.hintSchedule, tier };
}

/** Acertar da el XP normal más el bonus del nivel; fallar o rendirse resta XP. */
export function tieredXp(input: ScoreInput, tier: DifficultyTier): number {
  if (!input.won) return -tier.lossPenalty;
  return computeXp(input) + tier.winBonus;
}

/**
 * Nivel con el que buscar película en el intento `attempt` de selección: si el nivel
 * propio está casi agotado (ya jugaste casi todas), se abre al siguiente.
 */
export function relaxedTier<T extends DifficultyTier>(tiers: T[], level: number, attempt: number, triesPerTier = 4): T {
  return tiers[Math.min(level + Math.floor(attempt / triesPerTier), tiers.length - 1)];
}
