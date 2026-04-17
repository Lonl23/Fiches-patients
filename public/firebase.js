import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCpEnTVX6nSSpAYS7cHu6AYq4Sxxt1LIzw",
  authDomain: "rescuetrack-db14d.firebaseapp.com",
  projectId: "rescuetrack-db14d",
  storageBucket: "rescuetrack-db14d.firebasestorage.app",
  messagingSenderId: "647811482826",
  appId: "1:647811482826:web:02de0b57934e099995e033"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

enableIndexedDbPersistence(db).catch(() => {});

export { auth, db };