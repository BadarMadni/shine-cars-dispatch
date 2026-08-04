import { initializeApp, getApps, cert, type App } from "firebase-admin/app";

let app: App | undefined;

if (!getApps().length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (sa) {
    app = initializeApp({ credential: cert(JSON.parse(sa)) });
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT not set — push notifications disabled");
  }
} else {
  app = getApps()[0];
}

export { app };
