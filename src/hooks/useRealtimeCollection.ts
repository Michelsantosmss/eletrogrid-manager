import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { firebaseEnabled, subscribeToCollection } from '../services/firebase';

/** Uses Firestore as the source of truth when Firebase is configured, with local demo data as a safe fallback. */
export function useRealtimeCollection<T extends { id: string }>(
  path: string,
  initialValue: T[],
): [T[], Dispatch<SetStateAction<T[]>>, boolean] {
  const [items, setItems] = useState<T[]>(initialValue);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!firebaseEnabled) return;
    return subscribeToCollection<T>(path, (next) => {
      setItems(next.length ? next : initialValue);
      setConnected(true);
    }, () => setConnected(false));
  }, [path]); // `initialValue` is intentionally the initial demo fallback only.

  return [items, setItems, connected];
}
