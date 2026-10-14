import type { ReactNode } from 'react';
import { HOLLYWOOD_TIERS, tierFor, WORLD_TIERS, type DifficultyTier } from '../game/difficulty';
import { getStats } from '../game/progress';
import { getRankInfo } from '../game/xp';
import { useProfile } from '../hooks/useProfile';
import { Icon, Poster } from './ui';

const UPCOMING = [
  { name: 'Fotograma borroso', desc: 'Adivina a partir de una imagen que se va aclarando.', emoji: '🌫️' },
  { name: 'Emojis', desc: 'La trama contada solo con emojis.', emoji: '🍿' },
  { name: 'Contrarreloj', desc: 'Todas las que puedas antes de que acabe el tiempo.', emoji: '⏱️' },
];

type PlayableMode = 'clues' | 'hollywood';

function ModeCard({
  title,
  emoji,
  accent,
  continuing,
  onClick,
  children,
}: {
  title: string;
  emoji: string;
  accent: boolean;
  continuing: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full flex-col rounded-2xl border bg-navy-850/90 p-5 text-left shadow-xl shadow-black/30 transition sm:p-6 ${
        accent ? 'border-near/60 hover:border-near' : 'border-navy-500/70 hover:border-navy-300'
      }`}
    >
      <span className="flex items-center gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-navy-950 transition group-hover:scale-105 ${
            accent ? 'bg-near' : 'bg-navy-200'
          }`}
        >
          <Icon.play className="h-5 w-5 fill-current" />
        </span>
        <span className="min-w-0">
          <span className="block text-xl font-bold sm:text-2xl">
            {emoji} {title}
          </span>
          <span className="label text-navy-300">{continuing ? 'Continuar partida' : 'Jugar'}</span>
        </span>
      </span>
      <span className="mt-3 block text-sm leading-relaxed text-navy-300">{children}</span>
    </button>
  );
}

/** Barra de niveles del modo (el detalle de cada nivel está en la ayuda). */
function TierProgress({ tiers, xp }: { tiers: DifficultyTier[]; xp: number }) {
  const tier = tierFor(tiers, xp);
  return (
    <span className="mt-3 flex gap-1" aria-label={`Nivel ${tier.level + 1} de ${tiers.length}`}>
      {tiers.map((t) => (
        <span key={t.level} className={`h-1.5 flex-1 rounded-full ${t.level <= tier.level ? 'bg-near' : 'bg-navy-700'}`} />
      ))}
    </span>
  );
}

export function Home({
  onPlay,
  inProgress,
  onLibrary,
}: {
  onPlay: (mode: PlayableMode) => void;
  inProgress: PlayableMode[];
  onLibrary: () => void;
}) {
  const profile = useProfile();
  const stats = getStats(profile);
  const info = getRankInfo(profile.xp);

  return (
    <div className="animate-fade-up space-y-6 py-4 sm:space-y-8 sm:py-10">
      <div className="text-center">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
          <span className="text-near">Cine</span>Meca
        </h1>
        <p className="mt-3 text-navy-300 sm:text-lg">Adivina películas sin límite diario.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <ModeCard title="Hollywood" emoji="🎬" accent continuing={inProgress.includes('hollywood')} onClick={() => onPlay('hollywood')}>
          Los grandes éxitos.
          <TierProgress tiers={HOLLYWOOD_TIERS} xp={profile.xp} />
        </ModeCard>

        <ModeCard title="Es Cine" emoji="🌍" accent={false} continuing={inProgress.includes('clues')} onClick={() => onPlay('clues')}>
          Cine de todo el mundo
          <TierProgress tiers={WORLD_TIERS} xp={profile.xp} />
        </ModeCard>
      </div>

      <button
        onClick={onLibrary}
        className="flex w-full items-center gap-4 rounded-2xl border border-navy-600/70 bg-navy-850/80 p-4 text-left transition hover:border-navy-400 sm:p-5"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy-700 text-near">
          <Icon.clapper className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold">Filmoteca</span>
          <span className="block text-sm text-navy-300">
            {profile.history.length
              ? `${profile.history.length} ${profile.history.length === 1 ? 'película jugada' : 'películas jugadas'}`
              : 'Aquí aparecerán las películas que juegues'}
          </span>
        </span>
        <span className="hidden -space-x-3 sm:flex" aria-hidden>
          {profile.history.slice(0, 5).map((h) => (
            <Poster key={h.movieId} path={h.posterPath} title={h.title} size="w92" className="h-14 w-10 rounded border-2 border-navy-850" />
          ))}
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
