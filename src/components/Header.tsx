import { Icon } from './ui';

interface Props {
  onMenu: () => void;
  onHome: () => void;
  onHelp: () => void;
  onProfile: () => void;
}

/** Barra superior: botones circulares en las esquinas (el nivel de cada modo está en Inicio). */
export function Header({ onMenu, onHome, onHelp, onProfile }: Props) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 pb-2 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:gap-3 sm:px-5 sm:pt-4">
      <button className="icon-btn" onClick={onMenu} aria-label="Menú">
        <Icon.menu className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
      <button className="icon-btn" onClick={onHome} aria-label="Inicio">
        <Icon.home className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      <span className="flex-1" />

      <button className="icon-btn" onClick={onHelp} aria-label="Cómo jugar">
        <Icon.help className="h-5 w-5 sm:h-7 sm:w-7" />
      </button>
      <button className="icon-btn" onClick={onProfile} aria-label="Perfil">
        <Icon.user className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
    </header>
  );
}
