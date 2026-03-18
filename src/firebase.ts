// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// TODO: Add your own Firebase configuration here
const firebaseConfig = {
  apiKey: "AIzaSyCpsA63em48pIki0BHjx3Tnn6bPHM7ampY",
  authDomain: "mypuppy-4b345.firebaseapp.com",
  projectId: "mypuppy-4b345",
  storageBucket: "mypuppy-4b345.firebasestorage.app",
  messagingSenderId: "862671321381",
  appId: "1:862671321381:web:a135bf37c5ea20ea9702cc",
  measurementId: "G-CJQ6G471HS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth
const auth = getAuth(app);

// Initialize Storage
const storage = getStorage(app);

export { db, auth, storage };

console.log("ENV CHECK:", {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
});
