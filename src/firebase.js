import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase config is kept in Vite env vars (create a .env file in project root).
// Required:
// VITE_FIREBASE_API_KEY=...
// VITE_FIREBASE_AUTH_DOMAIN=...
// VITE_FIREBASE_PROJECT_ID=...
// VITE_FIREBASE_APP_ID=...
// Optional:
// VITE_FIREBASE_STORAGE_BUCKET=...
// VITE_FIREBASE_MESSAGING_SENDER_ID=...
const firebaseConfig = {
  apiKey: String(import.meta.env.VITE_FIREBASE_API_KEY || "").trim(),
  authDomain: String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "").trim(),
  projectId: String(import.meta.env.VITE_FIREBASE_PROJECT_ID || "").trim(),
  storageBucket: String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "").trim(),
  messagingSenderId: String(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "").trim(),
  appId: String(import.meta.env.VITE_FIREBASE_APP_ID || "").trim(),
};

const missing = ["apiKey", "authDomain", "projectId", "appId"].filter(
  (k) => !firebaseConfig[k]
);

if (missing.length) {
  // This is the most common cause of "error at getAuth(app)" for beginners.
  throw new Error(
    `Firebase env missing: ${missing.join(
      ", "
    )}. Create a .env file in the project root (same folder as package.json) and restart the dev server.`
  );
}

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
