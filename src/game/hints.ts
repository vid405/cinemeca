import type { MovieData, Person } from './types';

export type HintKind = 'tagline' | 'cast' | 'keywords' | 'director-film' | 'cast-film';

/** Opción que se ofrece en el selector de pistas. */
export interface HintOption {
  kind: HintKind;
  title: string;
  description: string;
  available: boolean;
}

/** Película mostrada como pista (sin revelar a la persona que la conecta). */
export interface FilmRef {
  id: number;
  title: string;
  year: number | null;
  posterPath: string | null;
}

/** Entrada de la filmografía de una persona (de /person/{id}/movie_credits). */
export interface PersonCredit extends FilmRef {
  voteCount: number;
  /** Documentales, apariciones como "sí mismo"… no sirven como pista. */
  isFiller: boolean;
}

/** Pista ya revelada (contenido calculado en el momento de pedirla). */
export interface Hint {
  kind: HintKind;
  label: string;
  text?: string;
  person?: Person;
  tags?: string[];
  film?: FilmRef;
}

/** Mínimo de votos para que la película relacionada sea reconocible. */
const RELATED_MIN_VOTES = 150;
const STOP_WORDS = new Set(['the', 'los', 'las', 'una', 'del', 'and', 'de', 'la', 'el', 'parte', 'part']);

const titleWords = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));

/** ¿Comparten una palabra significativa? Sirve para no sugerir secuelas que regalen el título. */
export function sharesTitleWord(a: string, b: string): boolean {
  const wa = new Set(titleWords(a));
  return titleWords(b).some((w) => wa.has(w));
}

/**
 * La película relacionada más reconocible (más votada) que no sea la secreta, ni una ya
 * intentada, ni una secuela/precuela evidente, ni un documental o cameo.
 */
export function pickRelatedFilm(credits: PersonCredit[], secret: Pick<MovieData, 'id' | 'title' | 'originalTitle'>, excludeIds: ReadonlySet<number>): FilmRef | null {
  const best = credits
    .filter(
      (c) =>
        c.id !== secret.id &&
        !excludeIds.has(c.id) &&
        !c.isFiller &&
        c.voteCount >= RELATED_MIN_VOTES &&
        !sharesTitleWord(c.title, secret.title) &&
        !sharesTitleWord(c.title, secret.originalTitle),
    )
    .sort((a, b) => b.voteCount - a.voteCount)[0];
  return best ? { id: best.id, title: best.title, year: best.year, posterPath: best.posterPath } : null;
}

const MASK = '▇▇▇';
const MAX_TAGS = 6;

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Oculta el título (y el original) dentro de un texto para que la pista no lo regale. */
export function redactTitle(text: string, movie: Pick<MovieData, 'title' | 'originalTitle'>): string {
  let out = text;
  for (const t of [movie.title, movie.originalTitle]) {
    if (t && t.trim().length > 1) out = out.replace(new RegExp(escapeRegExp(t.trim()), 'gi'), MASK);
  }
  return out;
}

function firstSentence(text: string, max = 160): string {
  const sentence = text.split(/(?<=[.!?])\s/)[0] ?? text;
  return sentence.length > max ? `${sentence.slice(0, max).trimEnd()}…` : sentence;
}

export function hintOptions(movie: MovieData): HintOption[] {
  return [
    {
      kind: 'tagline',
      title: 'Frase',
      description: 'La frase promocional',
      available: Boolean(movie.tagline.trim() || movie.overview.trim()),
    },
    { kind: 'cast', title: 'Reparto', description: 'Un actor clave', available: movie.cast.length > 0 },
    { kind: 'keywords', title: 'Temas', description: 'Palabras clave de la trama', available: movie.keywords.length > 0 },
    {
      kind: 'director-film',
      title: 'Director',
      description: 'Otra película del mismo director',
      available: movie.directors.length > 0,
    },
    {
      kind: 'cast-film',
      title: 'Coestrella',
      description: 'Otra película con alguien del reparto',
      available: movie.cast.length > 0,
    },
  ];
}

/** Acceso a datos que necesitan algunas pistas (se inyecta para mantener esto puro y testeable). */
export interface HintDeps {
  personCredits(personId: number, role: 'director' | 'actor'): Promise<PersonCredit[]>;
}

/** Recorre las personas en orden y devuelve la primera película relacionada válida. */
async function findRelatedFilm(
  people: Person[],
  role: 'director' | 'actor',
  secret: MovieData,
  guesses: MovieData[],
  previous: Hint[],
  deps: HintDeps,
): Promise<FilmRef | null> {
  // Ni películas ya intentadas ni la que ya mostró otra pista.
  const exclude = new Set([...guesses.map((g) => g.id), ...previous.flatMap((h) => (h.film ? [h.film.id] : []))]);
  for (const person of people) {
    const film = pickRelatedFilm(await deps.personCredits(person.id, role), secret, exclude);
    if (film) return film;
  }
  return null;
}

/**
 * Actor a revelar: el primer secundario que el jugador aún no haya descubierto en sus
 * intentos; si ya los encontró todos, el protagonista; y si no, cualquiera.
 */
export function pickCastHint(secret: MovieData, guesses: MovieData[]): Person | null {
  const found = new Set(guesses.flatMap((g) => g.cast.map((p) => p.id)));
  const [lead, ...supporting] = secret.cast;
  return supporting.find((p) => !found.has(p.id)) ?? (lead && !found.has(lead.id) ? lead : null) ?? secret.cast[0] ?? null;
}

export async function buildHint(
  kind: HintKind,
  secret: MovieData,
  guesses: MovieData[],
  deps: HintDeps,
  previous: Hint[] = [],
): Promise<Hint | null> {
  switch (kind) {
    case 'director-film': {
      const film = await findRelatedFilm(secret.directors, 'director', secret, guesses, previous, deps);
      return film ? { kind, label: 'Del mismo director', film } : null;
    }
    case 'cast-film': {
      const film = await findRelatedFilm(secret.cast, 'actor', secret, guesses, previous, deps);
      return film ? { kind, label: 'Comparte actor con', film } : null;
    }
    case 'tagline': {
      const tagline = secret.tagline.trim();
      const phrase = tagline || (secret.overview.trim() ? firstSentence(secret.overview.trim()) : '');
      if (!phrase) return null;
      return {
        kind,
        label: tagline ? 'Frase promocional' : 'Fragmento de la sinopsis',
        text: `“${redactTitle(phrase, secret)}”`,
      };
    }
    case 'cast': {
      const person = pickCastHint(secret, guesses);
      return person ? { kind, label: 'Actor clave', person } : null;
    }
    case 'keywords': {
      const tags = secret.keywords.slice(0, MAX_TAGS).map((k) => redactTitle(k, secret));
      return tags.length ? { kind, label: 'Temas', tags } : null;
    }
  }
}
