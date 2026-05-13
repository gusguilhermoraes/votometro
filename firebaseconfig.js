import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyB_KbkmNFiW2UfnhlkmTHiKucVr9oitT3k",
  authDomain: "votometro-adad1.firebaseapp.com",
  projectId: "votometro-adad1",
  storageBucket: "votometro-adad1.firebasestorage.app",
  messagingSenderId: "723191179552",
  appId: "1:723191179552:web:d5a1098cf40c79c4e80f45",
  measurementId: "G-WXCJJNTNVM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
isSupported().then(yes => yes ? getAnalytics(app) : null);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app, 'votometrobd');

export { app, auth, db };
