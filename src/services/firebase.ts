import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { supabaseStorageEnabled, uploadServiceFileToSupabase } from './supabaseStorage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'demo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? 'demo',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? 'demo',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const firebaseEnabled = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID,
);

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export async function logout() {
  return signOut(auth);
}

export async function saveRecord<T extends { id: string }>(path: string, record: T) {
  return setDoc(doc(db, path, record.id), record, { merge: true });
}

export async function removeRecord(path: string, id: string) {
  return deleteDoc(doc(db, path, id));
}

export async function uploadServiceFile(serviceOrderId: string, file: File) {
  if (supabaseStorageEnabled) return uploadServiceFileToSupabase(serviceOrderId, file);
  const fileRef = ref(storage, `service-orders/${serviceOrderId}/${file.name}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

export function subscribeToCollection<T extends { id: string }>(
  path: string,
  onData: (items: T[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    collection(db, path),
    (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T)),
    (error) => onError(error),
  );
}
