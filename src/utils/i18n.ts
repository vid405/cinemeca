// Nombres de países e idiomas en español vía Intl (sin llamadas extra a TMDB).

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('es') + s.slice(1);

function makeDisplayNames(type: 'region' | 'language') {
  try {
    return new Intl.DisplayNames(['es'], { type, fallback: 'code' });
  } catch {
    return null;
  }
}

const regions = makeDisplayNames('region');
const languages = makeDisplayNames('language');

// Códigos propios de TMDB que no son ISO estándar.
const LANGUAGE_ALIASES: Record<string, string> = { cn: 'yue', xx: '' };
const LANGUAGE_FALLBACK: Record<string, string> = { xx: 'Sin idioma' };
const REGION_FALLBACK: Record<string, string> = { SU: 'Unión Soviética', XC: 'Checoslovaquia', YU: 'Yugoslavia', XG: 'Alemania Oriental' };

export function countryName(code: string): string {
  if (REGION_FALLBACK[code]) return REGION_FALLBACK[code];
  try {
    return regions?.of(code) ?? code;
  } catch {
    return code;
  }
}

export function languageName(code: string): string {
  if (LANGUAGE_FALLBACK[code]) return LANGUAGE_FALLBACK[code];
  const iso = LANGUAGE_ALIASES[code] ?? code;
  try {
    return capitalize(languages?.of(iso) ?? code);
  } catch {
    return code.toUpperCase();
  }
}
