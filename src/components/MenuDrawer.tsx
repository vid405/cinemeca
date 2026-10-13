import { useEffect, type ReactNode } from 'react';
import { Icon } from './ui';

export interface MenuAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

export function MenuDrawer({ actions, onClose }: { actions: MenuAction[]; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <nav
        className="flex h-full w-72 max-w-[85vw] animate-fade-up flex-col border-r border-navy-600/70 bg-navy-850 p-5 pt-[calc(1.25rem+env(safe-area-inset-top))]"
        onClick={(e) => e.stopPropagation()}
        aria-label="Menú principal"
      >
        <div className="mb-6 flex items-center justify-between">
          <span className="text-2xl font-extrabold">
            <span className="text-near">Cine</span>Meca
          </span>
          <button onClick={onClose} className="rounded-full p-1.5 text-navy-300 hover:bg-white/10 hover:text-white" aria-label="Cerrar menú">
            <Icon.close className="h-5 w-5" />
          </button>
        </div>
        <ul className="space-y-1">
          {actions.map((a) => (
            <li key={a.label}>
              <button
                onClick={() => {
                  onClose();
                  a.onClick();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold text-navy-200 transition hover:bg-navy-700 hover:text-white"
              >
                {a.icon}
                {a.label}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-auto text-xs text-navy-400">Datos de películas: TMDB</p>
      </nav>
    </div>
  );
}
