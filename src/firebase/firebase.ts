import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const apiKey = import.meta.env.VITE_FB_API_KEY || "demo-key";
const authDomain = import.meta.env?.VITE_FB_AUTH_DOMAIN || "localhost";
const projectId = import.meta.env?.VITE_FB_PROJECT_ID || "demo-test";
const appId = import.meta.env?.VITE_FB_APP_ID || "demo-app-id";
const messagingSenderId =
  import.meta.env?.VITE_FB_MESSAGING_SENDER_ID || "demo";
const storageBucket =
  import.meta.env?.VITE_FB_STORAGE_BUCKET || "demo.appspot.com";

const app = initializeApp({
  apiKey,
  authDomain,
  projectId,
  appId,
  messagingSenderId,
  storageBucket,
});

export const auth = getAuth(app);
export const db = getFirestore(app);

const useEmus =
  (typeof process !== "undefined" &&
    process.env.VITE_FB_USE_EMULATORS === "1") ||
  (typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"));

if (useEmus) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
