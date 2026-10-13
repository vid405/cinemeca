/** 195_000_000 → "$195M", 1_250_000_000 → "$1.3B", 850_000 → "$850K". */
export function formatMoney(value: number | null): string {
  if (!value) return '—';
  const fmt = (n: number) => (n >= 100 ? Math.round(n).toString() : n.toFixed(1).replace(/\.0$/, ''));
  if (value >= 1e9) return `$${fmt(value / 1e9)}B`;
  if (value >= 1e6) return `$${fmt(value / 1e6)}M`;
  if (value >= 1e3) return `$${fmt(value / 1e3)}K`;
  return `$${value}`;
}

/** "Guillermo del Toro" → "G. del Toro"; nombres de una palabra se dejan igual. */
export function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}
