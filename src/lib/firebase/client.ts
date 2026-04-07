import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

import { firebaseClientConfig } from "@/lib/env";

let app: FirebaseApp | null = null;

export const getFirebaseClientApp = () => {
  if (!firebaseClientConfig) {
    return null;
  }

  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseClientConfig);
  }

  return app;
};

export const getFirebaseClientAuth = () => {
  const firebaseApp = getFirebaseClientApp();
  if (!firebaseApp) {
    return null;
  }

  return getAuth(firebaseApp);
};

export const getFirebaseClientDb = () => {
  const firebaseApp = getFirebaseClientApp();
  if (!firebaseApp) {
    return null;
  }

  return getFirestore(firebaseApp);
};

export const getFirebaseMessagingSafely = async () => {
  const firebaseApp = getFirebaseClientApp();

  if (!firebaseApp) {
    return null;
  }

  const supported = await isSupported();
  if (!supported) {
    return null;
  }

  return getMessaging(firebaseApp);
};
