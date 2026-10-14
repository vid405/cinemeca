import { useMemo, useState } from 'react';
import type { PlayedMovie } from '../game/progress';
import { useProfile } from '../hooks/useProfile';
import { dayLabel } from '../utils/format';
import { Icon, Modal, Poster } from './ui';

type Filter = 'all' | 'won' | 'lost';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'won', label: 'Acertadas' },
  { id: 'lost', label: 'Falladas' },
];

function resultText(m: PlayedMovie) {
  if (m.won) return `Acertada en ${m.attempts} ${m.attempts === 1 ? 'intento' : 'intentos'}`;
  return m.gaveUp ? `Te rendiste tras ${m.attempts} ${m.attempts === 1 ? 'intento' : 'intentos'}` : 'Se acabaron los intentos';
}

function PlayedCard({ movie, number, highlight, onOpen }: { movie: PlayedMovie; number: number; highlight: boolean; onOpen: () => void }) {
  const label = dayLabel(movie.playedAt);
  return (
    <li className="flex animate-fade-up flex-col items-center">
      <button
        onClick={onOpen}
        className={`group relative w-full overflow-hidden rounded-lg border-2 transition hover:-translate-y-0.5 hover:border-near/80 ${
          highlight ? 'border-near shadow-lg shadow-near/20' : 'border-navy-600/70'
        }`}
        aria-label={`${movie.title}: ${resultText(movie)}`}
      >
        <Poster path={movie.posterPath} title={movie.title} size="w342" className="aspect-[2/3] w-full" />
        <span
          className={`absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full shadow sm:right-2 sm:top-2 ${
            movie.won ? 'bg-near text-navy-950' : 'bg-navy-700 text-navy-200'
          }`}
          aria-hidden
        >
          {movie.won ? <Icon.check className="h-4 w-4" strokeWidth={2.6} /> : <Icon.close className="h-3.5 w-3.5" strokeWidth={2.6} />}
        </span>
        <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 font-display text-sm text-white/80 backdrop-blur-sm">
          #{number}
        </span>
        {movie.mode === 'hollywood' && (
          <span className="absolute left-1.5 top-1.5 rounded bg-near/90 px-1 text-xs" title="Modo Hollywood" aria-label="Modo Hollywood">
            🎬
          </span>
        )}
      </button>
      <span
        className={`label mt-2 rounded-full px-2.5 py-0.5 ${highlight && label === 'Hoy' ? 'bg-near text-navy-950' : 'text-navy-300'}`}
      >
        {label}
      </span>
    </li>
  );
}

function PlayedDetail({ movie, onClose }: { movie: PlayedMovie; onClose: () => void }) {
  return (
    <Modal title={movie.title} onClose={onClose}>
      <div className="flex gap-4">
        <Poster path={movie.posterPath} title={movie.title} size="w342" className="aspect-[2/3] w-28 shrink-0 rounded-lg border border-navy-500/50" />
        <div className="min-w-0 space-y-1.5 text-sm">
          {movie.originalTitle !== movie.title && <p className="text-navy-300">{movie.originalTitle}</p>}
          <p className="text-navy-300">
            {movie.year ?? 's/f'} · {movie.mode === 'hollywood' ? '🎬 Hollywood' : '🌍 Pistas'}
          </p>
          <p className={`font-bold ${movie.won ? 'text-hit' : 'text-navy-200'}`}>{resultText(movie)}</p>
          <p className="text-navy-200">
            <span className={movie.xp < 0 ? 'text-red-300' : ''}>
              {movie.xp < 0 ? `−${Math.abs(movie.xp)}` : `+${movie.xp}`} XP
            </span>
            {movie.hintsUsed > 0 && ` · ${movie.hintsUsed} ${movie.hintsUsed === 1 ? 'pista' : 'pistas'}`}
          </p>
          <p className="text-navy-400">
            {new Date(movie.playedAt).toLocaleString('es', { dateStyle: 'long', timeStyle: 'short' })}
          </p>
          <a
            href={`https://www.themoviedb.org/movie/${movie.movieId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block pt-1 text-sky-300 hover:underline"
          >
            Ver en TMDB ↗
          </a>
        </div>
      </div>
    </Modal>
  );
}

/** Filmoteca: todas las películas ya jugadas (ninguna vuelve a salir como secreta). */
export function Library({ onPlay }: { onPlay: () => void }) {
  const profile = useProfile();
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<PlayedMovie | null>(null);

  const { history } = profile;
  const wins = history.filter((h) => h.won).length;
  const visible = useMemo(
    () => history.filter((h) => (filter === 'all' ? true : filter === 'won' ? h.won : !h.won)),
    [history, filter],
  );
  // Numeración cronológica: #1 es la primera partida guardada.
  const numberOf = useMemo(() => new Map(history.map((h, i) => [h.movieId, history.length - i])), [history]);

  return (
    <section className="animate-fade-up py-4 sm:py-8">
      <h1 className="font-display text-6xl uppercase leading-none tracking-wide sm:text-8xl">Filmoteca</h1>
      <p className="mt-3 max-w-md text-navy-300 sm:text-lg">
        Todas las películas que ya jugaste. Ninguna volverá a salir como película secreta.
      </p>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 sm:mt-8">
        <div className="flex gap-2" role="tablist" aria-label="Filtrar">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] transition sm:px-6 sm:py-3 sm:text-sm ${
                filter === f.id ? 'bg-near text-navy-950' : 'border border-navy-500/70 text-navy-200 hover:bg-white/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-80">
          <p className="label text-navy-200">
            Acertadas {wins}/{history.length}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-navy-700">
            <div
              className="h-full rounded-full bg-near transition-[width] duration-700"
              style={{ width: `${history.length ? Math.max(2, (wins / history.length) * 100) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-navy-600 p-10 text-center">
          <p className="text-4xl">🎞️</p>
          <p className="mt-3 text-navy-300">Aún no has terminado ninguna partida.</p>
          <button onClick={onPlay} className="mt-5 rounded-full bg-near px-7 py-3 font-extrabold text-navy-950 hover:brightness-110">
            Jugar ahora
          </button>
        </div>
      ) : visible.length === 0 ? (
        <p className="mt-10 text-center text-navy-300">No hay películas con este filtro.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-3 gap-3 sm:mt-8 sm:grid-cols-4 sm:gap-5 lg:grid-cols-5">
          {visible.map((m, i) => (
            <PlayedCard
              key={m.movieId}
              movie={m}
              number={numberOf.get(m.movieId) ?? 0}
              highlight={filter === 'all' && i === 0}
              onOpen={() => setOpen(m)}
            />
          ))}
        </ul>
      )}

      {profile.legacyPlayedIds.length > 0 && (
        <p className="mt-6 text-center text-xs text-navy-400">
          + {profile.legacyPlayedIds.length} {profile.legacyPlayedIds.length === 1 ? 'película jugada' : 'películas jugadas'} antes
          de existir la Filmoteca (tampoco se repetirán).
        </p>
      )}

      {open && <PlayedDetail movie={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
