import { createEmptyProfile, normalizeProfile, type Profile } from '../game/progress';

/** Preferencias de interfaz del jugador. */
export interface Prefs {
  /** Abrir el selector de pistas automáticamente cuando se desbloquea una. */
  autoOpenHints: boolean;
}

export const DEFAULT_PREFS: Prefs = { autoOpenHints: true };

/**
 * Abstracción de persistencia. Es asíncrona a propósito: para migrar a Supabase
 * basta con escribir otro adaptador (p. ej. supabaseAdapter) y cambiar `storage`.
 */
export interface StorageAdapter {
  loadProfile(): Promise<Profile>;
  saveProfile(profile: Profile): Promise<void>;
  resetProfile(): Promise<void>;
  loadPrefs(): Promise<Prefs>;
  savePrefs(prefs: Prefs): Promise<void>;
}

const PROFILE_KEY = 'cinemeca:profile:v1';
const PREFS_KEY = 'cinemeca:prefs:v1';

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Almacenamiento lleno o bloqueado (modo privado): se sigue jugando sin guardar.
  }
}

export const localStorageAdapter: StorageAdapter = {
  async loadProfile() {
    const raw = read<unknown>(PROFILE_KEY);
    return raw ? normalizeProfile(raw) : createEmptyProfile();
  },
  async saveProfile(profile) {
    write(PROFILE_KEY, profile);
  },
  async resetProfile() {
    try {
      localStorage.removeItem(PROFILE_KEY);
    } catch {
      /* ignorado */
    }
  },
  async loadPrefs() {
    return { ...DEFAULT_PREFS, ...read<Partial<Prefs>>(PREFS_KEY) };
  },
  async savePrefs(prefs) {
    write(PREFS_KEY, prefs);
  },
};

export const storage: StorageAdapter = localStorageAdapter;
