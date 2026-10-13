import type { MovieData } from './types';

export interface Hint {
  id: string;
  label: string;
  value: string;
}

const MASK = '▇▇▇';

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

/** Pistas en orden de revelado. */
export function buildHints(movie: MovieData): Hint[] {
  const hints: Hint[] = [];

  const phrase = movie.tagline.trim() || (movie.overview.trim() ? firstSentence(movie.overview.trim()) : '');
  if (phrase) {
    hints.push({
      id: 'tagline',
      label: movie.tagline.trim() ? 'Frase promocional' : 'Fragmento de la sinopsis',
      value: `“${redactTitle(phrase, movie)}”`,
    });
  }

  const origin = [
    movie.countries.map((c) => c.name).join(', '),
    movie.originalLanguage.name && `idioma original: ${movie.originalLanguage.name.toLowerCase()}`,
  ].filter(Boolean);
  if (origin.length) hints.push({ id: 'origin', label: 'Origen', value: origin.join(' · ') });

  const title = movie.title.trim();
  if (title) {
    const letters = title.replace(/[^\p{L}\p{N}]/gu, '').length;
    const words = title.split(/\s+/).length;
    hints.push({
      id: 'first-letter',
      label: 'Título',
      value: `Empieza por “${title[0].toUpperCase()}” · ${words} ${words === 1 ? 'palabra' : 'palabras'}, ${letters} caracteres`,
    });
  }

  return hints;
}
