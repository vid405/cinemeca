import { useEffect, useState } from 'react';
import type { Hint } from '../game/hints';
import { XP_RULES } from '../game/xp';
import { Icon } from './ui';

interface Props {
  attempts: number;
  maxAttempts: number;
  hintsUsed: number;
  hintsUnlocked: number;
  hintsTotal: number;
  nextHintIn: number | null;
  onHint: () => void;
  onGiveUp: () => void;
  disabled?: boolean;
}

const pill =
  'flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs transition disabled:cursor-not-allowed sm:gap-2 sm:px-4 sm:text-base';

export function GameControls(p: Props) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  const canHint = p.hintsUsed < p.hintsUnlocked;
  const hintLabel = canHint
    ? `Pista −${XP_RULES.hintPenalty}`
    : p.nextHintIn != null
      ? `Pista en ${p.nextHintIn}`
      : p.hintsUsed >= p.hintsTotal
        ? 'Sin pistas'
        : 'Pista';

  return (
    <div className="flex items-center justify-between gap-2">
      <button
        onClick={p.onHint}
        disabled={p.disabled || !canHint}
        className={`${pill} ${
          canHint
            ? 'border-near/70 text-near hover:bg-near/10'
            : 'border-navy-600/70 text-navy-400'
        }`}
        title={`Las pistas se desbloquean con los intentos. Cada una resta ${XP_RULES.hintPenalty} XP.`}
      >
        {canHint ? <Icon.bulb className="h-5 w-5" /> : <Icon.lock className="h-5 w-5" />}
        <span className="whitespace-nowrap">{hintLabel}</span>
      </button>

      <p className="min-w-0 whitespace-nowrap text-sm text-navy-200 sm:text-xl" aria-live="polite">
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

export function HintList({ hints, revealed }: { hints: Hint[]; revealed: number }) {
  if (revealed === 0) return null;
  return (
    <ul className="space-y-2">
      {hints.slice(0, revealed).map((h) => (
        <li key={h.id} className="flex animate-fade-up gap-3 rounded-xl border border-near/25 bg-near/[0.07] px-4 py-3 text-sm sm:text-base">
          <Icon.bulb className="mt-0.5 h-5 w-5 shrink-0 text-near" />
          <span>
            <span className="label mr-2 text-near">{h.label}</span>
            <span className="text-navy-200">{h.value}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
