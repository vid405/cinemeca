import { useEffect, useRef, useState } from 'react';
import type { MovieSuggestion } from '../game/types';
import { MIN_QUERY_LENGTH, useMovieSearch } from '../hooks/useMovieSearch';
import { Poster, Spinner } from './ui';

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
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-800 px-3 focus-within:border-amber-400/60">
        <span aria-hidden className="text-white/40">
          🔍
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Escribe el título de una película…"
          autoComplete="off"
          enterKeyHint="send"
          role="combobox"
          aria-expanded={showList}
          aria-controls="search-results"
          aria-autocomplete="list"
          className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-white/35 disabled:opacity-50"
        />
        {(loading || busy) && <Spinner className="h-4 w-4" />}
      </div>

      {showList && (
        <ul
          id="search-results"
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-[60dvh] overflow-y-auto rounded-xl border border-white/10 bg-ink-800 py-1 shadow-2xl"
        >
          {error && <li className="px-4 py-3 text-sm text-red-300">{error}</li>}
          {!error && !loading && items.length === 0 && (
            <li className="px-4 py-3 text-sm text-white/50">Sin resultados.</li>
          )}
          {items.map((s, i) => (
            <li key={s.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onClick={() => choose(s)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left ${i === active ? 'bg-white/10' : ''}`}
              >
                <Poster path={s.posterPath} title={s.title} size="w92" className="h-12 w-8 shrink-0 rounded" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{s.title}</span>
                  {s.originalTitle !== s.title && (
                    <span className="block truncate text-xs text-white/40">{s.originalTitle}</span>
                  )}
                </span>
                <span className="shrink-0 text-sm tabular-nums text-white/50">{s.year ?? '—'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
