import { login, sendReset, watchAuth } from "./auth.js";

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

const loginForm = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const loginMessage = document.getElementById("loginMessage");
const requestAccountBtn = document.getElementById("requestAccountBtn");
const resetPasswordBtn = document.getElementById("resetPasswordBtn");

watchAuth((user) => {
  if (user) {
    window.location.href = "evenements.html";
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginMessage.textContent = "";

  try {
    await login(email.value.trim(), password.value.trim());
    window.location.href = "evenements.html";
  } catch (error) {
    console.error(error);
    loginMessage.textContent = "Identifiants invalides ou accès refusé.";
  }
});

requestAccountBtn.addEventListener("click", () => {
  window.location.href = "request-account.html";
});

resetPasswordBtn.addEventListener("click", async () => {
  const address = email.value.trim();

  if (!address) {
    loginMessage.textContent = "Saisis d'abord ton adresse mail.";
    return;
  }

  try {
    await sendReset(address);
    loginMessage.textContent = "Mail de réinitialisation envoyé.";
  } catch (error) {
    console.error(error);
    loginMessage.textContent = "Impossible d'envoyer le mail de réinitialisation.";
  }
});