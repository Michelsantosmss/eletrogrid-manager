import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { firebaseEnabled, subscribeToCollection } from '../services/firebase';

/** Uses Firestore as the source of truth when Firebase is configured, with local demo data as a safe fallback. */
export function useRealtimeCollection<T extends { id: string }>(
  path: string,
  initialValue: T[],
  cloudEnabled = false,
): [T[], Dispatch<SetStateAction<T[]>>, boolean] {
  const [items, setItems] = useState<T[]>(initialValue);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!firebaseEnabled || !cloudEnabled) {
      setItems(initialValue);
      setConnected(false);
      return;
    }
    setItems([]);
    setConnected(false);
    return subscribeToCollection<T>(path, (next) => {
      setItems(next);
      setConnected(true);
    }, () => setConnected(false));
  }, [cloudEnabled, path]); // initialValue is intentionally stable seed data for demo mode.

  return [items, setItems, connected];
}
