import type { RoundRules } from '../game/difficulty';
import type { GameMode } from '../game/modes';

/** Franja sobre la partida: modo, nivel de dificultad y cuánto XP se arriesga. */
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
          Nivel <b className="text-white">{tier.rank}</b> · desde {tier.fromYear} · fallar{' '}
          <b className="text-red-300">−{tier.lossPenalty} XP</b>
          {tier.winBonus > 0 && (
            <>
              {' '}
              · acertar <b className="text-hit">+{tier.winBonus}</b> extra
            </>
          )}
        </span>
      )}
    </div>
  );
}
