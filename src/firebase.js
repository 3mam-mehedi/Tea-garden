import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "pos-software-18984.firebaseapp.com",
  projectId: "pos-software-18984",
  storageBucket: "pos-software-18984.firebasestorage.app",
  messagingSenderId: "728187646242",
  appId: "1:728187646242:web:bff9ee50288757624a357b"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;