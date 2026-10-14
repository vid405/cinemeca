import { useEffect, useRef } from 'react';
import type { MovieData } from '../game/types';
import type { RoundSummary } from '../hooks/useGame';
import { formatMoney } from '../utils/format';
import { Poster } from './ui';

export function ResultPanel({ movie, summary, onNext }: { movie: MovieData; summary: RoundSummary; onNext: () => void }) {
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => nextRef.current?.focus({ preventScroll: true }), []);

  const headline = summary.won
    ? `¡Acertaste en ${summary.attempts} ${summary.attempts === 1 ? 'intento' : 'intentos'}!`
    : summary.gaveUp
      ? 'Te rendiste. La película era…'
      : 'Se acabaron los intentos. Era…';

  const meta = [
    movie.year,
    movie.runtime && `${movie.runtime} min`,
    movie.certification,
    movie.revenue && formatMoney(movie.revenue),
  ].filter(Boolean);

  return (
    <section
      className="animate-fade-up overflow-hidden rounded-2xl border border-navy-600/70 bg-navy-850/90 shadow-xl shadow-black/30"
      aria-live="polite"
    >
      <div className={`px-4 py-3 text-center text-base font-bold sm:text-lg ${summary.won ? 'bg-hit' : 'bg-navy-600'}`}>{headline}</div>

      <div className="flex gap-4 p-4 sm:gap-6 sm:p-6">
        <Poster
          path={movie.posterPath}
          title={movie.title}
          size="w342"
          className="aspect-[2/3] w-28 shrink-0 rounded-lg border border-navy-500/50 sm:w-36"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-tight sm:text-3xl">{movie.title}</h2>
          {movie.originalTitle !== movie.title && <p className="text-sm text-navy-300">{movie.originalTitle}</p>}
          <p className="mt-1 text-sm text-navy-300 sm:text-base">{meta.join(' · ')}</p>
          {movie.directors.length > 0 && (
            <p className="text-sm text-navy-200 sm:text-base">Dirigida por {movie.directors.map((d) => d.name).join(', ')}</p>
          )}
          <p className="mt-3 line-clamp-6 text-sm leading-relaxed text-navy-200 sm:text-base">
            {movie.overview || 'Sin sinopsis disponible en español.'}
          </p>
          <a
            href={`https://www.themoviedb.org/movie/${movie.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-sky-300 hover:underline sm:text-sm"
          >
            Ver en TMDB ↗
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 px-4 text-sm">
        {summary.xp >= 0 ? (
          <span className="rounded-full bg-near/15 px-3 py-1 font-bold text-near">+{summary.xp} XP</span>
        ) : (
          <span className="rounded-full bg-red-500/15 px-3 py-1 font-bold text-red-300">−{Math.abs(summary.xp)} XP</span>
        )}
        {summary.hintsUsed > 0 && (
          <span className="rounded-full bg-navy-700 px-3 py-1 text-navy-200">
            {summary.hintsUsed} {summary.hintsUsed === 1 ? 'pista' : 'pistas'}
          </span>
        )}
        {summary.rankUp && (
          <span className="rounded-full bg-hit/20 px-3 py-1 font-bold text-hit">⭐ ¡Nuevo rango: {summary.rankUp}!</span>
        )}
        {summary.rankDown && (
          <span className="rounded-full bg-red-500/15 px-3 py-1 font-bold text-red-300">↓ Bajaste a {summary.rankDown}</span>
        )}
      </div>

      <div className="p-4 sm:p-6">
        <button
          ref={nextRef}
          onClick={onNext}
          className="w-full rounded-xl bg-near py-4 text-lg font-extrabold text-navy-950 shadow-lg shadow-near/20 transition hover:brightness-110 active:scale-[0.98] sm:text-xl"
        >
          Siguiente película →
        </button>
      </div>
    </section>
  );
}
