import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
const authDomain = (currentHostname.includes('buku.biz.id') || currentHostname.includes('pages.dev'))
  ? currentHostname
  : firebaseConfig.authDomain;

const app = initializeApp({
  ...firebaseConfig,
  authDomain
});

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});
