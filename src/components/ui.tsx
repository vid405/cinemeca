import { useEffect, type ReactNode, type SVGProps } from 'react';
import { imageUrl, type ImageSize } from '../api/tmdb';
import { initials } from '../utils/format';

// ---------- Iconos (trazo, estilo lucide) ----------

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    />
  );
}

export const Icon = {
  menu: (p: SVGProps<SVGSVGElement>) => (
    <Svg {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Svg>
  ),
  home: (p: SVGProps<SVGSVGElement>) => (
    <Svg {...p}>
      <path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6.5H9V21H4.5a1 1 0 0 1-1-1z" />
    </Svg>
  ),
  user: (p: SVGProps<SVGSVGElement>) => (
    <Svg {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </Svg>
  ),
  help: (p: SVGProps<SVGSVGElement>) => (
    <Svg {...p}>
      <path d="M8.5 8.5a3.5 3.5 0 1 1 5.2 3c-1 .6-1.7 1.3-1.7 2.5v.5" />
      <circle cx="12" cy="18.5" r=".6" fill="currentColor" />
    </Svg>
  ),
  lock: (p: SVGProps<SVGSVGElement>) => (
    <Svg {...p}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Svg>
  ),
  bulb: (p: SVGProps<SVGSVGElement>) => (
    <Svg {...p}>
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z" />
    </Svg>
  ),
  flag: (p: SVGProps<SVGSVGElement>) => (
    <Svg {...p}>
      <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
    </Svg>
  ),
  search: (p: SVGProps<SVGSVGElement>) => (
    <Svg {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Svg>
  ),
  close: (p: SVGProps<SVGSVGElement>) => (
    <Svg {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  ),
  chart: (p: SVGProps<SVGSVGElement>) => (
    <Svg {...p}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </Svg>
  ),
  message: (p: SVGProps<SVGSVGElement>) => (
    <Svg {...p}>
      <path d="M4 5h16v11H9l-5 4z" />
    </Svg>
  ),
  tag: (p: SVGProps<SVGSVGElement>) => (
    <Svg {...p}>
      <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" />
      <circle cx="8" cy="8" r="1.4" />
    </Svg>
  ),
  check: (p: SVGProps<SVGSVGElement>) => (
    <Svg {...p}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Svg>
  ),
  play: (p: SVGProps<SVGSVGElement>) => (
    <Svg {...p}>
      <path d="M7 4.5v15l12-7.5z" />
    </Svg>
  ),
};

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={`inline-block animate-spin rounded-full border-2 border-white/15 border-t-near ${className}`}
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
  size?: ImageSize;
  className?: string;
}) {
  const src = imageUrl(path, size);
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-navy-700 text-navy-400 ${className}`} aria-hidden>
        🎬
      </div>
    );
  }
  return <img src={src} alt={`Póster de ${title}`} loading="lazy" className={`bg-navy-700 object-cover ${className}`} />;
}

export function Avatar({ path, name, className = '' }: { path: string | null; name: string; className?: string }) {
  const src = imageUrl(path, 'w185');
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-navy-600 font-bold text-navy-200 ${className}`} aria-hidden>
        {initials(name)}
      </div>
    );
  }
  return <img src={src} alt={name} loading="lazy" className={`bg-navy-600 object-cover object-top ${className}`} />;
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
        className="max-h-[90dvh] w-full max-w-md animate-fade-up overflow-y-auto rounded-t-2xl border border-navy-600/70 bg-navy-850 p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-navy-300 hover:bg-white/10 hover:text-white" aria-label="Cerrar">
            <Icon.close className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
