import type { RoundRules } from '../game/difficulty';
import type { GameMode } from '../game/modes';

/** Franja sobre la partida: modo y, en Hollywood, nivel de dificultad y castigo por fallar. */
export function ModeBadge({ mode, rules }: { mode: GameMode; rules: RoundRules }) {
  const tier = rules.tier;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
      <span
        className={`label rounded-full px-3 py-1 ${tier ? 'bg-near text-navy-950' : 'border border-navy-500/70 text-navy-200'}`}
      >
        {tier ? '🎬 Hollywood' : '🌍 Pistas'}
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
      {!tier && <span className="sr-only">{mode.description}</span>}
    </div>
  );
}
