// firebase.js
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Make sure to import getAuth as well
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCemw32GRAsSWa5OaPlUPLP-9CJuQmzCys",
  authDomain: "edumitra10-51096.firebaseapp.com",
  projectId: "edumitra10-51096",
  storageBucket: "edumitra10-51096.appspot.com",
  messagingSenderId: "292391617601",
  appId: "1:292391617601:web:f326e291d89338598832c0",
  measurementId: "G-8W1RTTEC2R"
};

// This part is correct
let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// --- THIS IS THE FIX ---
// Declare auth variable
let auth;

try {
  // Attempt to get the existing Auth instance
  auth = getAuth(app);
} catch (error) {
  // If it fails, initialize a new instance
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}
// --------------------

const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'asia-northeast1');

export { auth, db, storage, functions };