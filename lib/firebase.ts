import { initializeApp, getApps, cert, type App } from "firebase-admin/app";

let app: App | undefined;

if (!getApps().length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (sa) {
    const json = Buffer.from(sa, "base64").toString();
    const parsed = JSON.parse(json);
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }
    app = initializeApp({ credential: cert(parsed) });
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT not set — push notifications disabled");
  }
} else {
  app = getApps()[0];
}

export { app };
