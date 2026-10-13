import { useEffect, useRef } from 'react';
import type { MovieData } from '../game/types';
import type { RoundSummary } from '../hooks/useGame';
import { Poster } from './ui';

export function ResultPanel({ movie, summary, onNext }: { movie: MovieData; summary: RoundSummary; onNext: () => void }) {
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => nextRef.current?.focus(), []);

  const headline = summary.won
    ? `¡Acertaste en ${summary.attempts} ${summary.attempts === 1 ? 'intento' : 'intentos'}!`
    : summary.gaveUp
      ? 'Te rendiste. La película era…'
      : 'Se acabaron los intentos. Era…';

  return (
    <section className="animate-fade-up overflow-hidden rounded-2xl border border-white/10 bg-ink-900" aria-live="polite">
      <div className={`px-4 py-2.5 text-center font-bold ${summary.won ? 'bg-emerald-600' : 'bg-red-800'}`}>{headline}</div>

      <div className="flex gap-4 p-4">
        <Poster path={movie.posterPath} title={movie.title} size="w342" className="aspect-[2/3] w-28 shrink-0 rounded-lg sm:w-36" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-black leading-tight">{movie.title}</h2>
          {movie.originalTitle !== movie.title && <p className="text-sm text-white/50">{movie.originalTitle}</p>}
          <p className="mt-1 text-sm text-white/60">
            {[movie.year, movie.runtime && `${movie.runtime} min`, movie.directors.map((d) => d.name).join(', ')]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <p className="mt-2 line-clamp-6 text-sm leading-relaxed text-white/80">
            {movie.overview || 'Sin sinopsis disponible en español.'}
          </p>
          <a
            href={`https://www.themoviedb.org/movie/${movie.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-sky-300 hover:underline"
          >
            Ver en TMDB ↗
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 px-4 pb-2 text-sm">
        <span className="rounded-full bg-amber-400/15 px-3 py-1 font-semibold text-amber-300">+{summary.xp} XP</span>
        {summary.hintsUsed > 0 && (
          <span className="rounded-full bg-white/5 px-3 py-1 text-white/60">
            {summary.hintsUsed} {summary.hintsUsed === 1 ? 'pista' : 'pistas'}
          </span>
        )}
        {summary.rankUp && (
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 font-semibold text-emerald-300">
            ⭐ ¡Nuevo rango: {summary.rankUp}!
          </span>
        )}
      </div>

      <div className="p-4 pt-2">
        <button
          ref={nextRef}
          onClick={onNext}
          className="w-full rounded-xl bg-amber-400 py-4 text-lg font-black text-ink-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-300 active:scale-[0.98]"
        >
          Siguiente película →
        </button>
      </div>
    </section>
  );
}
