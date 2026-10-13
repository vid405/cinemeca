import { getStats } from '../game/progress';
import { getRankInfo, RANKS } from '../game/xp';
import { useProfile } from '../hooks/useProfile';
import { profileStore } from '../store/profileStore';
import { Modal } from './ui';

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-2 py-3 text-center">
      <div className="text-2xl font-black tabular-nums">{value}</div>
      <div className="text-[11px] leading-tight text-white/50">{label}</div>
    </div>
  );
}

export function StatsModal({ onClose }: { onClose: () => void }) {
  const profile = useProfile();
  const stats = getStats(profile);
  const info = getRankInfo(profile.xp);
  const maxDist = Math.max(1, ...profile.distribution);

  const reset = () => {
    if (window.confirm('¿Borrar todo tu progreso (XP, rachas y estadísticas)?')) void profileStore.reset();
  };

  return (
    <Modal title="Estadísticas" onClose={onClose}>
      <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-lg font-bold text-amber-300">{info.rank.name}</span>
          <span className="text-sm tabular-nums text-white/60">{profile.xp} XP</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.round(info.progress * 100)}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-white/50">
          {info.next ? `${info.next.minXp - profile.xp} XP para ${info.next.name}` : 'Rango máximo alcanzado'}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {RANKS.map((r, i) => (
            <span
              key={r.name}
              className={`rounded px-1.5 py-0.5 text-[10px] ${i <= info.index ? 'bg-amber-400/20 text-amber-200' : 'bg-white/5 text-white/30'}`}
            >
              {r.name} · {r.minXp}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat value={stats.gamesPlayed} label="Jugadas" />
        <Stat value={`${stats.winRate}%`} label="Aciertos" />
        <Stat value={stats.avgAttempts || '—'} label="Intentos promedio" />
        <Stat value={stats.currentStreak} label="Racha actual" />
        <Stat value={stats.bestStreak} label="Mejor racha" />
        <Stat value={stats.wins} label="Ganadas" />
      </div>

      <h3 className="mb-2 mt-5 text-sm font-semibold text-white/70">Aciertos por número de intentos</h3>
      <div className="space-y-1">
        {profile.distribution.map((n, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-3 tabular-nums text-white/50">{i + 1}</span>
            <div
              className="rounded bg-emerald-600 px-1.5 py-0.5 text-right font-semibold tabular-nums"
              style={{ width: `${Math.max(8, (n / maxDist) * 100)}%` }}
            >
              {n}
            </div>
          </div>
        ))}
      </div>

      <button onClick={reset} className="mt-6 text-xs text-white/40 underline hover:text-red-300">
        Reiniciar progreso
      </button>
    </Modal>
  );
}
