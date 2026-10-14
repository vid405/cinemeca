import type { RoundRules } from '../game/difficulty';
import type { GameMode } from '../game/modes';

/** Franja sobre la partida: modo y nivel actual (el detalle de cada nivel está en la ayuda). */
export function ModeBadge({ mode, rules }: { mode: GameMode; rules: RoundRules }) {
  const tier = rules.tier;
  const hollywood = mode.id === 'hollywood';
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
      <span
        className={`label rounded-full px-3 py-1 ${hollywood ? 'bg-near text-navy-950' : 'border border-navy-500/70 text-navy-200'}`}
      >
        {hollywood ? '🎬 Hollywood' : '🌍 Es Cine'}
      </span>
      {tier && (
        <span className="text-xs text-navy-300 sm:text-sm">
          Nivel <b className="text-white">{tier.rank}</b>
        </span>
      )}
    </div>
  );
}
