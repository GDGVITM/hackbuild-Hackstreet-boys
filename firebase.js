import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// ✅ Import the necessary functions for auth persistence
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyCemw32GRAsSWa5OaPlUPLP-9CJuQmzCys",
  authDomain: "edumitra10-51096.firebaseapp.com",
  projectId: "edumitra10-51096",
  storageBucket: "edumitra10-51096.firebasestorage.app",
  messagingSenderId: "292391617601",
  appId: "1:292391617601:web:f326e291d89338598832c0",
  measurementId: "G-8W1RTTEC2R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// ✅ Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { auth, db, storage };
