import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, isFirebaseConfigured, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
  isOfflineMock?: boolean;
}

const LOCAL_USER_KEY = 'my_deen_local_user';

export function getLocalUser(): AppUser {
  try {
    const saved = localStorage.getItem(LOCAL_USER_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to read local user:', e);
  }
  const defaultUser: AppUser = {
    uid: 'local_private_user_' + Math.random().toString(36).substring(2, 9),
    email: null,
    displayName: 'মুসাফির (ব্যক্তিগত ড্যাশবোর্ড)',
    isAnonymous: true,
    isOfflineMock: true,
  };
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(defaultUser));
  return defaultUser;
}

/**
 * Subscribes to Firebase Authentication state.
 * Automatically provisions an anonymous session if not signed in,
 * ensuring UID stability and persistence across refreshes.
 */
export function subscribeToAuth(
  callback: (user: AppUser | null, isAuthReady: boolean) => void
): () => void {
  if (isFirebaseConfigured() && auth) {
    let hasResolvedInitial = false;

    const unsub = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        // User is authenticated
        // Try reading their saved display name from Firestore profile if not in Auth object
        let resolvedName = fbUser.displayName;
        if (!resolvedName && db) {
          try {
            const profileRef = doc(db, 'users', fbUser.uid, 'settings', 'profile');
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
              const data = profileSnap.data();
              if (data?.displayName) {
                resolvedName = data.displayName;
              }
            }
          } catch (e) {
            // Non-blocking
          }
        }

        hasResolvedInitial = true;
        callback(
          {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: resolvedName || 'মুসাফির',
            isAnonymous: fbUser.isAnonymous,
            isOfflineMock: false,
          },
          true
        );
      } else {
        // No active user in session yet - auto sign-in anonymously to create persistent private UID
        try {
          if (auth) await signInAnonymously(auth);
          // onAuthStateChanged will fire again with the new anonymous user
        } catch (anonErr) {
          console.warn('Anonymous sign-in could not complete, falling back to local user:', anonErr);
          const localUser = getLocalUser();
          hasResolvedInitial = true;
          callback(localUser, true);
        }
      }
    });

    return () => unsub();
  }

  // If Firebase not configured, use local private user
  const localUser = getLocalUser();
  callback(localUser, true);
  return () => {};
}

/**
 * Updates the user's display name both in Firebase Auth and in their Firestore profile.
 */
export async function updateUserProfileName(uid: string, newDisplayName: string): Promise<void> {
  const cleanName = newDisplayName.trim();
  if (!cleanName) return;

  // 1. Update Firebase Auth if current user matches
  if (isFirebaseConfigured() && auth?.currentUser && auth.currentUser.uid === uid) {
    try {
      await updateProfile(auth.currentUser, { displayName: cleanName });
    } catch (e) {
      console.warn('Could not update Firebase Auth profile displayName:', e);
    }
  }

  // 2. Update Firestore profile doc
  if (isFirebaseConfigured() && db) {
    try {
      const profileRef = doc(db, 'users', uid, 'settings', 'profile');
      await setDoc(
        profileRef,
        {
          displayName: cleanName,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.error('Failed to update Firestore profile document:', e);
      throw e;
    }
  }

  // 3. Update localStorage cache
  try {
    const local = localStorage.getItem(LOCAL_USER_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      parsed.displayName = cleanName;
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(parsed));
    }
  } catch (e) {
    // Ignore
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<AppUser> {
  if (isFirebaseConfigured() && auth) {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    return {
      uid: res.user.uid,
      email: res.user.email,
      displayName: res.user.displayName || 'মুসাফির',
      isAnonymous: res.user.isAnonymous,
    };
  }

  const user: AppUser = {
    uid: 'local_' + btoa(email).substring(0, 12),
    email,
    displayName: email.split('@')[0],
    isAnonymous: false,
    isOfflineMock: true,
  };
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  return user;
}

export async function registerWithEmail(email: string, pass: string, name: string): Promise<AppUser> {
  if (isFirebaseConfigured() && auth) {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (name && res.user) {
      await updateProfile(res.user, { displayName: name });
    }
    // Also save profile to Firestore
    if (db && res.user) {
      try {
        await setDoc(
          doc(db, 'users', res.user.uid, 'settings', 'profile'),
          {
            displayName: name || res.user.email?.split('@')[0] || 'মুসাফির',
            email: res.user.email,
            timezone: 'Asia/Dhaka',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Failed to seed initial user profile in Firestore:', e);
      }
    }

    return {
      uid: res.user.uid,
      email: res.user.email,
      displayName: name || res.user.displayName,
      isAnonymous: res.user.isAnonymous,
    };
  }

  const user: AppUser = {
    uid: 'local_' + btoa(email).substring(0, 12),
    email,
    displayName: name || email.split('@')[0],
    isAnonymous: false,
    isOfflineMock: true,
  };
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  return user;
}

export async function loginAnonymously(): Promise<AppUser> {
  if (isFirebaseConfigured() && auth) {
    const res = await signInAnonymously(auth);
    return {
      uid: res.user.uid,
      email: null,
      displayName: 'মুসাফির (প্রাইভেট ড্যাশবোর্ড)',
      isAnonymous: true,
    };
  }

  return getLocalUser();
}

export async function logoutUser(): Promise<void> {
  if (isFirebaseConfigured() && auth) {
    await firebaseSignOut(auth);
  } else {
    localStorage.removeItem(LOCAL_USER_KEY);
  }
}
