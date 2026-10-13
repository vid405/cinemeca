import { getStats } from '../game/progress';
import { getRankInfo, RANKS } from '../game/xp';
import { useProfile } from '../hooks/useProfile';
import { profileStore } from '../store/profileStore';
import { Modal } from './ui';

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-xl bg-navy-700/80 px-2 py-3 text-center">
      <div className="text-2xl font-extrabold tabular-nums">{value}</div>
      <div className="text-[11px] leading-tight text-navy-300">{label}</div>
    </div>
  );
}

export function StatsModal({ onClose, onSync }: { onClose: () => void; onSync: () => void }) {
  const profile = useProfile();
  const stats = getStats(profile);
  const info = getRankInfo(profile.xp);
  const maxDist = Math.max(1, ...profile.distribution);

  const reset = () => {
    if (window.confirm('¿Borrar todo tu progreso (XP, rachas, estadísticas y la Filmoteca)? Las películas ya jugadas podrán volver a salir.')) void profileStore.reset();
  };

  return (
    <Modal title="Perfil y estadísticas" onClose={onClose}>
      <div className="mb-4 rounded-xl border border-near/25 bg-near/[0.06] p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-lg font-extrabold text-near">{info.rank.name}</span>
          <span className="text-sm tabular-nums text-navy-200">{profile.xp} XP</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-navy-700">
          <div className="h-full rounded-full bg-near" style={{ width: `${Math.round(info.progress * 100)}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-navy-300">
          {info.next ? `${info.next.minXp - profile.xp} XP para ${info.next.name}` : 'Rango máximo alcanzado'}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {RANKS.map((r, i) => (
            <span
              key={r.name}
              className={`rounded px-1.5 py-0.5 text-[10px] ${i <= info.index ? 'bg-near/20 text-amber-200' : 'bg-navy-700 text-navy-400'}`}
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

      <h3 className="mb-2 mt-5 text-sm font-semibold text-navy-200">Aciertos por número de intentos</h3>
      <div className="space-y-1">
        {profile.distribution.map((n, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-4 text-right tabular-nums text-navy-300">{i + 1}</span>
            <div
              className={`rounded px-1.5 py-0.5 text-right font-bold tabular-nums ${n ? 'bg-hit' : 'bg-navy-700'}`}
              style={{ width: `${Math.max(8, (n / maxDist) * 100)}%` }}
            >
              {n}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onSync}
        className="mt-6 w-full rounded-xl border border-navy-400/70 py-3 text-sm font-bold text-navy-200 transition hover:bg-white/5"
      >
        📱 Sincronizar con otro dispositivo
      </button>

      <button onClick={reset} className="mt-4 block text-xs text-navy-400 underline hover:text-red-300">
        Reiniciar progreso
      </button>
    </Modal>
  );
}
