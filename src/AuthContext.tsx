import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestore-error';

export interface UserProfile {
  id: string;
  displayName: string;
  photoURL: string;
  totalPoints: number;
  exacts: number;
  closes: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Fetch or create profile
        try {
          const userRef = doc(db, 'users', u.uid);
          const docSnap = await getDoc(userRef);
          
          if (!docSnap.exists()) {
            const newProfile = {
              displayName: u.displayName || 'Unknown Pundit',
              photoURL: u.photoURL || '',
              totalPoints: 0,
              exacts: 0,
              closes: 0
            };
            await setDoc(userRef, newProfile);
            setProfile({ id: u.uid, ...newProfile });
          } else {
            setProfile({ id: u.uid, ...docSnap.data() } as UserProfile);
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, `users/${u.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (code: string) => {
    const cleanCode = code.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (!cleanCode || cleanCode.length < 3) throw new Error("Kode unik minimal 3 karakter huruf/angka.");
    const email = `${cleanCode}@kinggambler.local`;
    const pass = `Kg!${cleanCode}#2026`;
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential' || e.code === 'auth/invalid-login-credentials') {
        await createUserWithEmailAndPassword(auth, email, pass);
      } else {
        throw e;
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
