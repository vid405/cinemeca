import { describe, expect, it } from 'vitest';
import {
  compareMovies,
  compareNumber,
  compareRated,
  compareRelative,
  compareSets,
  compareStudio,
  SCORE_TOLERANCE,
  YEAR_TOLERANCE,
} from './compare';
import type { MovieData, Person } from './types';

const person = (id: number, name = `Persona ${id}`): Person => ({ id, name, profilePath: null });

function movie(overrides: Partial<MovieData> = {}): MovieData {
  return {
    id: 1,
    title: 'Secreta',
    originalTitle: 'Secreta',
    year: 2000,
    releaseDate: '2000-01-01',
    genres: [
      { id: 18, name: 'Drama' },
      { id: 80, name: 'Crimen' },
    ],
    directors: [person(10, 'Directora A')],
    cast: [101, 102, 103, 104, 105].map((id) => person(id)),
    runtime: 120,
    revenue: 100_000_000,
    score: 70,
    certification: 'R',
    companies: [{ id: 7, name: 'Estudio', logoPath: '/logo.png' }],
    countries: [{ code: 'ES', name: 'España' }],
    originalLanguage: { code: 'es', name: 'Español' },
    posterPath: null,
    backdropPath: null,
    overview: '',
    tagline: '',
    keywords: [],
    ...overrides,
  };
}

describe('compareNumber (año / puntuación)', () => {
  it('verde si es exacto y sin flecha', () => {
    expect(compareNumber(2000, 2000, YEAR_TOLERANCE)).toEqual({ value: 2000, match: 'correct', direction: null });
  });

  it('amarillo dentro de la tolerancia; ↑ si la secreta es mayor, ↓ si es menor', () => {
    expect(compareNumber(1997, 2000, YEAR_TOLERANCE)).toMatchObject({ match: 'partial', direction: 'up' });
    expect(compareNumber(2003, 2000, YEAR_TOLERANCE)).toMatchObject({ match: 'partial', direction: 'down' });
  });

  it('el límite de la tolerancia es amarillo; uno más no coincide', () => {
    expect(compareNumber(1995, 2000, YEAR_TOLERANCE).match).toBe('partial');
    expect(compareNumber(1994, 2000, YEAR_TOLERANCE).match).toBe('wrong');
    expect(compareNumber(75, 70, SCORE_TOLERANCE).match).toBe('partial');
    expect(compareNumber(76, 70, SCORE_TOLERANCE)).toMatchObject({ match: 'wrong', direction: 'down' });
  });

  it('sin dato no coincide y no lleva flecha', () => {
    expect(compareNumber(null, 2000, YEAR_TOLERANCE)).toMatchObject({ match: 'wrong', direction: null });
  });
});

describe('compareRelative (taquilla)', () => {
  it('amarillo a ±25 %, flecha hacia la secreta', () => {
    expect(compareRelative(80_000_000, 100_000_000, 0.25)).toMatchObject({ match: 'partial', direction: 'up' });
    expect(compareRelative(126_000_000, 100_000_000, 0.25)).toMatchObject({ match: 'wrong', direction: 'down' });
  });

  it('taquilla desconocida (0 o null) no coincide ni da flecha', () => {
    expect(compareRelative(0, 100, 0.25)).toEqual({ value: null, match: 'wrong', direction: null });
    expect(compareRelative(100, null, 0.25)).toMatchObject({ match: 'wrong', direction: null });
  });
});

describe('compareSets (géneros)', () => {
  const key = (n: number) => n;
  it('verde idénticos, amarillo si comparten alguno, si no nada', () => {
    expect(compareSets([2, 1], [1, 2], key).match).toBe('correct');
    expect(compareSets([1, 3], [1, 2], key)).toMatchObject({ match: 'partial', matched: [1] });
    expect(compareSets([3], [1, 2], key).match).toBe('wrong');
    expect(compareSets([], [], key).match).toBe('wrong');
  });
});

describe('estudio y clasificación', () => {
  it('estudio: verde si comparten productora y muestra la compartida', () => {
    const a = { id: 1, name: 'A', logoPath: null };
    const b = { id: 2, name: 'B', logoPath: null };
    expect(compareStudio([a, b], [b])).toEqual({ company: b, match: 'correct' });
    expect(compareStudio([a], [b])).toEqual({ company: a, match: 'wrong' });
    expect(compareStudio([], [b])).toEqual({ company: null, match: 'wrong' });
  });

  it('estudio: muestra el gran estudio antes que una productora pequeña', () => {
    const small = { id: 1, name: 'Double Dare You', logoPath: '/ddy.png' };
    const major = { id: 2, name: 'Searchlight Pictures', logoPath: '/sl.png' };
    expect(compareStudio([small, major], []).company).toEqual(major);
    expect(compareStudio([small, major], [small, major]).company).toEqual(major);
  });

  it('clasificación: verde solo si es igual y conocida', () => {
    expect(compareRated('R', 'R').match).toBe('correct');
    expect(compareRated('PG-13', 'R').match).toBe('wrong');
    expect(compareRated(null, null).match).toBe('wrong');
  });
});

describe('compareMovies', () => {
  const secret = movie();

  it('la misma película es acierto y todo verde', () => {
    const { isCorrect, clues } = compareMovies(movie(), secret);
    expect(isCorrect).toBe(true);
    for (const k of ['genres', 'year', 'boxOffice', 'studio', 'rated', 'score'] as const) expect(clues[k].match).toBe('correct');
    expect(clues.lead?.match).toBe('correct');
    expect(clues.directors.every((d) => d.match === 'correct')).toBe(true);
    expect(clues.supporting.every((p) => p.match === 'correct')).toBe(true);
  });

  it('director: verde si coincide, si no nada', () => {
    expect(compareMovies(movie({ id: 2 }), secret).clues.directors[0].match).toBe('correct');
    expect(compareMovies(movie({ id: 2, directors: [person(99)] }), secret).clues.directors[0].match).toBe('wrong');
  });

  it('protagonista: amarillo si en la secreta es secundario', () => {
    const r = compareMovies(movie({ id: 2, cast: [person(103), person(900)] }), secret);
    expect(r.clues.lead?.match).toBe('partial');
  });

  it('secundarios: verde si coinciden, amarillo si allí es protagonista', () => {
    const r = compareMovies(movie({ id: 2, cast: [person(900), person(102), person(101), person(901)] }), secret);
    expect(r.clues.lead?.match).toBe('wrong');
    expect(r.clues.supporting.map((p) => p.match)).toEqual(['correct', 'partial', 'wrong']);
  });

  it('sin reparto no hay protagonista', () => {
    expect(compareMovies(movie({ id: 2, cast: [] }), secret).clues.lead).toBeNull();
  });
});
