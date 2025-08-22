// firebase.js
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions'; // Ensure this is imported
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCemw32GRAsSWa5OaPlUPLP-9CJuQmzCys",
  authDomain: "edumitra10-51096.firebaseapp.com",
  projectId: "edumitra10-51096",
  storageBucket: "edumitra10-51096.appspot.com",
  messagingSenderId: "292391617601",
  appId: "1:292391617601:web:f326e291d89338598832c0",
  measurementId: "G-8W1RTTEC2R"
};

// This pattern ensures Firebase is only initialized once.
let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app); // Initialize and export functions

export { auth, db, storage, functions };