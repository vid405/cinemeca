export function GameSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Eligiendo película">
      <div className="h-12 animate-pulse rounded-xl bg-ink-800" />
      <div className="h-6 w-2/3 animate-pulse rounded bg-ink-800" />
      {[0, 1].map((i) => (
        <div key={i} className="space-y-2 rounded-xl bg-ink-900 p-2.5">
          <div className="flex items-center gap-2.5">
            <div className="h-12 w-8 animate-pulse rounded bg-ink-700" />
            <div className="h-4 w-40 animate-pulse rounded bg-ink-700" />
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: 8 }, (_, j) => (
              <div key={j} className="h-16 animate-pulse rounded-lg bg-ink-700" style={{ animationDelay: `${j * 60}ms` }} />
            ))}
          </div>
        </div>
      ))}
      <p className="text-center text-sm text-white/40">Buscando una película en la filmoteca…</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-6 text-center" role="alert">
      <p className="text-3xl">📡</p>
      <p className="mt-2 font-semibold">No pudimos cargar la película</p>
      <p className="mt-1 text-sm text-white/60">{message}</p>
      <button onClick={onRetry} className="mt-4 rounded-xl bg-amber-400 px-6 py-2.5 font-bold text-ink-950 hover:bg-amber-300">
        Reintentar
      </button>
    </div>
  );
}

export function EmptyGuesses() {
  return (
    <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-white/50">
      <p className="text-3xl">🎞️</p>
      <p className="mt-2">Hay una película secreta esperando. Escribe cualquier título para empezar a comparar.</p>
    </div>
  );
}

export function MissingToken() {
  return (
    <div className="mx-auto max-w-lg space-y-3 rounded-2xl border border-amber-400/30 bg-ink-900 p-6 text-sm leading-relaxed">
      <h2 className="text-lg font-bold text-amber-300">Falta el token de TMDB</h2>
      <ol className="list-decimal space-y-1 pl-5 text-white/80">
        <li>
          Crea una cuenta en{' '}
          <a className="text-sky-300 underline" href="https://www.themoviedb.org/signup" target="_blank" rel="noopener noreferrer">
            themoviedb.org
          </a>{' '}
          y solicita una API key en Ajustes → API.
        </li>
        <li>
          Copia el <b>API Read Access Token</b> (el largo, tipo Bearer).
        </li>
        <li>
          Copia <code className="rounded bg-white/10 px-1">.env.example</code> a <code className="rounded bg-white/10 px-1">.env</code> y
          pégalo en <code className="rounded bg-white/10 px-1">VITE_TMDB_TOKEN</code>.
        </li>
        <li>Reinicia <code className="rounded bg-white/10 px-1">npm run dev</code>.</li>
      </ol>
    </div>
  );
}
