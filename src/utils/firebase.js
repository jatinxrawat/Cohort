import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAIhE-0LYEJFHHPDiCzjXkt9Etj5il2Cbo",
  authDomain: "collex-73ee4.firebaseapp.com",
  projectId: "collex-73ee4",
  storageBucket: "collex-73ee4.firebasestorage.app",
  messagingSenderId: "221975281814",
  appId: "1:221975281814:web:7332c022bc6a6bc9e342b7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
