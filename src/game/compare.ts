import type { Company, Direction, Genre, Match, MovieData, Person } from './types';

export const YEAR_TOLERANCE = 5;
export const SCORE_TOLERANCE = 5;
/** Taquilla: amarillo si está a ±25 % de la secreta. */
export const BOX_OFFICE_TOLERANCE = 0.25;

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

export interface PersonClue {
  person: Person;
  match: Match;
}

export interface ClueSet {
  genres: SetClue<Genre>;
  year: NumericClue;
  boxOffice: NumericClue;
  studio: { company: Company | null; match: Match };
  rated: { value: string | null; match: Match };
  score: NumericClue;
  directors: PersonClue[];
  lead: PersonClue | null;
  supporting: PersonClue[];
}

export interface GuessResult {
  movie: MovieData;
  isCorrect: boolean;
  clues: ClueSet;
}

/**
 * Verde si es igual; amarillo si está dentro de la tolerancia absoluta; sin
 * coincidencia si no. La dirección indica si la secreta es mayor (↑) o menor (↓).
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

/** Igual que compareNumber pero con tolerancia relativa (p. ej. 0.25 = ±25 %). */
export function compareRelative(guess: number | null, secret: number | null, ratio: number): NumericClue {
  if (!guess || !secret) return { value: guess || null, match: 'wrong', direction: null };
  return compareNumber(guess, secret, secret * ratio);
}

/** Verde si los conjuntos son idénticos, amarillo si comparten alguno. */
export function compareSets<T>(guess: T[], secret: T[], key: (item: T) => string | number): SetClue<T> {
  const secretKeys = new Set(secret.map(key));
  const matched = guess.filter((g) => secretKeys.has(key(g)));
  if (guess.length === 0 || secret.length === 0 || matched.length === 0) {
    return { values: guess, matched, match: 'wrong' };
  }
  const guessKeys = new Set(guess.map(key));
  const identical = guessKeys.size === secretKeys.size && [...guessKeys].every((k) => secretKeys.has(k));
  return { values: guess, matched, match: identical ? 'correct' : 'partial' };
}

/**
 * - Director: verde si dirigió la secreta.
 * - Protagonista: verde si es el protagonista de la secreta; amarillo si sale en su reparto principal.
 * - Secundarios: verde si es secundario en la secreta; amarillo si allí es el protagonista.
 */
export function comparePeople(guess: MovieData, secret: MovieData) {
  const secretDirectors = new Set(secret.directors.map((p) => p.id));
  const secretLead = secret.cast[0]?.id;
  const secretSupporting = new Set(secret.cast.slice(1).map((p) => p.id));
  const secretCast = new Set(secret.cast.map((p) => p.id));

  const directors: PersonClue[] = guess.directors
    .slice(0, 2)
    .map((person) => ({ person, match: secretDirectors.has(person.id) ? 'correct' : 'wrong' }));

  const leadPerson = guess.cast[0];
  const lead: PersonClue | null = leadPerson
    ? {
        person: leadPerson,
        match: leadPerson.id === secretLead ? 'correct' : secretCast.has(leadPerson.id) ? 'partial' : 'wrong',
      }
    : null;

  const supporting: PersonClue[] = guess.cast.slice(1, 5).map((person) => ({
    person,
    match: secretSupporting.has(person.id) ? 'correct' : person.id === secretLead ? 'partial' : 'wrong',
  }));

  return { directors, lead, supporting };
}

const MAJOR_STUDIOS =
  /warner bros|universal pictures|paramount|columbia pictures|20th century|searchlight|walt disney|pixar|dreamworks|marvel studios|lucasfilm|metro-goldwyn|new line|lionsgate|lions gate|\ba24\b|focus features|legendary|miramax|studio ghibli|toho|sony pictures|summit entertainment|blumhouse|illumination|amblin|studiocanal|gaumont|path[eé]|\bneon\b|netflix|amazon|apple/i;

/** El estudio "principal" a mostrar: un gran estudio conocido, si no el primero con logo, si no el primero. */
export function pickDisplayCompany(companies: Company[]): Company | null {
  return (
    companies.find((c) => c.logoPath && MAJOR_STUDIOS.test(c.name)) ??
    companies.find((c) => MAJOR_STUDIOS.test(c.name)) ??
    companies.find((c) => c.logoPath) ??
    companies[0] ??
    null
  );
}

export function compareStudio(guess: Company[], secret: Company[]): ClueSet['studio'] {
  const secretIds = new Set(secret.map((c) => c.id));
  const shared = guess.filter((c) => secretIds.has(c.id));
  return {
    company: shared.length ? pickDisplayCompany(shared) : pickDisplayCompany(guess),
    match: shared.length ? 'correct' : 'wrong',
  };
}

export function compareRated(guess: string | null, secret: string | null): ClueSet['rated'] {
  return { value: guess, match: guess != null && guess === secret ? 'correct' : 'wrong' };
}

export function compareMovies(guess: MovieData, secret: MovieData): GuessResult {
  return {
    movie: guess,
    isCorrect: guess.id === secret.id,
    clues: {
      genres: compareSets(guess.genres, secret.genres, (g) => g.id),
      year: compareNumber(guess.year, secret.year, YEAR_TOLERANCE),
      boxOffice: compareRelative(guess.revenue, secret.revenue, BOX_OFFICE_TOLERANCE),
      studio: compareStudio(guess.companies, secret.companies),
      rated: compareRated(guess.certification, secret.certification),
      score: compareNumber(guess.score, secret.score, SCORE_TOLERANCE),
      ...comparePeople(guess, secret),
    },
  };
}
