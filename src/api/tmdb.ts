import type { MovieData, MovieSuggestion, Person } from '../game/types';
import { countryName, languageName } from '../utils/i18n';

const API_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';
const LANGUAGE = 'es-ES';

const token = (import.meta.env.VITE_TMDB_TOKEN ?? '').trim();

export const hasToken = () => token.length > 0 && token !== 'pega_aqui_tu_token';

export type PosterSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780';

export function imageUrl(path: string | null, size: PosterSize = 'w342'): string | null {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export class TmdbError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'TmdbError';
  }
}

type Params = Record<string, string | number | boolean | undefined>;

async function request<T>(path: string, params: Params = {}, signal?: AbortSignal): Promise<T> {
  if (!hasToken()) throw new TmdbError('Falta configurar VITE_TMDB_TOKEN en el archivo .env.', 0);

  const url = new URL(API_BASE + path);
  url.searchParams.set('language', LANGUAGE);
  for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, String(v));

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, accept: 'application/json' },
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    const offline = typeof navigator !== 'undefined' && !navigator.onLine;
    throw new TmdbError(offline ? 'Sin conexión a internet.' : 'No se pudo conectar con TMDB.');
  }

  if (!res.ok) {
    if (res.status === 401) throw new TmdbError('El token de TMDB no es válido. Revisa tu archivo .env.', 401);
    if (res.status === 404) throw new TmdbError('No se encontró la película en TMDB.', 404);
    if (res.status === 429) throw new TmdbError('Demasiadas peticiones a TMDB. Espera un momento.', 429);
    throw new TmdbError(`TMDB respondió con un error (${res.status}).`, res.status);
  }
  return res.json() as Promise<T>;
}

// ---------- Tipos crudos de TMDB ----------

export interface TmdbListItem {
  id: number;
  title: string;
  original_title: string;
  release_date?: string;
  poster_path: string | null;
  adult?: boolean;
  vote_count: number;
  popularity: number;
  original_language: string;
}

export interface TmdbPaged<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

interface TmdbDetails {
  id: number;
  title: string;
  original_title: string;
  release_date?: string;
  runtime: number | null;
  genres: { id: number; name: string }[];
  origin_country?: string[];
  production_countries: { iso_3166_1: string; name: string }[];
  production_companies: { id: number; name: string }[];
  original_language: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  tagline: string | null;
  credits?: {
    cast: { id: number; name: string; order: number }[];
    crew: { id: number; name: string; job: string }[];
  };
}

// ---------- Normalización ----------

const yearOf = (date?: string | null) => (date && /^\d{4}/.test(date) ? Number(date.slice(0, 4)) : null);

function uniqueBy<T>(items: T[], key: (t: T) => string | number): T[] {
  const seen = new Set<string | number>();
  return items.filter((i) => (seen.has(key(i)) ? false : (seen.add(key(i)), true)));
}

function toMovieData(d: TmdbDetails): MovieData {
  const crew = d.credits?.crew ?? [];
  const directors: Person[] = uniqueBy(
    crew.filter((c) => c.job === 'Director').map(({ id, name }) => ({ id, name })),
    (p) => p.id,
  );
  const cast: Person[] = [...(d.credits?.cast ?? [])]
    .sort((a, b) => a.order - b.order)
    .slice(0, 5)
    .map(({ id, name }) => ({ id, name }));
  const countryCodes = d.origin_country?.length ? d.origin_country : d.production_countries.map((c) => c.iso_3166_1);

  return {
    id: d.id,
    title: d.title,
    originalTitle: d.original_title,
    year: yearOf(d.release_date),
    releaseDate: d.release_date || null,
    genres: d.genres.map(({ id, name }) => ({ id, name })),
    directors,
    cast,
    runtime: d.runtime || null,
    countries: [...new Set(countryCodes)].map((code) => ({ code, name: countryName(code) })),
    originalLanguage: { code: d.original_language, name: languageName(d.original_language) },
    posterPath: d.poster_path,
    backdropPath: d.backdrop_path,
    overview: d.overview ?? '',
    tagline: d.tagline ?? '',
    companies: d.production_companies.map((c) => c.name),
  };
}

// ---------- API pública (con cache en memoria) ----------

const detailsCache = new Map<number, Promise<MovieData>>();

/** Detalles + créditos en una sola llamada (append_to_response). */
export function getMovieDetails(id: number): Promise<MovieData> {
  const cached = detailsCache.get(id);
  if (cached) return cached;
  const promise = request<TmdbDetails>(`/movie/${id}`, { append_to_response: 'credits' }).then(toMovieData);
  detailsCache.set(id, promise);
  promise.catch(() => detailsCache.delete(id));
  return promise;
}

export function getMovieList(path: string, params: Params): Promise<TmdbPaged<TmdbListItem>> {
  return request<TmdbPaged<TmdbListItem>>(path, params);
}

const searchCache = new Map<string, MovieSuggestion[]>();
const SEARCH_CACHE_MAX = 100;

export async function searchMovies(query: string, signal?: AbortSignal): Promise<MovieSuggestion[]> {
  const key = query.trim().toLowerCase();
  const cached = searchCache.get(key);
  if (cached) return cached;

  const data = await request<TmdbPaged<TmdbListItem>>('/search/movie', { query: key, include_adult: false, page: 1 }, signal);
  const results = data.results
    .filter((m) => !m.adult)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 8)
    .map((m) => ({
      id: m.id,
      title: m.title,
      originalTitle: m.original_title,
      year: yearOf(m.release_date),
      posterPath: m.poster_path,
    }));

  if (searchCache.size >= SEARCH_CACHE_MAX) searchCache.delete(searchCache.keys().next().value as string);
  searchCache.set(key, results);
  return results;
}
