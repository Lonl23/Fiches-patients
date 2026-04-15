function updateTime() {
  const now = new Date();
  const timeElement = document.getElementById("time");

  if (timeElement) {
    timeElement.textContent = now.toLocaleTimeString("fr-BE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }
}

setInterval(updateTime, 1000);
updateTime();

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const message = document.getElementById("message");

const users = [
  { email: "user@test.be", password: "1234", role: "user" },
  { email: "dispatch@test.be", password: "1234", role: "dispatch" },
  { email: "admin@test.be", password: "1234", role: "admin" }
];

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  const foundUser = users.find((user) => {
    return user.email === email && user.password === password;
  });

  if (!foundUser) {
    message.textContent = "Identifiant ou mot de passe incorrect.";
    return;
  }

  localStorage.setItem("user", JSON.stringify(foundUser));
  localStorage.removeItem("province");
  localStorage.removeItem("selectedEventId");
  localStorage.removeItem("selectedPatientId");

  window.location.href = "province.html";
});