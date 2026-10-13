// Modelo de dominio independiente de TMDB: la capa api/ normaliza hacia estos tipos.

export interface Person {
  id: number;
  name: string;
  profilePath: string | null;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Company {
  id: number;
  name: string;
  logoPath: string | null;
}

export interface Country {
  code: string; // ISO 3166-1
  name: string;
}

export interface Language {
  code: string; // ISO 639-1 (tal como lo da TMDB)
  name: string;
}

export interface MovieData {
  id: number;
  title: string;
  originalTitle: string;
  year: number | null;
  releaseDate: string | null;
  genres: Genre[];
  directors: Person[];
  /** Reparto principal (top 5 por orden de créditos): [0] protagonista, [1..4] secundarios. */
  cast: Person[];
  runtime: number | null;
  /** Recaudación mundial en USD (null si TMDB no la tiene). */
  revenue: number | null;
  /** Puntuación media de TMDB en escala 0–100. */
  score: number | null;
  /** Clasificación por edades (preferentemente la de EE. UU.: G, PG, PG-13, R…). */
  certification: string | null;
  companies: Company[];
  countries: Country[];
  originalLanguage: Language;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  tagline: string;
  /** Palabras clave temáticas de TMDB (normalmente en inglés). */
  keywords: string[];
}

/** Resultado ligero del buscador con autocompletado. */
export interface MovieSuggestion {
  id: number;
  title: string;
  originalTitle: string;
  year: number | null;
  posterPath: string | null;
}

/** Verde / amarillo / sin coincidencia. */
export type Match = 'correct' | 'partial' | 'wrong';

/** Hacia dónde está la película secreta respecto al intento. */
export type Direction = 'up' | 'down' | null;
