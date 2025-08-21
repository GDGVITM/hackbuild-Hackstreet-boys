// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFunctions } from 'firebase/functions'; // Added this line

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCemw32GRAsSWa5OaPlUPLP-9CJuQmzCys",
  authDomain: "edumitra10-51096.firebaseapp.com",
  projectId: "edumitra10-51096",
  storageBucket: "edumitra10-51096.appspot.com",
  messagingSenderId: "292391617601",
  appId: "1:292391617601:web:f326e291d89338598832c0",
  measurementId: "G-8W1RTTEC2R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore
export const db = getFirestore(app);

// Storage
export const storage = getStorage(app);

// Functions
export const functions = getFunctions(app); // Added this line