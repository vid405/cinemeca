import { useEffect, type ReactNode } from 'react';
import { imageUrl, type PosterSize } from '../api/tmdb';

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={`inline-block animate-spin rounded-full border-2 border-white/20 border-t-amber-400 ${className}`}
    />
  );
}

export function Poster({
  path,
  title,
  size = 'w342',
  className = '',
}: {
  path: string | null;
  title: string;
  size?: PosterSize;
  className?: string;
}) {
  const src = imageUrl(path, size);
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-ink-700 text-lg text-white/30 ${className}`} aria-hidden>
        🎬
      </div>
    );
  }
  return <img src={src} alt={`Póster de ${title}`} loading="lazy" className={`bg-ink-700 object-cover ${className}`} />;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90dvh] w-full max-w-md animate-fade-up overflow-y-auto rounded-t-2xl border border-white/10 bg-ink-900 p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Cerrar">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
