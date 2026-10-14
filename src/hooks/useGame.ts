import { useCallback, useEffect, useRef, useState } from 'react';
import { imageUrl } from '../api/tmdb';
import type { RoundRules } from '../game/difficulty';
import type { Hint, HintKind, HintOption } from '../game/hints';
import { attemptsToNextHint, unlockedHints, type EvaluatedGuess, type GameMode } from '../game/modes';
import type { MovieData } from '../game/types';
import { modeKey, playedIds } from '../game/progress';
import { profileStore } from '../store/profileStore';

export type GameStatus = 'loading' | 'playing' | 'won' | 'lost' | 'error';

export interface RoundSummary {
  won: boolean;
  gaveUp: boolean;
  attempts: number;
  hintsUsed: number;
  xp: number;
  rankUp: string | null;
  rankDown: string | null;
}

export interface GameState<R extends EvaluatedGuess> {
  status: GameStatus;
  /** Reglas fijadas al empezar la partida (dependen del nivel en algunos modos). */
  rules: RoundRules;
  secret: MovieData | null;
  /** El intento más reciente primero. */
  guesses: R[];
  hintOptions: HintOption[];
  /** Pistas reveladas, en orden. */
  hints: Hint[];
  /** Pista que se está calculando (algunas piden datos a TMDB). */
  hintLoading: HintKind | null;
  hintError: string | null;
  submitting: boolean;
  error: string | null;
  guessError: string | null;
  summary: RoundSummary | null;
}

