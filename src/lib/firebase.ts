import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZHDFW2udS7c66JY37b3mTAxic00Ub3O4",
  authDomain: "beauty-1f4f7.firebaseapp.com",
  projectId: "beauty-1f4f7",
  storageBucket: "beauty-1f4f7.firebasestorage.app",
  messagingSenderId: "698688828527",
  appId: "1:698688828527:web:eacaa571a04f68f12b099a"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
