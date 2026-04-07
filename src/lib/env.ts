const requiredServerEnvs = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
] as const;

const requiredClientEnvs = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  timezone: process.env.NEXT_PUBLIC_APP_TIMEZONE ?? "Asia/Seoul",
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE !== "false",
  adminBypassSecret: process.env.ADMIN_BYPASS_SECRET ?? "",
  firebaseWebPushVapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "",
};

export const hasFirebaseServerConfig =
  requiredServerEnvs.every((key) => !!process.env[key]) &&
  requiredClientEnvs.every((key) => !!process.env[key]);

export const firebaseServerConfig = hasFirebaseServerConfig
  ? {
      projectId: process.env.FIREBASE_PROJECT_ID as string,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY as string).replace(/\\n/g, "\n"),
    }
  : null;

export const firebaseClientConfig = requiredClientEnvs.every((key) => !!process.env[key])
  ? {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    }
  : null;
