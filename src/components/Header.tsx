import { getRankInfo } from '../game/xp';
import { useProfile } from '../hooks/useProfile';

export function Header({ onStats, onHelp }: { onStats: () => void; onHelp: () => void }) {
  const profile = useProfile();
  const info = getRankInfo(profile.xp);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/85 backdrop-blur pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
        <h1 className="shrink-0 text-xl font-black tracking-tight">
          <span className="text-amber-400">Cine</span>Meca
        </h1>

        <button
          onClick={onStats}
          className="min-w-0 flex-1 rounded-lg px-2 py-1 text-left hover:bg-white/5"
          aria-label="Ver estadísticas"
        >
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate font-semibold text-amber-300">{info.rank.name}</span>
            <span className="shrink-0 tabular-nums text-white/50">
              {info.next ? `${info.xpIntoRank}/${info.xpForNext} XP` : `${profile.xp} XP`}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-[width] duration-700"
              style={{ width: `${Math.round(info.progress * 100)}%` }}
            />
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <span
            className="rounded-lg bg-white/5 px-2 py-1 text-sm tabular-nums"
            title={`Racha actual · mejor: ${profile.bestStreak}`}
          >
            🔥 {profile.currentStreak}
          </span>
          <button onClick={onHelp} className="rounded-lg px-2 py-1 text-white/70 hover:bg-white/5" aria-label="Cómo jugar">
            ?
          </button>
        </div>
      </div>
    </header>
  );
}
