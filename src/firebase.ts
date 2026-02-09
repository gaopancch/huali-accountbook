import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCGpWSDXC12h6Sy40r04Ff542bZn5OfA-0",
  authDomain: "rich-you-d6a14.firebaseapp.com",
  projectId: "rich-you-d6a14",
  storageBucket: "rich-you-d6a14.firebasestorage.app",
  messagingSenderId: "81239523197",
  appId: "1:81239523197:web:06bc696821a31da04e1614",
  measurementId: "G-KKR4FSM1VV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
