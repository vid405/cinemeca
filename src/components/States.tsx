export function GameSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Eligiendo película">
      <div className="flex justify-between">
        <div className="h-10 w-28 animate-pulse rounded-lg bg-navy-800" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-navy-800" />
        <div className="h-10 w-28 animate-pulse rounded-lg bg-navy-800" />
      </div>
      <div className="h-14 animate-pulse rounded-2xl bg-navy-800 sm:h-[5.5rem]" />
      <div className="rounded-2xl border border-navy-700 bg-navy-850/80 p-4 sm:p-6">
        <div className="flex gap-4 sm:gap-6">
          <div className="aspect-[2/3] w-[5.5rem] animate-pulse rounded-lg bg-navy-700 sm:w-48" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-2/3 animate-pulse rounded bg-navy-700" />
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-6 w-16 animate-pulse rounded-full bg-navy-700" />
              ))}
            </div>
            <div className="hidden grid-cols-3 gap-2.5 sm:grid">
              {Array.from({ length: 6 }, (_, j) => (
                <div key={j} className="h-20 animate-pulse rounded-lg bg-navy-700" style={{ animationDelay: `${j * 70}ms` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-sm text-navy-300">Buscando una película en la filmoteca…</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-400/30 bg-navy-850 p-8 text-center" role="alert">
      <p className="text-4xl">📡</p>
      <p className="mt-3 text-lg font-bold">No pudimos cargar la película</p>
      <p className="mt-1 text-sm text-navy-300">{message}</p>
      <button onClick={onRetry} className="mt-5 rounded-xl bg-near px-7 py-3 font-extrabold text-navy-950 hover:brightness-110">
        Reintentar
      </button>
    </div>
  );
}

export function EmptyGuesses() {
  return (
    <div className="rounded-2xl border border-dashed border-navy-600 p-8 text-center text-sm text-navy-300 sm:text-base">
      <p className="text-4xl">🎞️</p>
      <p className="mt-3">Hay una película secreta esperando. Escribe cualquier título para empezar a comparar.</p>
    </div>
  );
}

export function MissingToken() {
  return (
    <div className="mx-auto max-w-lg space-y-3 rounded-2xl border border-near/30 bg-navy-850 p-6 text-sm leading-relaxed">
      <h2 className="text-lg font-bold text-near">Falta el token de TMDB</h2>
      <ol className="list-decimal space-y-1 pl-5 text-navy-200">
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
        <li>
          Reinicia <code className="rounded bg-white/10 px-1">npm run dev</code>.
        </li>
      </ol>
    </div>
  );
}
