import { useEffect, useRef, useState } from 'react';
import type { MovieSuggestion } from '../game/types';
import { MIN_QUERY_LENGTH, useMovieSearch } from '../hooks/useMovieSearch';
import { Icon, Poster, Spinner } from './ui';

interface Props {
  onSelect: (movieId: number) => void;
  disabled?: boolean;
  busy?: boolean;
  excludeIds: ReadonlySet<number>;
}

export function SearchBox({ onSelect, disabled, busy, excludeIds }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { results, loading, error } = useMovieSearch(query);

  const items = results.filter((r) => !excludeIds.has(r.id));
  const showList = open && query.trim().length >= MIN_QUERY_LENGTH;

  useEffect(() => setActive(0), [results]);

  // Cerrar al tocar fuera (más fiable en móvil que onBlur).
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);

  const choose = (s: MovieSuggestion) => {
    onSelect(s.id);
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList || items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(items[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-3 rounded-2xl border border-navy-500/60 bg-navy-850/80 px-5 shadow-inner shadow-black/20 transition focus-within:border-navy-300 sm:px-8">
        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Busca una película…"
          autoComplete="off"
          enterKeyHint="send"
          role="combobox"
          aria-expanded={showList}
          aria-controls="search-results"
          aria-autocomplete="list"
          className="h-14 min-w-0 flex-1 bg-transparent text-lg text-white outline-none placeholder:text-navy-300 disabled:opacity-50 sm:h-[5.5rem] sm:text-2xl"
        />
        {loading || busy ? (
          <Spinner className="h-6 w-6" />
        ) : (
          <Icon.search className="h-6 w-6 text-navy-200 sm:h-8 sm:w-8" />
        )}
      </div>

      {showList && (
        <ul
          id="search-results"
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-2 max-h-[60dvh] overflow-y-auto rounded-2xl border border-navy-500/60 bg-navy-800 py-2 shadow-2xl shadow-black/50"
        >
          {error && <li className="px-5 py-3 text-sm text-red-300">{error}</li>}
          {!error && !loading && items.length === 0 && <li className="px-5 py-3 text-sm text-navy-300">Sin resultados.</li>}
          {items.map((s, i) => (
            <li key={s.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onClick={() => choose(s)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-4 px-5 py-2.5 text-left transition ${i === active ? 'bg-navy-600/70' : ''}`}
              >
                <Poster path={s.posterPath} title={s.title} size="w92" className="h-14 w-10 shrink-0 rounded-md" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-semibold">{s.title}</span>
                  {s.originalTitle !== s.title && <span className="block truncate text-xs text-navy-300">{s.originalTitle}</span>}
                </span>
                <span className="shrink-0 text-sm tabular-nums text-navy-300">{s.year ?? '—'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
