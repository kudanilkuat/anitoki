import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let authInstance;

export const getAdminAuth = () => {
  if (!authInstance) {
    if (!getApps().length) {
      if (!process.env.FIREBASE_PRIVATE_KEY) {
        throw new Error('FIREBASE_PRIVATE_KEY is missing in environment variables. You must set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to use Firebase Admin.');
      }
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Handle escaped newlines in private key
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
    authInstance = getAuth();
  }
  return authInstance;
};

