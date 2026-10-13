import type { ReactNode } from 'react';
import { imageUrl } from '../api/tmdb';
import type { GuessResult, PersonClue } from '../game/compare';
import type { Direction, Match } from '../game/types';
import { formatMoney, shortName } from '../utils/format';
import { Avatar, Poster } from './ui';

/** Verde = coincide, amarillo = cerca/parcial, azul neutro = no coincide. */
export const MATCH_BG: Record<Match, string> = {
  correct: 'bg-hit text-white',
  partial: 'bg-near text-white',
  wrong: 'bg-navy-700 text-white',
};

const MATCH_RING: Record<Match, string> = {
  correct: 'ring-4 ring-hit',
  partial: 'ring-4 ring-near',
  wrong: 'grayscale',
};

const MATCH_NAME: Record<Match, string> = {
  correct: 'text-hit font-semibold',
  partial: 'text-near font-semibold',
  wrong: 'text-navy-300',
};

const MATCH_LABEL: Record<Match, string> = {
  correct: 'coincide',
  partial: 'cerca',
  wrong: 'no coincide',
};

function Arrow({ direction }: { direction: Direction }) {
  if (!direction) return null;
  const label = direction === 'up' ? 'La secreta tiene un valor mayor' : 'La secreta tiene un valor menor';
  return (
    <span aria-label={label} title={label} className="ml-1 inline-block text-[0.85em]">
      {direction === 'up' ? '↑' : '↓'}
    </span>
  );
}

