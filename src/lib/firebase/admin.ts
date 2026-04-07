import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

import { firebaseServerConfig, hasFirebaseServerConfig } from "@/lib/env";

export const getFirebaseAdminApp = () => {
  if (!hasFirebaseServerConfig || !firebaseServerConfig) {
    return null;
  }

  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert({
      projectId: firebaseServerConfig.projectId,
      clientEmail: firebaseServerConfig.clientEmail,
      privateKey: firebaseServerConfig.privateKey,
    }),
  });
};

export const getFirebaseAdminDb = () => {
  const app = getFirebaseAdminApp();
  if (!app) {
    return null;
  }

  return getFirestore(app);
};

export const getFirebaseAdminAuth = () => {
  const app = getFirebaseAdminApp();
  if (!app) {
    return null;
  }

  return getAuth(app);
};

export const getFirebaseAdminMessaging = () => {
  const app = getFirebaseAdminApp();
  if (!app) {
    return null;
  }

  return getMessaging(app);
};
