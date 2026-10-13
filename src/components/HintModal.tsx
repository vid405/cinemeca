import { useEffect, type ReactNode } from 'react';
import type { Hint, HintKind, HintOption } from '../game/hints';
import { XP_RULES } from '../game/xp';
import { Icon } from './ui';

const ICONS: Record<HintKind, ReactNode> = {
  tagline: <Icon.message className="h-7 w-7" />,
  cast: <Icon.user className="h-7 w-7" />,
  keywords: <Icon.tag className="h-7 w-7" />,
};

interface Props {
  options: HintOption[];
  used: Hint[];
  remaining: number;
  nextHintIn: number | null;
  showDontAskAgain: boolean;
  onChoose: (kind: HintKind) => void;
  onClose: () => void;
  onDontShowAgain: () => void;
}

export function HintModal({ options, used, remaining, nextHintIn, showDontAskAgain, onChoose, onClose, onDontShowAgain }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const usedKinds = new Set(used.map((h) => h.kind));
  const status =
    remaining > 0
      ? `${remaining} ${remaining === 1 ? 'uso restante' : 'usos restantes'}`
      : nextHintIn != null
        ? `Siguiente uso en ${nextHintIn} ${nextHintIn === 1 ? 'intento' : 'intentos'}`
        : 'No quedan usos';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hint-title"
        className="w-full max-w-2xl animate-fade-up rounded-3xl border border-navy-600/70 bg-navy-850 p-5 shadow-2xl shadow-black/50 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="hint-title" className="font-display text-4xl uppercase leading-none tracking-wide sm:text-5xl">
            Elige una pista
          </h2>
          <button
            onClick={onClose}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-navy-500/70 bg-navy-700/70 text-navy-200 transition hover:bg-navy-600 hover:text-white sm:h-16 sm:w-16"
            aria-label="Cerrar"
          >
            <Icon.close className="h-6 w-6" />
          </button>
        </div>

        <p className="mt-3 text-lg text-navy-400 sm:mt-5 sm:text-xl">
          {status}
          <span className="ml-2 text-sm">· −{XP_RULES.hintPenalty} XP cada una</span>
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-4">
          {options.map((o) => {
            const isUsed = usedKinds.has(o.kind);
            const disabled = isUsed || !o.available || remaining <= 0;
            return (
              <button
                key={o.kind}
                onClick={() => onChoose(o.kind)}
                disabled={disabled}
                className={`flex flex-col items-center rounded-xl border px-2 py-5 text-center transition sm:px-4 sm:py-7 ${
                  disabled
                    ? 'cursor-not-allowed border-navy-700 bg-navy-800/50 opacity-50'
                    : 'border-navy-600/80 bg-navy-800 hover:border-near hover:bg-navy-900 hover:shadow-[0_0_28px_rgba(251,177,43,0.22)] focus-visible:border-near focus-visible:outline-none'
                }`}
              >
                <span className="text-near">{isUsed ? <Icon.check className="h-7 w-7" /> : ICONS[o.kind]}</span>
                <span className="mt-3 text-sm font-extrabold uppercase tracking-wide sm:text-lg">{o.title}</span>
                <span className="mt-1.5 text-xs leading-snug text-navy-300 sm:text-base">
                  {isUsed ? 'Ya usada' : o.available ? o.description : 'No disponible'}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          autoFocus
          className="mt-5 w-full rounded-full border-2 border-navy-200/80 py-4 text-lg font-bold transition hover:bg-white/5 sm:mt-6 sm:text-xl"
        >
          Seguir adivinando
        </button>

        {showDontAskAgain && (
          <button
            onClick={onDontShowAgain}
            className="mx-auto mt-4 block text-sm text-navy-400 underline underline-offset-4 hover:text-navy-200 sm:text-base"
            title="No abrir esta ventana automáticamente al desbloquear una pista"
          >
            No volver a mostrar
          </button>
        )}
      </div>
    </div>
  );
}
