import type { PersonCredit } from '../game/hints';
import type { Company, MovieData, MovieSuggestion, Person } from '../game/types';
import { countryName, languageName } from '../utils/i18n';

const API_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';
const LANGUAGE = 'es-ES';

const token = (import.meta.env.VITE_TMDB_TOKEN ?? '').trim();
const hasDirectToken = token.length > 0 && token !== 'pega_aqui_tu_token';

/**
 * En local se llama a TMDB directamente con VITE_TMDB_TOKEN (.env). Publicado (build sin
 * ese token), se usa el proxy /api/tmdb de Vercel, que guarda el token en el servidor
 * para que no quede expuesto en la página pública.
 */
const USE_PROXY = !hasDirectToken && import.meta.env.PROD;
const PROXY_PATH = '/api/tmdb';

export const isConfigured = () => hasDirectToken || USE_PROXY;

export type ImageSize = 'w45' | 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780';

export function imageUrl(path: string | null, size: ImageSize = 'w342'): string | null {
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
  if (!isConfigured()) throw new TmdbError('Falta configurar VITE_TMDB_TOKEN en el archivo .env.', 0);

  const url = USE_PROXY ? new URL(PROXY_PATH, window.location.origin) : new URL(API_BASE + path);
  if (USE_PROXY) url.searchParams.set('path', path);
  url.searchParams.set('language', LANGUAGE);
  for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, String(v));

  let res: Response;
  try {
    res = await fetch(url, {
      headers: USE_PROXY ? { accept: 'application/json' } : { Authorization: `Bearer ${token}`, accept: 'application/json' },
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    const offline = typeof navigator !== 'undefined' && !navigator.onLine;
    throw new TmdbError(offline ? 'Sin conexión a internet.' : 'No se pudo conectar con TMDB.');
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new TmdbError(
        USE_PROXY ? 'El token de TMDB del servidor no es válido. Revisa TMDB_TOKEN en Vercel.' : 'El token de TMDB no es válido. Revisa tu archivo .env.',
        401,
      );
    }
    if (USE_PROXY && res.status === 500) throw new TmdbError('Falta configurar TMDB_TOKEN en Vercel.', 500);
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

interface TmdbCredit {
  id: number;
  name: string;
  profile_path: string | null;
}

interface TmdbDetails {
  id: number;
  title: string;
  original_title: string;
  release_date?: string;
  runtime: number | null;
  revenue: number;
  vote_average: number;
  vote_count: number;
  genres: { id: number; name: string }[];
  origin_country?: string[];
  production_countries: { iso_3166_1: string; name: string }[];
  production_companies: { id: number; name: string; logo_path: string | null }[];
  original_language: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  tagline: string | null;
  credits?: {
    cast: (TmdbCredit & { order: number })[];
    crew: (TmdbCredit & { job: string })[];
  };
  release_dates?: {
    results: { iso_3166_1: string; release_dates: { certification: string; type: number }[] }[];
  };
  keywords?: { keywords: { id: number; name: string }[] };
}

// ---------- Normalización ----------

const yearOf = (date?: string | null) => (date && /^\d{4}/.test(date) ? Number(date.slice(0, 4)) : null);

const toPerson = ({ id, name, profile_path }: TmdbCredit): Person => ({ id, name, profilePath: profile_path });

function uniqueBy<T>(items: T[], key: (t: T) => string | number): T[] {
  const seen = new Set<string | number>();
  return items.filter((i) => (seen.has(key(i)) ? false : (seen.add(key(i)), true)));
}

/** Clasificación de EE. UU. si existe (es la más completa en TMDB); si no, la del país de origen o España. */
function pickCertification(d: TmdbDetails): string | null {
  const results = d.release_dates?.results ?? [];
  for (const code of ['US', ...(d.origin_country ?? []), 'ES', 'GB']) {
    const cert = results
      .find((r) => r.iso_3166_1 === code)
      ?.release_dates.map((r) => r.certification.trim())
      .find(Boolean);
    if (cert) return cert;
  }
  return null;
}

function toMovieData(d: TmdbDetails): MovieData {
  const crew = d.credits?.crew ?? [];
  const directors = uniqueBy(crew.filter((c) => c.job === 'Director').map(toPerson), (p) => p.id);
  const cast = [...(d.credits?.cast ?? [])]
    .sort((a, b) => a.order - b.order)
    .slice(0, 5)
    .map(toPerson);
  const countryCodes = d.origin_country?.length ? d.origin_country : d.production_countries.map((c) => c.iso_3166_1);
  const companies: Company[] = d.production_companies.map((c) => ({ id: c.id, name: c.name, logoPath: c.logo_path }));

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
    revenue: d.revenue > 0 ? d.revenue : null,
    score: d.vote_count > 0 ? Math.round(d.vote_average * 10) : null,
    certification: pickCertification(d),
    companies,
    countries: [...new Set(countryCodes)].map((code) => ({ code, name: countryName(code) })),
    originalLanguage: { code: d.original_language, name: languageName(d.original_language) },
    posterPath: d.poster_path,
    backdropPath: d.backdrop_path,
    overview: d.overview ?? '',
    tagline: d.tagline ?? '',
    keywords: d.keywords?.keywords.map((k) => k.name) ?? [],
  };
}

// ---------- API pública (con cache en memoria) ----------

const detailsCache = new Map<number, Promise<MovieData>>();

/** Detalles + créditos + clasificaciones + palabras clave en una sola llamada (append_to_response). */
export function getMovieDetails(id: number): Promise<MovieData> {
  const cached = detailsCache.get(id);
  if (cached) return cached;
  const promise = request<TmdbDetails>(`/movie/${id}`, {
    append_to_response: 'credits,release_dates,keywords',
  }).then(toMovieData);
  detailsCache.set(id, promise);
  promise.catch(() => detailsCache.delete(id));
  return promise;
}

export function getMovieList(path: string, params: Params): Promise<TmdbPaged<TmdbListItem>> {
  return request<TmdbPaged<TmdbListItem>>(path, params);
}

interface TmdbPersonCredit {
  id: number;
  title: string;
  release_date?: string;
  poster_path: string | null;
  vote_count: number;
  genre_ids?: number[];
  adult?: boolean;
  character?: string;
  job?: string;
}

const DOCUMENTARY_GENRE = 99;
const SELF_ROLE = /\b(him|her|them)sel(f|ves)\b|\bs[ií] mism[oa]\b|\bnarrator\b|\(voice\)|\buncredited\b/i;

const creditsCache = new Map<number, Promise<{ cast: TmdbPersonCredit[]; crew: TmdbPersonCredit[] }>>();

/** Filmografía de una persona: como director (crew job=Director) o como actor (cast). */
export async function getPersonCredits(personId: number, role: 'director' | 'actor'): Promise<PersonCredit[]> {
  let cached = creditsCache.get(personId);
  if (!cached) {
    cached = request<{ cast: TmdbPersonCredit[]; crew: TmdbPersonCredit[] }>(`/person/${personId}/movie_credits`);
    creditsCache.set(personId, cached);
    cached.catch(() => creditsCache.delete(personId));
  }
  const data = await cached;
  const list = role === 'director' ? data.crew.filter((c) => c.job === 'Director') : data.cast;
  return list.map((c) => ({
    id: c.id,
    title: c.title,
    year: yearOf(c.release_date),
    posterPath: c.poster_path,
    voteCount: c.vote_count,
    isFiller: Boolean(c.adult || c.genre_ids?.includes(DOCUMENTARY_GENRE) || (c.character && SELF_ROLE.test(c.character))),
  }));
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
