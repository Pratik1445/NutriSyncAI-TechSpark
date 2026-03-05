import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBcWbK0fRgdULtQd910I_4GGUCNkULqyM8",
  authDomain: "nutrisyncai-f6363.firebaseapp.com",
  projectId: "nutrisyncai-f6363",
  storageBucket: "nutrisyncai-f6363.firebasestorage.app",
  messagingSenderId: "618691045708",
  appId: "1:618691045708:web:df09cb51d3f561979c47e9",
  measurementId: "G-V00MGBQ55L"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
