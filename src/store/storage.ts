import { createEmptyProfile, normalizeProfile, type Profile } from '../game/progress';

/**
 * Abstracción de persistencia. Es asíncrona a propósito: para migrar a Supabase
 * basta con escribir otro adaptador (p. ej. supabaseAdapter) y cambiar `storage`.
 */
export interface StorageAdapter {
  loadProfile(): Promise<Profile>;
  saveProfile(profile: Profile): Promise<void>;
  resetProfile(): Promise<void>;
}

const PROFILE_KEY = 'cinemeca:profile:v1';

export const localStorageAdapter: StorageAdapter = {
  async loadProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? normalizeProfile(JSON.parse(raw)) : createEmptyProfile();
    } catch {
      return createEmptyProfile();
    }
  },
  async saveProfile(profile) {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // Almacenamiento lleno o bloqueado (modo privado): se sigue jugando sin guardar.
    }
  },
  async resetProfile() {
    try {
      localStorage.removeItem(PROFILE_KEY);
    } catch {
      /* ignorado */
    }
  },
};

export const storage: StorageAdapter = localStorageAdapter;
