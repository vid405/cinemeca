import { useEffect, useState } from 'react';
import type { Hint } from '../game/hints';
import { XP_RULES } from '../game/xp';

interface Props {
  attempts: number;
  maxAttempts: number;
  hintsUsed: number;
  hintsTotal: number;
  onHint: () => void;
  onGiveUp: () => void;
  disabled?: boolean;
}

export function GameControls({ attempts, maxAttempts, hintsUsed, hintsTotal, onHint, onGiveUp, disabled }: Props) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  const hintsLeft = hintsTotal - hintsUsed;

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-1 items-center gap-1" aria-label={`Intento ${attempts} de ${maxAttempts}`}>
        {Array.from({ length: maxAttempts }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < attempts ? 'bg-amber-400' : 'bg-white/10'}`} />
        ))}
        <span className="ml-2 shrink-0 text-xs tabular-nums text-white/50">
          {attempts}/{maxAttempts}
        </span>
      </div>

      <button
        onClick={onHint}
        disabled={disabled || hintsLeft <= 0}
        className="rounded-lg border border-amber-400/40 px-3 py-1.5 text-sm text-amber-300 hover:bg-amber-400/10 disabled:opacity-40"
        title={`Cada pista resta ${XP_RULES.hintPenalty} XP si aciertas`}
      >
        💡 Pista {hintsLeft > 0 && <span className="text-xs opacity-70">(−{XP_RULES.hintPenalty})</span>}
      </button>

      <button
        onClick={() => (confirming ? (setConfirming(false), onGiveUp()) : setConfirming(true))}
        disabled={disabled}
        className={`rounded-lg px-3 py-1.5 text-sm disabled:opacity-40 ${
          confirming ? 'bg-red-700 text-white' : 'border border-white/10 text-white/60 hover:bg-white/5'
        }`}
      >
        {confirming ? '¿Seguro?' : 'Rendirme'}
      </button>
    </div>
  );
}

export function HintList({ hints, revealed }: { hints: Hint[]; revealed: number }) {
  if (revealed === 0) return null;
  return (
    <ul className="space-y-1.5">
      {hints.slice(0, revealed).map((h) => (
        <li key={h.id} className="animate-fade-up rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-sm">
          <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-amber-300">{h.label}</span>
          <span className="text-white/85">{h.value}</span>
        </li>
      ))}
    </ul>
  );
}
