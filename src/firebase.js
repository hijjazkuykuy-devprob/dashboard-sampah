import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDA9qLcZJ-miwqhe180pt2E9SybeXRDUxI",
  authDomain: "smarttrash-5e85a.firebaseapp.com",
  databaseURL: "https://smarttrash-5e85a-default-rtdb.firebaseio.com",
  projectId: "smarttrash-5e85a",
  storageBucket: "smarttrash-5e85a.firebasestorage.app",
  messagingSenderId: "716460196564",
  appId: "1:716460196564:web:a000a9db9c9588ff44f141",
  measurementId: "G-S7HDRKQC69"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app); 