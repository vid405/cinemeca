import { getRankInfo } from '../game/xp';
import { useProfile } from '../hooks/useProfile';
import { Icon } from './ui';

interface Props {
  onMenu: () => void;
  onHome: () => void;
  onHelp: () => void;
  onProfile: () => void;
}

/** Barra superior: botones circulares en las esquinas y progreso compacto al centro. */
export function Header({ onMenu, onHome, onHelp, onProfile }: Props) {
  const profile = useProfile();
  const info = getRankInfo(profile.xp);

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 pb-2 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:gap-3 sm:px-5 sm:pt-4">
      <button className="icon-btn" onClick={onMenu} aria-label="Menú">
        <Icon.menu className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
      <button className="icon-btn" onClick={onHome} aria-label="Inicio">
        <Icon.home className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      <button
        onClick={onProfile}
        className="mx-auto flex min-w-0 max-w-[16rem] flex-1 flex-col rounded-xl px-2 py-1 text-left transition hover:bg-white/5 sm:max-w-xs"
        aria-label="Ver perfil y estadísticas"
      >
        <span className="flex items-baseline justify-between gap-2 text-[11px] sm:text-xs">
          <span className="truncate font-bold text-near">{info.rank.name}</span>
          <span className="shrink-0 tabular-nums text-navy-300">
            🔥 {profile.currentStreak}
            <span className="hidden min-[420px]:inline">
              {' '}
              · {info.next ? `${info.xpIntoRank}/${info.xpForNext}` : profile.xp} XP
            </span>
          </span>
        </span>
        <span className="mt-1 h-1.5 overflow-hidden rounded-full bg-navy-700">
          <span
            className="block h-full rounded-full bg-gradient-to-r from-near to-amber-300 transition-[width] duration-700"
            style={{ width: `${Math.round(info.progress * 100)}%` }}
          />
        </span>
      </button>

      <button className="icon-btn" onClick={onHelp} aria-label="Cómo jugar">
        <Icon.help className="h-5 w-5 sm:h-7 sm:w-7" />
      </button>
      <button className="icon-btn" onClick={onProfile} aria-label="Perfil">
        <Icon.user className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
    </header>
  );
}
