import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Use custom hostname as authDomain for studio.buku.biz.id and studiobuku.pages.dev
const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
const dynamicAuthDomain = (currentHostname.includes('buku.biz.id') || currentHostname.includes('pages.dev'))
  ? currentHostname
  : firebaseConfig.authDomain;

const app = initializeApp({
  ...firebaseConfig,
  authDomain: dynamicAuthDomain
});

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export { firebaseConfig };
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Prompt user to select an account every time
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
