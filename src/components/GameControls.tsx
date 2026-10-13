import { useEffect, useState } from 'react';
import type { Hint } from '../game/hints';
import { XP_RULES } from '../game/xp';
import { shortName } from '../utils/format';
import { HINT_ICONS } from './HintModal';
import { Avatar, Icon, Poster } from './ui';

interface Props {
  attempts: number;
  maxAttempts: number;
  hintsUsed: number;
  hintsTotal: number;
  hintsRemaining: number;
  nextHintIn: number | null;
  onHint: () => void;
  onGiveUp: () => void;
  disabled?: boolean;
}

const pill =
  'flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs transition disabled:cursor-not-allowed sm:gap-2 sm:px-3.5 sm:text-sm';

export function GameControls(p: Props) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  const canHint = p.hintsRemaining > 0;
  const hintLabel = canHint
    ? p.hintsRemaining > 1
      ? `Pista ×${p.hintsRemaining}`
      : 'Pista'
    : p.nextHintIn != null
      ? `Pista en ${p.nextHintIn}`
      : 'Sin pistas';

  return (
    <div className="flex items-center justify-between gap-2">
      <button
        onClick={p.onHint}
        disabled={p.disabled || !canHint}
        className={`${pill} ${canHint ? 'border-near/70 text-near hover:bg-near/10' : 'border-navy-600/70 text-navy-400'}`}
        title={`Las pistas se desbloquean con los intentos. Cada una resta ${XP_RULES.hintPenalty} XP.`}
      >
        {canHint ? <Icon.bulb className="h-5 w-5" /> : <Icon.lock className="h-5 w-5" />}
        <span className="whitespace-nowrap">{hintLabel}</span>
      </button>

      <p className="min-w-0 whitespace-nowrap text-sm text-navy-200 sm:text-base" aria-live="polite">
        Intento <b className="font-bold text-near">{Math.min(p.attempts + 1, p.maxAttempts)}</b> de {p.maxAttempts}
      </p>

      <button
        onClick={() => (confirming ? (setConfirming(false), p.onGiveUp()) : setConfirming(true))}
        disabled={p.disabled}
        className={`${pill} ${
          confirming ? 'border-red-500 bg-red-600 text-white' : 'border-navy-400/70 text-navy-200 hover:bg-white/5'
        }`}
      >
        <Icon.flag className="h-5 w-5" />
        <span className="whitespace-nowrap">{confirming ? '¿Seguro?' : 'Rendirse'}</span>
      </button>
    </div>
  );
}

function HintBody({ hint }: { hint: Hint }) {
  if (hint.film) {
    const { film } = hint;
    return (
      <span className="flex items-center gap-3">
        <Poster path={film.posterPath} title={film.title} size="w92" className="h-14 w-10 shrink-0 rounded-md" />
        <span>
          <span className="block font-semibold text-white">{film.title}</span>
          <span className="block text-xs text-navy-300">
            {film.year ?? 's/f'} ·{' '}
            {hint.kind === 'director-film' ? 'la dirigió la misma persona' : 'comparte a alguien del reparto principal'}
          </span>
        </span>
      </span>
    );
  }
  if (hint.person) {
    return (
      <span className="flex items-center gap-3">
        <Avatar path={hint.person.profilePath} name={hint.person.name} className="h-11 w-11 rounded-full ring-2 ring-near" />
        <span>
          <span className="block font-semibold text-white">{hint.person.name}</span>
          <span className="block text-xs text-navy-300">Aparece en el reparto principal · {shortName(hint.person.name)}</span>
        </span>
      </span>
    );
  }
  if (hint.tags) {
    return (
      <span className="flex flex-wrap gap-1.5">
        {hint.tags.map((t) => (
          <span key={t} className="rounded-full bg-navy-700 px-2.5 py-0.5 text-sm text-navy-200">
            {t}
          </span>
        ))}
      </span>
    );
  }
  return <span className="text-navy-200">{hint.text}</span>;
}

export function HintList({ hints }: { hints: Hint[] }) {
  if (hints.length === 0) return null;
  return (
    <ul className="space-y-2">
      {hints.map((h) => (
        <li key={h.kind} className="flex animate-fade-up gap-3 rounded-xl border border-near/25 bg-near/[0.07] px-4 py-3 text-sm sm:text-base">
          <span className="mt-0.5 shrink-0 text-near">{HINT_ICONS[h.kind]('h-5 w-5')}</span>
          <span className="min-w-0 flex-1">
            <span className="label mb-1.5 block text-near">{h.label}</span>
            <HintBody hint={h} />
          </span>
        </li>
      ))}
    </ul>
  );
}
