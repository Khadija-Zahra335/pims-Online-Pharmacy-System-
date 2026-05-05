import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ─── REPLACE WITH YOUR FIREBASE PROJECT CONFIG ───────────────────────────────
// Go to: https://console.firebase.google.com → Your Project → Project Settings → General → Your Apps
const firebaseConfig = {
  apiKey: "AIzaSyD42QTI74FF-z6QNxNdY7A0fsFg0j7vb4w",
  authDomain: "pims-pharmacy.firebaseapp.com",
  projectId: "pims-pharmacy",
  storageBucket: "pims-pharmacy.firebasestorage.app",
  messagingSenderId: "1049395499799",
  appId: "1:1049395499799:web:dfd7bc940a30523032dd52",
  measurementId: "G-0WG5NTWZ9Q"
};
// ─────────────────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
