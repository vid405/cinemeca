import { describe, expect, it } from 'vitest';
import { compareMovies, compareNumber, compareSets, RUNTIME_TOLERANCE, YEAR_TOLERANCE } from './compare';
import type { MovieData } from './types';

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
    directors: [{ id: 10, name: 'Directora A' }],
    cast: [1, 2, 3, 4, 5].map((id) => ({ id: 100 + id, name: `Actor ${id}` })),
    runtime: 120,
    countries: [{ code: 'ES', name: 'España' }],
    originalLanguage: { code: 'es', name: 'Español' },
    posterPath: null,
    backdropPath: null,
    overview: '',
    tagline: '',
    companies: [],
    ...overrides,
  };
}

describe('compareNumber (año / duración)', () => {
  it('verde si es exacto y sin flecha', () => {
    expect(compareNumber(2000, 2000, YEAR_TOLERANCE)).toEqual({ value: 2000, match: 'correct', direction: null });
  });

  it('amarillo dentro de la tolerancia, flecha ↑ si la secreta es mayor', () => {
    expect(compareNumber(1997, 2000, YEAR_TOLERANCE)).toMatchObject({ match: 'partial', direction: 'up' });
  });

  it('flecha ↓ si la secreta es menor', () => {
    expect(compareNumber(2003, 2000, YEAR_TOLERANCE)).toMatchObject({ match: 'partial', direction: 'down' });
  });

  it('el límite de la tolerancia cuenta como amarillo; uno más es rojo', () => {
    expect(compareNumber(1995, 2000, YEAR_TOLERANCE).match).toBe('partial');
    expect(compareNumber(1994, 2000, YEAR_TOLERANCE).match).toBe('wrong');
    expect(compareNumber(135, 120, RUNTIME_TOLERANCE).match).toBe('partial');
    expect(compareNumber(136, 120, RUNTIME_TOLERANCE)).toMatchObject({ match: 'wrong', direction: 'down' });
  });

  it('rojo si falta el dato', () => {
    expect(compareNumber(null, 2000, YEAR_TOLERANCE)).toMatchObject({ match: 'wrong', direction: null });
    expect(compareNumber(2000, null, YEAR_TOLERANCE).match).toBe('wrong');
  });
});

describe('compareSets', () => {
  const key = (n: number) => n;

  it('verde si son idénticos aunque cambie el orden', () => {
    expect(compareSets([2, 1], [1, 2], key).match).toBe('correct');
  });

  it('amarillo si comparten alguno y devuelve cuáles', () => {
    const r = compareSets([1, 3], [1, 2], key);
    expect(r.match).toBe('partial');
    expect(r.matched).toEqual([1]);
  });

  it('subconjunto estricto es amarillo, no verde', () => {
    expect(compareSets([1], [1, 2], key).match).toBe('partial');
  });

  it('rojo si no comparten nada o hay listas vacías', () => {
    expect(compareSets([3], [1, 2], key).match).toBe('wrong');
    expect(compareSets([], [1], key).match).toBe('wrong');
    expect(compareSets([], [], key).match).toBe('wrong');
  });

  it("modo 'any': verde con una sola coincidencia", () => {
    expect(compareSets([1, 9], [1, 2], key, 'any').match).toBe('correct');
    expect(compareSets([9], [1, 2], key, 'any').match).toBe('wrong');
  });
});

describe('compareMovies', () => {
  const secret = movie();

  it('la misma película es acierto y todo verde', () => {
    const r = compareMovies(movie(), secret);
    expect(r.isCorrect).toBe(true);
    for (const clue of Object.values(r.clues)) expect(clue.match).toBe('correct');
  });

  it('géneros: amarillo si comparten alguno', () => {
    const r = compareMovies(movie({ id: 2, genres: [{ id: 18, name: 'Drama' }, { id: 35, name: 'Comedia' }] }), secret);
    expect(r.isCorrect).toBe(false);
    expect(r.clues.genres.match).toBe('partial');
    expect(r.clues.genres.matched.map((g) => g.name)).toEqual(['Drama']);
  });

  it('director: verde/rojo, sin amarillo', () => {
    expect(compareMovies(movie({ id: 2 }), secret).clues.director.match).toBe('correct');
    expect(compareMovies(movie({ id: 2, directors: [{ id: 99, name: 'Otro' }] }), secret).clues.director.match).toBe('wrong');
  });

  it('reparto: amarillo con actores compartidos y lista de coincidencias', () => {
    const cast = [{ id: 101, name: 'Actor 1' }, { id: 103, name: 'Actor 3' }, { id: 900, name: 'Ajeno' }];
    const r = compareMovies(movie({ id: 2, cast }), secret);
    expect(r.clues.cast.match).toBe('partial');
    expect(r.clues.cast.matched.map((p) => p.name)).toEqual(['Actor 1', 'Actor 3']);
  });

  it('reparto sin coincidencias es rojo', () => {
    const r = compareMovies(movie({ id: 2, cast: [{ id: 900, name: 'Ajeno' }] }), secret);
    expect(r.clues.cast.match).toBe('wrong');
  });

  it('país: verde idéntico, amarillo coproducción compartida, rojo distinto', () => {
    expect(compareMovies(movie({ id: 2 }), secret).clues.country.match).toBe('correct');
    const coprod = [{ code: 'ES', name: 'España' }, { code: 'FR', name: 'Francia' }];
    expect(compareMovies(movie({ id: 2, countries: coprod }), secret).clues.country.match).toBe('partial');
    expect(compareMovies(movie({ id: 2, countries: [{ code: 'JP', name: 'Japón' }] }), secret).clues.country.match).toBe('wrong');
  });

  it('idioma: verde/rojo', () => {
    expect(compareMovies(movie({ id: 2 }), secret).clues.language.match).toBe('correct');
    const r = compareMovies(movie({ id: 2, originalLanguage: { code: 'fr', name: 'Francés' } }), secret);
    expect(r.clues.language.match).toBe('wrong');
  });

  it('año y duración llevan flecha hacia la secreta', () => {
    const r = compareMovies(movie({ id: 2, year: 2010, runtime: 90 }), secret);
    expect(r.clues.year).toMatchObject({ match: 'wrong', direction: 'down' });
    expect(r.clues.runtime).toMatchObject({ match: 'wrong', direction: 'up' });
  });
});
