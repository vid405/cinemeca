import type { HollywoodTier, WorldTier } from '../game/difficulty';
import type { MovieData } from '../game/types';
import { getMovieDetails, getMovieList, TmdbError, type TmdbListItem } from './tmdb';

/**
 * Selección aleatoria de la película secreta. Cada modo aporta su fuente según el
 * nivel del jugador: el modo Pistas mezcla popular, top_rated y discover (con idioma
 * y década al azar) para tener variedad mundial; Hollywood se limita a EE. UU.
 */

const TMDB_MAX_PAGE = 500;

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

export interface Source {
  path: string;
  params: Record<string, string | number | boolean>;
  maxPage: number;
  /** Votos mínimos que debe tener cada candidata. */
  minVotes: number;
  /** Año mínimo de estreno (también se filtra en popular/top_rated, que no lo admiten). */
  fromYear: number;
}

/** Fuente del modo Pistas: mezcla mundial acotada por el nivel. */
export function worldSource(tier: WorldTier): Source {
  const base = { minVotes: tier.minVotes, fromYear: tier.fromYear };
  const r = Math.random();
  if (r < 0.15) return { path: '/movie/popular', params: {}, maxPage: 40, ...base };
  if (r < 0.35) return { path: '/movie/top_rated', params: {}, maxPage: 80, ...base };

  const params: Source['params'] = {
    include_adult: false,
    sort_by: pick(SORTS),
    'primary_release_date.gte': `${tier.fromYear}-01-01`,
  };

  // Cine no anglófono: umbral de votos propio (tiene muchos menos) y más idiomas en cada nivel.
  if (Math.random() < tier.foreignShare) {
    params.with_original_language = pick(tier.languages);
    params['vote_count.gte'] = tier.foreignMinVotes;
    return { path: '/discover/movie', params, maxPage: 10, ...base, minVotes: tier.foreignMinVotes };
  }

  params['vote_count.gte'] = tier.minVotes;
  if (Math.random() < 0.5) {
    const decades = DECADES.filter(([, to]) => to >= tier.fromYear);
    const [from, to] = pick(decades);
    params['primary_release_date.gte'] = `${Math.max(from, tier.fromYear)}-01-01`;
    params['primary_release_date.lte'] = `${to}-12-31`;
  }
  return { path: '/discover/movie', params, maxPage: 30, ...base };
}

/** Fuente del modo Hollywood: cine de EE. UU. en inglés, acotado por el nivel. */
export function hollywoodSource(tier: HollywoodTier): Source {
  return {
    path: '/discover/movie',
    params: {
      include_adult: false,
      with_original_language: 'en',
      with_origin_country: 'US',
      'vote_count.gte': tier.minVotes,
      'primary_release_date.gte': `${tier.fromYear}-01-01`,
      sort_by: pick(SORTS),
    },
    maxPage: tier.pages,
    minVotes: tier.minVotes,
    fromYear: tier.fromYear,
  };
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

const releaseYear = (m: TmdbListItem) => (m.release_date ? Number(m.release_date.slice(0, 4)) : 0);

const isPlayable = (m: MovieData) =>
  m.year != null && !!m.runtime && m.directors.length > 0 && m.genres.length > 0 && m.cast.length > 0;

/** `excludeIds` crece con cada partida (nunca se repite una jugada), así que hay margen de reintentos. */
export async function pickSecretMovie(
  excludeIds: ReadonlySet<number>,
  sourceFor: (attempt: number) => Source,
  maxTries = 12,
): Promise<MovieData> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < maxTries; attempt++) {
    try {
      const source = sourceFor(attempt);
      const candidates = shuffle(
        (await fetchCandidates(source)).filter(
          (m) =>
            !m.adult &&
            m.poster_path &&
            m.vote_count >= source.minVotes &&
            releaseYear(m) >= source.fromYear &&
            !excludeIds.has(m.id),
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
