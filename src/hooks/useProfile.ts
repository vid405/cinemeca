import { useSyncExternalStore } from 'react';
import { prefsStore } from '../store/prefsStore';
import { profileStore } from '../store/profileStore';

export function useProfile() {
  return useSyncExternalStore(profileStore.subscribe, profileStore.getSnapshot);
}

export function usePrefs() {
  return useSyncExternalStore(prefsStore.subscribe, prefsStore.getSnapshot);
}
