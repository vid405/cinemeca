import { getStats } from '../game/progress';
import { getRankInfo } from '../game/xp';
import { useProfile } from '../hooks/useProfile';
import { Icon } from './ui';

const UPCOMING = [
  { name: 'Fotograma borroso', desc: 'Adivina a partir de una imagen que se va aclarando.', emoji: '🌫️' },
  { name: 'Emojis', desc: 'La trama contada solo con emojis.', emoji: '🍿' },
  { name: 'Contrarreloj', desc: 'Todas las que puedas antes de que acabe el tiempo.', emoji: '⏱️' },
];

export function Home({ onPlay }: { onPlay: () => void }) {
  const profile = useProfile();
  const stats = getStats(profile);
  const info = getRankInfo(profile.xp);

  return (
    <div className="animate-fade-up space-y-8 py-4 sm:py-10">
      <div className="text-center">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
          <span className="text-near">Cine</span>Meca
        </h1>
        <p className="mt-3 text-navy-300 sm:text-lg">Adivina películas de todo el mundo. Sin límite diario.</p>
      </div>

      <button
        onClick={onPlay}
        className="group flex w-full items-center gap-4 rounded-2xl border border-near/50 bg-navy-850/90 p-5 text-left shadow-xl shadow-black/30 transition hover:border-near sm:p-7"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-near text-navy-950 transition group-hover:scale-105 sm:h-16 sm:w-16">
          <Icon.play className="h-6 w-6 fill-current sm:h-7 sm:w-7" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xl font-bold sm:text-2xl">Jugar · Modo Pistas</span>
          <span className="block text-sm text-navy-300 sm:text-base">
            10 intentos. Año, taquilla, estudio, clasificación, puntuación, géneros y reparto.
          </span>
        </span>
      </button>

      <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">
        {[
          [info.rank.name, `${profile.xp} XP`],
          [`${stats.winRate}%`, `${stats.gamesPlayed} jugadas`],
          [`🔥 ${stats.currentStreak}`, `mejor: ${stats.bestStreak}`],
        ].map(([a, b]) => (
          <div key={b} className="rounded-xl border border-navy-600/60 bg-navy-850/70 px-2 py-3">
            <div className="truncate text-[15px] font-extrabold text-white sm:text-xl">{a}</div>
            <div className="text-xs text-navy-300">{b}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="label mb-3 text-navy-300">Próximamente</h2>
        <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
          {UPCOMING.map((m) => (
            <div key={m.name} className="rounded-xl border border-navy-700 bg-navy-850/50 p-4 opacity-70">
              <div className="text-2xl">{m.emoji}</div>
              <div className="mt-1 font-bold">{m.name}</div>
              <div className="text-xs text-navy-300">{m.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
