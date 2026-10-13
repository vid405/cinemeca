import { DEFAULT_PREFS, storage, type Prefs } from './storage';

type Listener = () => void;

let prefs: Prefs = DEFAULT_PREFS;
const listeners = new Set<Listener>();

export const prefsStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => prefs,

  async hydrate() {
    prefs = await storage.loadPrefs();
    listeners.forEach((l) => l());
  },

  update(patch: Partial<Prefs>) {
    prefs = { ...prefs, ...patch };
    listeners.forEach((l) => l());
    void storage.savePrefs(prefs);
  },
};
