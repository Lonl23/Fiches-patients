import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function login(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  sessionStorage.removeItem("currentEventId");
  sessionStorage.removeItem("currentPmaId");
  sessionStorage.removeItem("currentPmaName");
  return await signOut(auth);
}

export async function sendReset(email) {
  return await sendPasswordResetEmail(auth, email);
}

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function getCurrentUserProfile(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function requireAuth() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();

      if (!user) {
        window.location.href = "index.html";
        resolve(null);
        return;
      }

      const profile = await getCurrentUserProfile(user.uid);

      if (!profile || profile.isActive === false) {
        alert("Compte non actif ou profil introuvable.");
        await signOut(auth);
        window.location.href = "index.html";
        resolve(null);
        return;
      }

      resolve({
        authUser: user,
        profile
      });
    });
  });
}