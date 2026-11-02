import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

export const DEFAULT_FIREBASE_CONFIG: FirebaseClientConfig = {
  apiKey: 'AIzaSyA8q9d2yXus8lBsJPVU4B7V8VKKGTG1GN8',
  authDomain: 'personal-good-deeds.firebaseapp.com',
  projectId: 'personal-good-deeds',
  storageBucket: 'personal-good-deeds.firebasestorage.app',
  messagingSenderId: '347282679484',
  appId: '1:347282679484:web:5b11a6502d891483cf12b9',
};

// Check environment variables, saved storage, or default to user configuration
export function getEnvFirebaseConfig(): FirebaseClientConfig {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (apiKey && projectId && apiKey.trim() !== '' && projectId.trim() !== '') {
    return {
      apiKey: apiKey.trim(),
      authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`).trim(),
      projectId: projectId.trim(),
      storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`).trim(),
      messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
      appId: (import.meta.env.VITE_FIREBASE_APP_ID || '').trim(),
    };
  }

  // Check custom saved config in localStorage if user updated via Settings UI
  try {
    const saved = localStorage.getItem('my_deen_firebase_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read saved firebase config', e);
  }

  // Use the verified user configuration
  return DEFAULT_FIREBASE_CONFIG;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function initFirebase(customConfig?: FirebaseClientConfig): {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  isConfigured: boolean;
} {
  const config = customConfig || getEnvFirebaseConfig();

  if (!config || !config.apiKey || !config.projectId) {
    return { app: null, auth: null, db: null, isConfigured: false };
  }

  try {
    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    return { app, auth, db, isConfigured: true };
  } catch (error) {
    console.error('Failed to initialize Firebase SDK:', error);
    return { app: null, auth: null, db: null, isConfigured: false };
  }
}

// Initial setup
const initialSetup = initFirebase();
app = initialSetup.app;
auth = initialSetup.auth;
db = initialSetup.db;

export { app, auth, db };

export function isFirebaseConfigured(): boolean {
  return !!(auth && db);
}
