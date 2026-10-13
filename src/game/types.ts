// Modelo de dominio independiente de TMDB: la capa api/ normaliza hacia estos tipos.

export interface Person {
  id: number;
  name: string;
}

export interface Genre {
  id: number;
  name: string;
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
  /** Reparto principal (top 5 por orden de créditos). */
  cast: Person[];
  runtime: number | null;
  countries: Country[];
  originalLanguage: Language;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  tagline: string;
  companies: string[];
}

/** Resultado ligero del buscador con autocompletado. */
export interface MovieSuggestion {
  id: number;
  title: string;
  originalTitle: string;
  year: number | null;
  posterPath: string | null;
}

/** Verde / amarillo / rojo. */
export type Match = 'correct' | 'partial' | 'wrong';

/** Hacia dónde está la película secreta respecto al intento. */
export type Direction = 'up' | 'down' | null;
