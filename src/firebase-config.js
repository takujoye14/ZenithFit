import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider} from "firebase/auth"; 

const firebaseConfig = {
  apiKey: "AIzaSyCpUZpT4GjHkRoghVHU9GgJNBJrpLecf5w",
  authDomain: "zenithfit-8743c.firebaseapp.com",
  projectId: "zenithfit-8743c",
  storageBucket: "zenithfit-8743c.firebasestorage.app",
  messagingSenderId: "210021611856",
  appId: "1:210021611856:web:e7f258ccfc823057a45455",
  measurementId: "G-YZW4EBMNS3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); 
export const googleProvider = new GoogleAuthProvider();