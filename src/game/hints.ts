import type { MovieData, Person } from './types';

export type HintKind = 'tagline' | 'cast' | 'keywords';

/** Opción que se ofrece en el selector de pistas. */
export interface HintOption {
  kind: HintKind;
  title: string;
  description: string;
  available: boolean;
}

/** Pista ya revelada (contenido calculado en el momento de pedirla). */
export interface Hint {
  kind: HintKind;
  label: string;
  text?: string;
  person?: Person;
  tags?: string[];
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
  ];
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

export function buildHint(kind: HintKind, secret: MovieData, guesses: MovieData[]): Hint | null {
  switch (kind) {
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
