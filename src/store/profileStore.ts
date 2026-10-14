import { applyRound, createEmptyProfile, modeKey, type Profile, type RoundRecord } from '../game/progress';
import { mergeProfiles, type MergeResult } from '../game/sync';
import { getRankInfo } from '../game/xp';
import { storage } from './storage';

type Listener = () => void;

let profile: Profile = createEmptyProfile();
const listeners = new Set<Listener>();

function set(next: Profile) {
  profile = next;
  listeners.forEach((l) => l());
  void storage.saveProfile(next);
}

export interface RecordOutcome {
  profile: Profile;
  /** Nombre del nuevo rango si la partida provocó un ascenso. */
  rankUp: string | null;
  /** Nombre del nuevo rango si se bajó de rango (el modo Hollywood resta XP). */
  rankDown: string | null;
}

export const profileStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => profile,

  async hydrate() {
    profile = await storage.loadProfile();
    listeners.forEach((l) => l());
  },

  /** Registra una partida; el ascenso o descenso es del rango del modo jugado. */
  recordRound(round: RoundRecord): RecordOutcome {
    const key = modeKey(round.mode);
    const before = getRankInfo(profile.modeXp[key]).index;
    const next = applyRound(profile, round);
    const after = getRankInfo(next.modeXp[key]);
    set(next);
    return {
      profile: next,
      rankUp: after.index > before ? after.rank.name : null,
      rankDown: after.index < before ? after.rank.name : null,
    };
  },

  /** Combina el progreso traído de otro dispositivo con el local. */
  importProfile(incoming: Profile): MergeResult {
    const result = mergeProfiles(profile, incoming);
    set(result.profile);
    return result;
  },

  async reset() {
    await storage.resetProfile();
    set(createEmptyProfile());
  },
};
