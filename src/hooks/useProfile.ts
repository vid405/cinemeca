import { useSyncExternalStore } from 'react';
import { profileStore } from '../store/profileStore';

export function useProfile() {
  return useSyncExternalStore(profileStore.subscribe, profileStore.getSnapshot);
}
