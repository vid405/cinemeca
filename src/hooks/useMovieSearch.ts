import { useEffect, useState } from 'react';
import { searchMovies } from '../api/tmdb';
import type { MovieSuggestion } from '../game/types';

export const MIN_QUERY_LENGTH = 2;

/** Autocompletado con debounce y cancelación de peticiones obsoletas. */
export function useMovieSearch(query: string, delayMs = 300) {
  const [results, setResults] = useState<MovieSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      searchMovies(q, controller.signal)
        .then((r) => {
          setResults(r);
          setError(null);
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          setError(err instanceof Error ? err.message : 'Error al buscar.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, delayMs);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, delayMs]);

  return { results, loading, error };
}
