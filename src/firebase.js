import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDwLOtHSWlkh-z5-AD_YD-dag4vmTNmaBo",
  authDomain: "my-note-app-antigravity.firebaseapp.com",
  projectId: "my-note-app-antigravity",
  storageBucket: "my-note-app-antigravity.firebasestorage.app",
  messagingSenderId: "41834089640",
  appId: "1:41834089640:web:0127fce5d4bd1d21eec69d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
