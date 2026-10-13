import { useCallback, useEffect, useRef, useState } from 'react';
import { imageUrl } from '../api/tmdb';
import type { Hint } from '../game/hints';
import { attemptsToNextHint, unlockedHints, type EvaluatedGuess, type GameMode } from '../game/modes';
import type { MovieData } from '../game/types';
import { profileStore } from '../store/profileStore';

export type GameStatus = 'loading' | 'playing' | 'won' | 'lost' | 'error';

export interface RoundSummary {
  won: boolean;
  gaveUp: boolean;
  attempts: number;
  hintsUsed: number;
  xp: number;
  rankUp: string | null;
}

export interface GameState<R extends EvaluatedGuess> {
  status: GameStatus;
  secret: MovieData | null;
  /** El intento más reciente primero. */
  guesses: R[];
  hints: Hint[];
  hintsUsed: number;
  submitting: boolean;
  error: string | null;
  guessError: string | null;
  summary: RoundSummary | null;
}

const initialState = <R extends EvaluatedGuess>(): GameState<R> => ({
  status: 'loading',
  secret: null,
  guesses: [],
  hints: [],
  hintsUsed: 0,
  submitting: false,
  error: null,
  guessError: null,
  summary: null,
});

const messageOf = (err: unknown) => (err instanceof Error ? err.message : 'Ha ocurrido un error inesperado.');

function preloadImage(path: string | null) {
  const url = imageUrl(path, 'w342');
  if (url) new Image().src = url;
}

export function useGame<R extends EvaluatedGuess>(mode: GameMode<R>) {
  const [state, setState] = useState<GameState<R>>(initialState);
  // Fuente de verdad síncrona para acciones asíncronas (evita closures obsoletos).
  const stateRef = useRef(state);
  const roundId = useRef(0);
  const prefetched = useRef<Promise<MovieData | null> | null>(null);

  const commit = useCallback((next: GameState<R>) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const excludeIds = useCallback(() => {
    const ids = new Set(profileStore.getSnapshot().recentIds);
    if (stateRef.current.secret) ids.add(stateRef.current.secret.id);
    return ids;
  }, []);

  /** Prepara la siguiente película en segundo plano para que "Siguiente" sea instantáneo. */
  const prefetchNext = useCallback(
    (currentId: number) => {
      const ids = excludeIds();
      ids.add(currentId);
      prefetched.current = mode
        .prepareRound({ excludeIds: ids })
        .then((m) => (preloadImage(m.posterPath), m))
        .catch(() => null);
    },
    [mode, excludeIds],
  );

  const newGame = useCallback(async () => {
    const id = ++roundId.current;
    const exclude = excludeIds();
    commit({ ...initialState<R>(), status: 'loading' });
    try {
      const pending = prefetched.current;
      prefetched.current = null;
      let secret = pending ? await pending : null;
      if (!secret || exclude.has(secret.id)) secret = await mode.prepareRound({ excludeIds: exclude });
      if (id !== roundId.current) return;
      commit({ ...initialState<R>(), status: 'playing', secret, hints: mode.getHints(secret) });
      prefetchNext(secret.id);
    } catch (err) {
      if (id !== roundId.current) return;
      commit({ ...initialState<R>(), status: 'error', error: messageOf(err) });
    }
  }, [mode, commit, excludeIds, prefetchNext]);

  const finish = useCallback(
    (s: GameState<R>, won: boolean, gaveUp: boolean): GameState<R> => {
      const attempts = s.guesses.length;
      const xp = mode.score({ won, gaveUp, attempts, maxAttempts: mode.maxAttempts, hintsUsed: s.hintsUsed });
      const { rankUp } = profileStore.recordRound({ movieId: s.secret!.id, won, attempts, xp });
      return {
        ...s,
        status: won ? 'won' : 'lost',
        submitting: false,
        summary: { won, gaveUp, attempts, hintsUsed: s.hintsUsed, xp, rankUp },
      };
    },
    [mode],
  );

  const submitGuess = useCallback(
    async (movieId: number) => {
      const s = stateRef.current;
      if (s.status !== 'playing' || s.submitting || !s.secret) return;
      if (s.guesses.some((g) => g.movie.id === movieId)) {
        commit({ ...s, guessError: 'Ya probaste esa película.' });
        return;
      }
      const id = roundId.current;
      commit({ ...s, submitting: true, guessError: null });
      try {
        const guess = await mode.resolveGuess(movieId);
        if (id !== roundId.current) return;
        const cur = stateRef.current;
        const result = mode.evaluateGuess(guess, cur.secret!);
        let next: GameState<R> = { ...cur, guesses: [result, ...cur.guesses], submitting: false };
        if (result.isCorrect) next = finish(next, true, false);
        else if (next.guesses.length >= mode.maxAttempts) next = finish(next, false, false);
        commit(next);
      } catch (err) {
        if (id !== roundId.current) return;
        commit({ ...stateRef.current, submitting: false, guessError: messageOf(err) });
      }
    },
    [mode, commit, finish],
  );

  const revealHint = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== 'playing') return;
    if (s.hintsUsed >= unlockedHints(mode.hintSchedule, s.guesses.length, s.hints.length)) return;
    commit({ ...s, hintsUsed: s.hintsUsed + 1 });
  }, [mode, commit]);

  const giveUp = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== 'playing' || !s.secret) return;
    commit(finish(s, false, true));
  }, [commit, finish]);

  const clearGuessError = useCallback(() => {
    if (stateRef.current.guessError) commit({ ...stateRef.current, guessError: null });
  }, [commit]);

  useEffect(() => {
    void newGame();
    // Solo al montar; StrictMode lo ejecuta dos veces y roundId descarta la primera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const attempts = state.guesses.length;
  return {
    ...state,
    maxAttempts: mode.maxAttempts,
    isOver: state.status === 'won' || state.status === 'lost',
    hintsUnlocked: unlockedHints(mode.hintSchedule, attempts, state.hints.length),
    nextHintIn: attemptsToNextHint(mode.hintSchedule, attempts, state.hints.length),
    newGame,
    submitGuess,
    revealHint,
    giveUp,
    clearGuessError,
  };
}
