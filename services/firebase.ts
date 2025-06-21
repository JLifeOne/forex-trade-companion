
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Define types for Firebase services using compat layer
type FirebaseApp = firebase.app.App;
type Auth = firebase.auth.Auth;
type Firestore = firebase.firestore.Firestore;
// Other services like getStorage or getAnalytics can be imported similarly if needed:
// import 'firebase/compat/storage';
// import 'firebase/compat/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyC60OaHeBga2Af2wG-0ri-HnsZxERgChjg",
  authDomain: "forex-trade-companion.firebaseapp.com",
  projectId: "forex-trade-companion",
  storageBucket: "forex-trade-companion.firebasestorage.app", // Corrected, was .appspot.com
  messagingSenderId: "97819267874",
  appId: "1:97819267874:web:49468b3febabd342df0b7b",
  measurementId: "G-XBWT41QVY8"
};

// Initialize Firebase
const app: FirebaseApp = firebase.initializeApp(firebaseConfig);

// Initialize and export Firebase services using compat layer
export const auth: Auth = firebase.auth();
export const db: Firestore = firebase.firestore();
// export const storage: firebase.storage.Storage = firebase.storage(); // Example for storage
// export const analytics: firebase.analytics.Analytics = firebase.analytics(); // Example for analytics

export default app;