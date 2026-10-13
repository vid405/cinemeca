/** Atribución requerida por los términos de uso de la API de TMDB. */
export function Footer() {
  return (
    <footer className="mx-auto mt-8 w-full max-w-3xl px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center text-xs text-white/40">
      <a
        href="https://www.themoviedb.org"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="The Movie Database (TMDB)"
        className="inline-block"
      >
        {/* Sustituible por el logo oficial de https://www.themoviedb.org/about/logos-attribution */}
        <svg viewBox="0 0 120 24" className="mx-auto h-5" role="img" aria-hidden>
          <defs>
            <linearGradient id="tmdb-g" x1="0" x2="1">
              <stop offset="0" stopColor="#90cea1" />
              <stop offset="0.56" stopColor="#3cbec9" />
              <stop offset="1" stopColor="#01b4e4" />
            </linearGradient>
          </defs>
          <text x="0" y="19" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="20" fill="url(#tmdb-g)">
            TMDB
          </text>
          <rect x="66" y="7" width="54" height="11" rx="5.5" fill="url(#tmdb-g)" />
        </svg>
      </a>
      <p className="mt-2">Este producto utiliza la API de TMDB, pero no está avalado ni certificado por TMDB.</p>
      <p className="mt-1">Datos e imágenes de películas: The Movie Database (TMDB).</p>
    </footer>
  );
}
