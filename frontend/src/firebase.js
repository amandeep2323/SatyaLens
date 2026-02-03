import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfFTufjUDcNCWIDIqDSLp3DJEnPsQrfR0",
  authDomain: "walker-app-c2e03.firebaseapp.com",
  databaseURL: "https://walker-app-c2e03-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "walker-app-c2e03",
  storageBucket: "walker-app-c2e03.firebasestorage.app",
  messagingSenderId: "124370813702",
  appId: "1:124370813702:web:cf5ceb1c4cce8447e09487",
  measurementId: "G-YF9SKY2ZWE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const analytics = getAnalytics(app);

export { auth, googleProvider };