/** Etiqueta completa en pantallas grandes y abreviada en móvil. */
function Label({ label, short, className = '' }: { label: string; short?: string; className?: string }) {
  if (!short) return <span className={`label ${className}`}>{label}</span>;
  return (
    <span className={`label ${className}`}>
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

function StatCell({
  label,
  short,
  match,
  delay,
  className = '',
  children,
}: {
  label: string;
  short?: string;
  match: Match;
  delay: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex min-h-[4.25rem] min-w-0 animate-flip-in flex-col items-center justify-center rounded-lg px-1.5 py-2 text-center sm:min-h-[3.9rem] sm:px-2 ${MATCH_BG[match]} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
      aria-label={`${label}: ${MATCH_LABEL[match]}`}
    >
      <Label label={label} short={short} className="opacity-90" />
      <span className="mt-1 text-lg font-semibold leading-none tabular-nums sm:text-xl">{children}</span>
    </div>
  );
}

function PersonView({
  clue,
  delay,
  hiddenOnMobile,
  mobileExtra = 0,
}: {
  clue: PersonClue;
  delay: number;
  hiddenOnMobile?: boolean;
  /** En móvil, cuántas personas más del grupo quedan ocultas (se muestra "+N"). */
  mobileExtra?: number;
}) {
  const { person, match } = clue;
  return (
    <div
      className={`w-[3.1rem] animate-pop-in flex-col items-center sm:flex sm:w-[5.25rem] ${hiddenOnMobile ? 'hidden' : 'flex'}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="relative">
        <Avatar
          path={person.profilePath}
          name={person.name}
          className={`h-11 w-11 rounded-full text-xs ring-offset-2 ring-offset-navy-850 sm:h-[4.25rem] sm:w-[4.25rem] sm:text-base ${
            match === 'wrong' ? MATCH_RING.wrong : `${MATCH_RING[match]} ring-[3px]`
          }`}
        />
        {mobileExtra > 0 && (
          <span className="absolute -bottom-1 -right-1.5 rounded-full border-2 border-navy-850 bg-navy-600 px-1 text-[9px] font-bold leading-4 text-white sm:hidden">
            +{mobileExtra}
          </span>
        )}
      </span>
      <span
        className={`mt-1.5 w-full truncate text-center text-[10px] leading-tight sm:text-[13px] ${MATCH_NAME[match]}`}
        title={`${person.name}: ${MATCH_LABEL[match]}`}
      >
        {shortName(person.name)}
      </span>
    </div>
  );
}

function PeopleGroup({
  label,
  short,
  people,
  startDelay,
  grow,
  mobileMax,
}: {
  label: string;
  short?: string;
  people: PersonClue[];
  startDelay: number;
  grow?: boolean;
  /** Máximo de personas visibles en móvil (p. ej. codirectores), para que la fila no se desborde. */
  mobileMax?: number;
}) {
  if (people.length === 0) return null;
  // Las coincidencias primero, para que la persona visible en móvil sea la más informativa.
  const ordered = mobileMax ? [...people].sort((a, b) => Number(b.match !== 'wrong') - Number(a.match !== 'wrong')) : people;
  const hidden = mobileMax ? Math.max(0, ordered.length - mobileMax) : 0;
  return (
    <div className={`flex min-w-0 flex-col items-center ${grow ? 'flex-1' : ''}`}>
      <Label label={label} short={short} className="mb-2 text-navy-300" />
      <div className="flex justify-center gap-0.5 sm:gap-3">
        {ordered.map((c, i) => (
          <PersonView
            key={c.person.id}
            clue={c}
            delay={startDelay + i * 90}
            hiddenOnMobile={mobileMax != null && i >= mobileMax}
            mobileExtra={mobileMax != null && i === mobileMax - 1 ? hidden : 0}
          />
        ))}
      </div>
    </div>
  );
}

const Divider = () => <span className="hidden w-px self-stretch bg-navy-600/80 sm:block" aria-hidden />;

function GuessCard({ result }: { result: GuessResult }) {
  const { movie, clues, isCorrect } = result;
  let cell = 0;
  const next = () => 150 + cell++ * 110;
  const logo = imageUrl(clues.studio.company?.logoPath ?? null, 'w185');

  return (
    <li
      className={`animate-fade-up rounded-2xl border bg-navy-850/90 p-3.5 shadow-xl shadow-black/30 sm:p-5 ${
        isCorrect ? 'border-hit/80' : 'border-navy-600/70'
      }`}
    >
      <div className="grid grid-cols-[5.5rem_1fr] gap-x-3.5 gap-y-3 sm:grid-cols-[8.5rem_1fr] sm:gap-x-5 sm:gap-y-3">
        <Poster
          path={movie.posterPath}
          title={movie.title}
          size="w342"
          className="aspect-[2/3] w-full rounded-lg border border-navy-500/50 sm:row-span-2"
        />

        <div className="min-w-0 self-center sm:self-start">
          <h3 className={`text-xl font-bold leading-tight sm:text-3xl ${isCorrect ? 'text-hit' : ''}`}>
            {movie.title}
            {isCorrect && <span className="ml-2">🎉</span>}
          </h3>
          {movie.originalTitle !== movie.title && <p className="mt-0.5 truncate text-xs text-navy-300">{movie.originalTitle}</p>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {clues.genres.values.map((g, i) => {
              const hit = clues.genres.matched.some((m) => m.id === g.id);
              return (
                <span
                  key={g.id}
                  className={`animate-pop-in rounded-full px-2.5 py-0.5 text-xs sm:px-3 sm:py-1 sm:text-sm ${hit ? 'bg-hit text-white' : 'bg-navy-700 text-white'}`}
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  {g.name}
                </span>
              );
            })}
          </div>
        </div>

        <div className="col-span-2 grid grid-cols-3 gap-2 sm:col-span-1">
          <StatCell label="Año" match={clues.year.match} delay={next()}>
            {clues.year.value ?? '—'}
            <Arrow direction={clues.year.direction} />
          </StatCell>
          <StatCell label="Taquilla" match={clues.boxOffice.match} delay={next()}>
            {formatMoney(clues.boxOffice.value)}
            <Arrow direction={clues.boxOffice.direction} />
          </StatCell>
          <div
            className={`row-span-2 flex animate-flip-in flex-col items-center rounded-lg px-2 pb-3 pt-2 text-center ${MATCH_BG[clues.studio.match]}`}
            style={{ animationDelay: `${next()}ms` }}
            aria-label={`Estudio: ${MATCH_LABEL[clues.studio.match]}`}
          >
            <span className="label opacity-90">Estudio</span>
            <div className="flex w-full flex-1 items-center justify-center">
              {logo ? (
                <img
                  src={logo}
                  alt={clues.studio.company?.name}
                  title={clues.studio.company?.name}
                  // Escala de grises invertida + "screen": los logos oscuros quedan claros y los
                  // fondos blancos opacos se vuelven negros y desaparecen sobre la celda.
                  className="max-h-12 max-w-[88%] object-contain mix-blend-screen grayscale invert sm:max-h-[4.5rem]"
                />
              ) : (
                <span className="line-clamp-3 text-sm font-bold uppercase leading-tight sm:text-base">
                  {clues.studio.company?.name ?? '—'}
                </span>
              )}
            </div>
          </div>
          <StatCell label="Clasificación" short="Clasif." match={clues.rated.match} delay={next()}>
            {clues.rated.value ?? 'NR'}
          </StatCell>
          <StatCell label="Puntuación" match={clues.score.match} delay={next()}>
            {clues.score.value ?? '—'}
            <span className="text-[0.75em] opacity-60">/100</span>
            <Arrow direction={clues.score.direction} />
          </StatCell>
        </div>

        <div className="col-span-2 flex items-start justify-between gap-1 border-t border-navy-600/80 pt-3 sm:justify-center sm:gap-5">
          <PeopleGroup label="Director" short="Dir." people={clues.directors} startDelay={650} mobileMax={1} />
          {clues.lead && (
            <>
              <Divider />
              <PeopleGroup label="Protagonista" short="Protag." people={[clues.lead]} startDelay={750} />
            </>
          )}
          {clues.supporting.length > 0 && (
            <>
              <Divider />
              <PeopleGroup label="Reparto" people={clues.supporting} startDelay={850} grow />
            </>
          )}
        </div>
      </div>
    </li>
  );
}

export function GuessList({ guesses }: { guesses: GuessResult[] }) {
  if (guesses.length === 0) return null;
  return (
    <ol className="space-y-4" aria-label="Intentos">
      {guesses.map((g) => (
        <GuessCard key={g.movie.id} result={g} />
      ))}
    </ol>
  );
}
