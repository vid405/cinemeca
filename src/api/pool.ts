import type { MovieData } from '../game/types';
import { getMovieDetails, getMovieList, TmdbError, type TmdbListItem } from './tmdb';

/**
 * Selección aleatoria de la película secreta mezclando popular, top_rated y
 * discover (con idioma original y década al azar) para tener variedad mundial.
 */

const MIN_VOTES = 500;
const TMDB_MAX_PAGE = 500;

const LANGUAGES = ['es', 'fr', 'ja', 'ko', 'it', 'de', 'zh', 'cn', 'hi', 'pt', 'sv', 'da', 'ru', 'tr', 'fa', 'pl', 'no', 'nl', 'th', 'ta', 'te', 'ml'];

const DECADES: [number, number][] = [
  [1930, 1959],
  [1960, 1969],
  [1970, 1979],
  [1980, 1989],
  [1990, 1999],
  [2000, 2009],
  [2010, 2019],
  [2020, new Date().getFullYear()],
];

const SORTS = ['popularity.desc', 'vote_average.desc', 'vote_count.desc', 'revenue.desc'];

const randInt = (max: number) => Math.floor(Math.random() * max);
const pick = <T>(items: T[]): T => items[randInt(items.length)];

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Source {
  path: string;
  params: Record<string, string | number | boolean>;
  maxPage: number;
}

function randomSource(): Source {
  const r = Math.random();
  if (r < 0.2) return { path: '/movie/popular', params: {}, maxPage: 40 };
  if (r < 0.45) return { path: '/movie/top_rated', params: {}, maxPage: 80 };

  const params: Source['params'] = {
    include_adult: false,
    'vote_count.gte': MIN_VOTES,
    sort_by: pick(SORTS),
  };
  if (Math.random() < 0.55) params.with_original_language = pick(LANGUAGES);
  if (Math.random() < 0.5) {
    const [from, to] = pick(DECADES);
    params['primary_release_date.gte'] = `${from}-01-01`;
    params['primary_release_date.lte'] = `${to}-12-31`;
  }
  return { path: '/discover/movie', params, maxPage: 20 };
}

async function fetchCandidates(source: Source): Promise<TmdbListItem[]> {
  let page = 1 + randInt(source.maxPage);
  let data = await getMovieList(source.path, { ...source.params, page });
  // Si la página elegida no existe para estos filtros, pedimos una válida.
  if (data.results.length === 0 && data.total_pages > 0 && page > data.total_pages) {
    page = 1 + randInt(Math.min(data.total_pages, TMDB_MAX_PAGE));
    data = await getMovieList(source.path, { ...source.params, page });
  }
  return data.results;
}

const isPlayable = (m: MovieData) =>
  m.year != null && !!m.runtime && m.directors.length > 0 && m.genres.length > 0 && m.cast.length > 0;

/** `excludeIds` crece con cada partida (nunca se repite una jugada), así que hay margen de reintentos. */
export async function pickSecretMovie(excludeIds: ReadonlySet<number>, maxTries = 10): Promise<MovieData> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < maxTries; attempt++) {
    try {
      const candidates = shuffle(
        (await fetchCandidates(randomSource())).filter(
          (m) => !m.adult && m.poster_path && m.vote_count >= MIN_VOTES && !excludeIds.has(m.id),
        ),
      );
      for (const c of candidates.slice(0, 3)) {
        const details = await getMovieDetails(c.id);
        if (isPlayable(details)) return details;
      }
    } catch (err) {
      // Errores de red/autenticación no se arreglan reintentando con otra fuente.
      if (err instanceof TmdbError && (err.status === 401 || err.status === 0 || err.status === undefined)) throw err;
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new TmdbError('No se pudo elegir una película. Inténtalo de nuevo.');
}
