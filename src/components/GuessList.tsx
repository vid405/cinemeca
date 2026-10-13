import type { ReactNode } from 'react';
import type { GuessResult, NumericClue } from '../game/compare';
import type { Direction, Match } from '../game/types';
import { Poster } from './ui';

export const MATCH_STYLES: Record<Match, string> = {
  correct: 'bg-emerald-600 text-white',
  partial: 'bg-amber-400 text-ink-950',
  wrong: 'bg-red-800/80 text-white',
};

const MATCH_LABEL: Record<Match, string> = {
  correct: 'coincide',
  partial: 'coincide parcialmente',
  wrong: 'no coincide',
};

function Arrow({ direction, up, down }: { direction: Direction; up: string; down: string }) {
  if (!direction) return null;
  const label = `La secreta es ${direction === 'up' ? up : down}`;
  return (
    <span aria-label={label} title={label} className="ml-1 font-black">
      {direction === 'up' ? '↑' : '↓'}
    </span>
  );
}

function Cell({
  label,
  match,
  index,
  className = '',
  children,
}: {
  label: string;
  match: Match;
  index: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex min-h-[64px] animate-flip-in flex-col items-center justify-center rounded-lg px-1.5 py-1.5 text-center ${MATCH_STYLES[match]} ${className}`}
      style={{ animationDelay: `${index * 110}ms` }}
      aria-label={`${label}: ${MATCH_LABEL[match]}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</span>
      <span className="mt-0.5 line-clamp-3 text-[13px] font-semibold leading-tight">{children}</span>
    </div>
  );
}

const list = (names: string[], max = 3) =>
  names.length === 0 ? '—' : names.length > max ? `${names.slice(0, max).join(', ')} +${names.length - max}` : names.join(', ');

const num = (clue: NumericClue, unit = '') => (clue.value == null ? '—' : `${clue.value}${unit}`);

function GuessRow({ result }: { result: GuessResult }) {
  const { movie, clues, isCorrect } = result;
  return (
    <li
      className={`rounded-xl border bg-ink-900 p-2.5 ${isCorrect ? 'border-emerald-500/70' : 'border-white/5'}`}
    >
      <div className="mb-2 flex animate-fade-up items-center gap-2.5">
        <Poster path={movie.posterPath} title={movie.title} size="w92" className="h-12 w-8 shrink-0 rounded" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{movie.title}</p>
          <p className="truncate text-xs text-white/40">
            {movie.originalTitle !== movie.title ? `${movie.originalTitle} · ` : ''}
            {movie.year ?? 's/f'}
          </p>
        </div>
        {isCorrect && <span className="ml-auto text-xl">🎉</span>}
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        <Cell index={0} label="Año" match={clues.year.match}>
          {num(clues.year)}
          <Arrow direction={clues.year.direction} up="más reciente" down="más antigua" />
        </Cell>
        <Cell index={1} label="Duración" match={clues.runtime.match}>
          {num(clues.runtime, ' min')}
          <Arrow direction={clues.runtime.direction} up="más larga" down="más corta" />
        </Cell>
        <Cell index={2} label="Idioma" match={clues.language.match}>
          {clues.language.value.name}
        </Cell>
        <Cell index={3} label="Director" match={clues.director.match}>
          {list(clues.director.values.map((p) => p.name), 2)}
        </Cell>
        <Cell index={4} label="País" match={clues.country.match}>
          {list(clues.country.values.map((c) => c.name), 2)}
        </Cell>
        <Cell index={5} label="Géneros" match={clues.genres.match}>
          {list(clues.genres.values.map((g) => g.name))}
        </Cell>
        <Cell index={6} label="Reparto" match={clues.cast.match} className="col-span-2">
          {clues.cast.match === 'correct'
            ? 'Mismo reparto'
            : clues.cast.matched.length
              ? `${list(clues.cast.matched.map((p) => p.name))} (${clues.cast.matched.length}/5)`
              : 'Ningún actor en común'}
        </Cell>
      </div>
    </li>
  );
}

export function GuessList({ guesses }: { guesses: GuessResult[] }) {
  if (guesses.length === 0) return null;
  return (
    <ol className="space-y-2.5" aria-label="Intentos">
      {guesses.map((g) => (
        <GuessRow key={g.movie.id} result={g} />
      ))}
    </ol>
  );
}