const initialState = <R extends EvaluatedGuess>(rules: RoundRules = { maxAttempts: 10, hintSchedule: [] }): GameState<R> => ({
  status: 'loading',
  rules,
  secret: null,
  guesses: [],
  hintOptions: [],
  hints: [],
  hintLoading: null,
  hintError: null,
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
  /** Siguiente película precargada, con la clave de las reglas para las que se eligió. */
  const prefetched = useRef<{ secret: Promise<MovieData | null>; rulesKey: string } | null>(null);

  const commit = useCallback((next: GameState<R>) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const excludeIds = useCallback(() => {
    // Nunca repetir una película ya jugada.
    const ids = playedIds(profileStore.getSnapshot());
    if (stateRef.current.secret) ids.add(stateRef.current.secret.id);
    return ids;
  }, []);

  // Cada modo tiene su propio XP, rango y nivel de dificultad.
  const currentRules = useCallback(() => mode.rules(profileStore.getSnapshot().modeXp[modeKey(mode.id)]), [mode]);

  /**
   * Prepara la siguiente película en segundo plano para que "Siguiente" sea instantáneo.
   * Se precarga con las reglas que tendría la próxima partida si esta se perdiera; si el
   * resultado cambia de nivel, newGame la descarta y elige otra.
   */
  const prefetchNext = useCallback(
    (currentId: number) => {
      const ids = excludeIds();
      ids.add(currentId);
      const rules = currentRules();
      prefetched.current = {
        rulesKey: JSON.stringify(rules),
        secret: mode
          .prepareRound({ excludeIds: ids, rules })
          .then((m) => (preloadImage(m.posterPath), m))
          .catch(() => null),
      };
    },
    [mode, excludeIds, currentRules],
  );

  const newGame = useCallback(async () => {
    const id = ++roundId.current;
    // La anterior aún no está en el historial si se abandonó con "Nueva película".
    const previousId = stateRef.current.secret?.id;
    const rules = currentRules();
    commit({ ...initialState<R>(rules), status: 'loading' });
    try {
      const exclude = excludeIds();
      if (previousId) exclude.add(previousId);
      const pending = prefetched.current;
      prefetched.current = null;
      let secret = pending && pending.rulesKey === JSON.stringify(rules) ? await pending.secret : null;
      if (!secret || exclude.has(secret.id)) secret = await mode.prepareRound({ excludeIds: exclude, rules });
      if (id !== roundId.current) return;
      commit({ ...initialState<R>(rules), status: 'playing', secret, hintOptions: mode.getHintOptions(secret) });
      prefetchNext(secret.id);
    } catch (err) {
      if (id !== roundId.current) return;
      commit({ ...initialState<R>(rules), status: 'error', error: messageOf(err) });
    }
  }, [mode, commit, excludeIds, prefetchNext, currentRules]);

  const finish = useCallback(
    (s: GameState<R>, won: boolean, gaveUp: boolean): GameState<R> => {
      const attempts = s.guesses.length;
      const hintsUsed = s.hints.length;
      const xp = mode.score({ won, gaveUp, attempts, maxAttempts: s.rules.maxAttempts, hintsUsed }, s.rules);
      const m = s.secret!;
      const { rankUp, rankDown } = profileStore.recordRound({
        movieId: m.id,
        mode: mode.id,
        title: m.title,
        originalTitle: m.originalTitle,
        year: m.year,
        posterPath: m.posterPath,
        won,
        gaveUp,
        attempts,
        hintsUsed,
        xp,
        playedAt: new Date().toISOString(),
      });
      return {
        ...s,
        status: won ? 'won' : 'lost',
        submitting: false,
        summary: { won, gaveUp, attempts, hintsUsed, xp, rankUp, rankDown },
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
        else if (next.guesses.length >= next.rules.maxAttempts) next = finish(next, false, false);
        commit(next);
      } catch (err) {
        if (id !== roundId.current) return;
        commit({ ...stateRef.current, submitting: false, guessError: messageOf(err) });
      }
    },
    [mode, commit, finish],
  );

  /** Revela una pista; devuelve true si se pudo (solo entonces cuenta como usada). */
  const revealHint = useCallback(
    async (kind: HintKind): Promise<boolean> => {
      const s = stateRef.current;
      if (s.status !== 'playing' || !s.secret || s.hintLoading) return false;
      const available = s.hintOptions.filter((o) => o.available).length;
      if (s.hints.length >= unlockedHints(s.rules.hintSchedule, s.guesses.length, available)) return false;
      if (s.hints.some((h) => h.kind === kind)) return false;

      const id = roundId.current;
      commit({ ...s, hintLoading: kind, hintError: null });
      try {
        const hint = await mode.buildHint(
          kind,
          s.secret,
          s.guesses.map((g) => g.movie),
          s.hints,
        );
        if (id !== roundId.current) return false;
        const cur = stateRef.current;
        if (!hint) {
          commit({ ...cur, hintLoading: null, hintError: 'No encontramos datos para esta pista. Prueba otra; no se ha gastado.' });
          return false;
        }
        commit({ ...cur, hintLoading: null, hints: [...cur.hints, hint] });
        return true;
      } catch (err) {
        if (id === roundId.current) commit({ ...stateRef.current, hintLoading: null, hintError: messageOf(err) });
        return false;
      }
    },
    [mode, commit],
  );

  const clearHintError = useCallback(() => {
    if (stateRef.current.hintError) commit({ ...stateRef.current, hintError: null });
  }, [commit]);

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
  const availableHints = state.hintOptions.filter((o) => o.available).length;
  const { rules } = state;
  const hintsUnlocked = unlockedHints(rules.hintSchedule, attempts, availableHints);
  return {
    ...state,
    maxAttempts: rules.maxAttempts,
    isOver: state.status === 'won' || state.status === 'lost',
    hintsUsed: state.hints.length,
    hintsTotal: availableHints,
    hintsUnlocked,
    /** Usos de pista disponibles ahora mismo. */
    hintsRemaining: Math.max(0, hintsUnlocked - state.hints.length),
    nextHintIn: attemptsToNextHint(rules.hintSchedule, attempts, availableHints),
    newGame,
    submitGuess,
    revealHint,
    clearHintError,
    giveUp,
    clearGuessError,
  };
}
