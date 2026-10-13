import { useEffect, type ReactNode } from 'react';
import type { Hint, HintKind, HintOption } from '../game/hints';
import { XP_RULES } from '../game/xp';
import { Icon, Spinner } from './ui';

export const HINT_ICONS: Record<HintKind, (className: string) => ReactNode> = {
  tagline: (c) => <Icon.message className={c} />,
  cast: (c) => <Icon.user className={c} />,
  keywords: (c) => <Icon.tag className={c} />,
  'director-film': (c) => <Icon.clapper className={c} />,
  'cast-film': (c) => <Icon.users className={c} />,
};

interface Props {
  options: HintOption[];
  used: Hint[];
  remaining: number;
  nextHintIn: number | null;
  loading: HintKind | null;
  error: string | null;
  onChoose: (kind: HintKind) => void;
  onClose: () => void;
}

export function HintModal({ options, used, remaining, nextHintIn, loading, error, onChoose, onClose }: Props) {
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
        className="max-h-[92dvh] w-full max-w-2xl animate-fade-up overflow-y-auto rounded-3xl border border-navy-600/70 bg-navy-850 p-5 shadow-2xl shadow-black/50 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="hint-title" className="font-display text-4xl uppercase leading-none tracking-wide sm:text-5xl">
            Elige una pista
          </h2>
          <button
            onClick={onClose}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-navy-500/70 bg-navy-700/70 text-navy-200 transition hover:bg-navy-600 hover:text-white sm:h-14 sm:w-14"
            aria-label="Cerrar"
          >
            <Icon.close className="h-6 w-6" />
          </button>
        </div>

        <p className="mt-3 text-lg text-navy-400 sm:mt-4 sm:text-xl">
          {status}
          <span className="ml-2 text-sm">· −{XP_RULES.hintPenalty} XP cada una</span>
        </p>

        {/* 3 + 2 en escritorio, 2 + 2 + 1 en móvil; las filas incompletas quedan centradas. */}
        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-3">
          {options.map((o) => {
            const isUsed = usedKinds.has(o.kind);
            const isLoading = loading === o.kind;
            const disabled = isUsed || !o.available || remaining <= 0 || loading != null;
            return (
              <button
                key={o.kind}
                onClick={() => onChoose(o.kind)}
                disabled={disabled}
                aria-busy={isLoading}
                className={`flex w-[calc(50%-0.25rem)] flex-col items-center rounded-xl border px-2 py-4 text-center transition sm:w-[calc(33.333%-0.5rem)] sm:px-3 sm:py-5 ${
                  isLoading
                    ? 'border-near bg-navy-900'
                    : disabled
                      ? 'cursor-not-allowed border-navy-700 bg-navy-800/50 opacity-50'
                      : 'border-navy-600/80 bg-navy-800 hover:border-near hover:bg-navy-900 hover:shadow-[0_0_28px_rgba(251,177,43,0.22)] focus-visible:border-near focus-visible:outline-none'
                }`}
              >
                <span className="flex h-7 items-center text-near">
                  {isLoading ? <Spinner className="h-6 w-6" /> : isUsed ? <Icon.check className="h-7 w-7" /> : HINT_ICONS[o.kind]('h-7 w-7')}
                </span>
                <span className="mt-2.5 text-sm font-extrabold uppercase tracking-wide sm:text-base">{o.title}</span>
                <span className="mt-1 text-xs leading-snug text-navy-300 sm:text-sm">
                  {isLoading ? 'Buscando…' : isUsed ? 'Ya usada' : o.available ? o.description : 'No disponible'}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-red-950/60 px-3 py-2 text-center text-sm text-red-200">
            {error}
          </p>
        )}

        <button
          onClick={onClose}
          autoFocus
          className="mt-5 w-full rounded-full border-2 border-navy-200/80 py-3.5 text-lg font-bold transition hover:bg-white/5 sm:text-xl"
        >
          Seguir adivinando
        </button>
      </div>
    </div>
  );
}
