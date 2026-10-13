import { applyRound, createEmptyProfile, type Profile, type RoundRecord } from '../game/progress';
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

  recordRound(round: RoundRecord): RecordOutcome {
    const before = getRankInfo(profile.xp).index;
    const next = applyRound(profile, round);
    const after = getRankInfo(next.xp);
    set(next);
    return { profile: next, rankUp: after.index > before ? after.rank.name : null };
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
