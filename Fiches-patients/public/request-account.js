import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function updateTime() {
  const now = new Date();
  const el = document.getElementById("time");
  if (el) {
    el.textContent = now.toLocaleTimeString("fr-BE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }
}
setInterval(updateTime, 1000);
updateTime();

const form = document.getElementById("requestAccountForm");
const requestMessage = document.getElementById("requestMessage");
const backToLoginBtn = document.getElementById("backToLoginBtn");

backToLoginBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});

async function sendAdminEmail(payload) {
  // À remplacer par EmailJS réel
  console.log("EMAIL ADMIN -> laurent.noulin.be@gmail.com", payload);
  return true;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  requestMessage.textContent = "";

  const payload = {
    lastName: document.getElementById("reqLastName").value.trim(),
    firstName: document.getElementById("reqFirstName").value.trim(),
    email: document.getElementById("reqEmail").value.trim(),
    sex: document.getElementById("reqSex").value,
    birthDate: document.getElementById("reqBirthDate").value,
    status: "pending",
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "account_requests"), payload);
    await sendAdminEmail(payload);
    requestMessage.textContent = "Demande envoyée avec succès.";
    form.reset();
  } catch (error) {
    console.error(error);
    requestMessage.textContent = "Impossible d'envoyer la demande.";
  }
});