import type { Country, Direction, Genre, Language, Match, MovieData, Person } from './types';

export const YEAR_TOLERANCE = 5;
export const RUNTIME_TOLERANCE = 15;

export interface NumericClue {
  value: number | null;
  match: Match;
  direction: Direction;
}

export interface SetClue<T> {
  values: T[];
  matched: T[];
  match: Match;
}

export interface ValueClue<T> {
  value: T;
  match: Match;
}

export interface ClueSet {
  year: NumericClue;
  genres: SetClue<Genre>;
  director: SetClue<Person>;
  cast: SetClue<Person>;
  runtime: NumericClue;
  country: SetClue<Country>;
  language: ValueClue<Language>;
}

export interface GuessResult {
  movie: MovieData;
  isCorrect: boolean;
  clues: ClueSet;
}

/**
 * Verde si es igual; amarillo si está dentro de la tolerancia; rojo si no.
 * La dirección indica si la secreta es mayor (↑) o menor (↓).
 */
export function compareNumber(guess: number | null, secret: number | null, tolerance: number): NumericClue {
  if (guess == null || secret == null) return { value: guess, match: 'wrong', direction: null };
  if (guess === secret) return { value: guess, match: 'correct', direction: null };
  return {
    value: guess,
    match: Math.abs(guess - secret) <= tolerance ? 'partial' : 'wrong',
    direction: secret > guess ? 'up' : 'down',
  };
}

/**
 * - 'exact': verde si los conjuntos son idénticos, amarillo si comparten alguno.
 * - 'any': verde si comparten al menos uno (p. ej. director en codirecciones).
 */
export function compareSets<T>(
  guess: T[],
  secret: T[],
  key: (item: T) => string | number,
  mode: 'exact' | 'any' = 'exact',
): SetClue<T> {
  const secretKeys = new Set(secret.map(key));
  const matched = guess.filter((g) => secretKeys.has(key(g)));
  if (guess.length === 0 || secret.length === 0 || matched.length === 0) {
    return { values: guess, matched, match: 'wrong' };
  }
  if (mode === 'any') return { values: guess, matched, match: 'correct' };

  const guessKeys = new Set(guess.map(key));
  const identical = guessKeys.size === secretKeys.size && [...guessKeys].every((k) => secretKeys.has(k));
  return { values: guess, matched, match: identical ? 'correct' : 'partial' };
}

export function compareValue<T>(guess: T, secret: T, key: (item: T) => string | number): ValueClue<T> {
  return { value: guess, match: key(guess) === key(secret) ? 'correct' : 'wrong' };
}

export function compareMovies(guess: MovieData, secret: MovieData): GuessResult {
  return {
    movie: guess,
    isCorrect: guess.id === secret.id,
    clues: {
      year: compareNumber(guess.year, secret.year, YEAR_TOLERANCE),
      genres: compareSets(guess.genres, secret.genres, (g) => g.id),
      director: compareSets(guess.directors, secret.directors, (p) => p.id, 'any'),
      cast: compareSets(guess.cast, secret.cast, (p) => p.id),
      runtime: compareNumber(guess.runtime, secret.runtime, RUNTIME_TOLERANCE),
      country: compareSets(guess.countries, secret.countries, (c) => c.code),
      language: compareValue(guess.originalLanguage, secret.originalLanguage, (l) => l.code),
    },
  };
}
