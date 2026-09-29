'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  signInWithCustomToken,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, googleProvider, storage } from '@/lib/firebase';
import { trackLogin, trackSignUp } from '@/lib/analytics';
import { isAdminUID } from '@/lib/admin';

import { updatePublicProfile } from '@/lib/profile';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {

        const isAdminByUID = isAdminUID(firebaseUser.uid);

        const baseUser = {
          ...firebaseUser,
          isAdmin:   isAdminByUID,
          isPremium: false,
        };

        try {

          updatePublicProfile(firebaseUser.uid, {
            email:       firebaseUser.email       || '',
            displayName: firebaseUser.displayName || '',
            photoURL:    firebaseUser.photoURL    || '',
          });

          const res = await fetch(`/api/users/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              googleId:    firebaseUser.uid,
              email:       firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL:    firebaseUser.photoURL
            })
          });
          const dbData = await res.json();

          if (dbData.success && dbData.data) {
            setUser({
              ...baseUser,
              isAdmin:   isAdminByUID || !!dbData.data.isAdmin,
              isPremium: !!dbData.data.isPremium,
              stats: {
                totalReadingMinutes: dbData.data.totalReadingMinutes || 0,
              }
            });
          } else {

            setUser(baseUser);
          }
        } catch (error) {
          console.error("Gagal mengambil status premium:", error);

          setUser(baseUser);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    trackLogin('google');
    return result;
  };

  // Email/Password Login
  const loginWithEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    trackLogin('email');
    return result;
  };

  // Email/Password Register
  const registerWithEmail = async (email, password, displayName) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Set display name after creation
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }
    trackSignUp('email');
    return result;
  };

  // Telegram Login
  const loginWithTelegram = async (telegramData) => {
    // Send Telegram data to our API to verify & get a Firebase custom token
    const res = await fetch('/api/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telegramData),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Telegram login failed');
    }
    // Sign in with the custom token from our server
    const result = await signInWithCustomToken(auth, data.token);
    trackLogin('telegram');
    return result;
  };

  const logout = () => signOut(auth);

  const uploadPhoto = async (file) => {
    if (!auth.currentUser) throw new Error('Harus login terlebih dahulu');
    const ext  = file.name.split('.').pop() || 'jpg';
    const path = `avatars/${auth.currentUser.uid}.${ext}`;
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  };

  const refreshUser = async ({ displayName, photoURL } = {}) => {
    if (!auth.currentUser) return;

    await updateProfile(auth.currentUser, {
      displayName: displayName ?? auth.currentUser.displayName,
      photoURL:    photoURL    ?? auth.currentUser.photoURL,
    });

    setUser(prev => ({
      ...prev,
      displayName: displayName ?? prev?.displayName,
      photoURL:    photoURL    ?? prev?.photoURL,
    }));
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, loginWithGoogle, loginWithEmail, registerWithEmail, loginWithTelegram, logout, uploadPhoto, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx || { user: null, loading: false };
}
