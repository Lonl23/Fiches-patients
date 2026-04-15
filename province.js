function updateTime() {
  const now = new Date();
  const timeElement = document.getElementById("time");
  if (timeElement) {
    timeElement.innerText = now.toLocaleTimeString("fr-BE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }
}

setInterval(updateTime, 1000);
updateTime();

const savedUser = localStorage.getItem("user");
const connectedUser = document.getElementById("connectedUser");

if (!savedUser) {
  window.location.href = "index.html";
} else {
  const user = JSON.parse(savedUser);
  connectedUser.textContent = `Connecté : ${user.email} (${user.role})`;
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("user");
  localStorage.removeItem("province");
  localStorage.removeItem("selectedEventId");
  localStorage.removeItem("selectedPatientId");
  window.location.href = "index.html";
});

const provinceNameMap = {
  "West Flanders": "Flandre occidentale",
  "East Flanders": "Flandre orientale",
  "Antwerp": "Anvers",
  "Limburg": "Limbourg",
  "Flemish Brabant": "Brabant flamand",
  "Brussels": "Bruxelles",
  "Walloon Brabant": "Brabant wallon",
  "Hainaut": "Hainaut",
  "Namur": "Namur",
  "Liege": "Liège",
  "Luxembourg": "Luxembourg"
};

const belgiumMapObject = document.getElementById("belgiumMapObject");

belgiumMapObject.addEventListener("load", () => {
  const svgDoc = belgiumMapObject.contentDocument;
  if (!svgDoc) return;

  const paths = svgDoc.querySelectorAll("#features path");

  paths.forEach((path) => {
    const rawName = path.getAttribute("name");
    const frenchName = provinceNameMap[rawName] || rawName;

    path.style.fill = "#dfe8f4";
    path.style.stroke = "#6d7e91";
    path.style.strokeWidth = "1.5";
    path.style.cursor = "pointer";
    path.style.transition = "fill 0.2s ease, stroke 0.2s ease";

    path.addEventListener("mouseenter", () => {
      path.style.fill = "#8fb7e5";
      path.style.stroke = "#2f79bd";
    });

    path.addEventListener("mouseleave", () => {
      path.style.fill = "#dfe8f4";
      path.style.stroke = "#6d7e91";
    });

    path.addEventListener("click", () => {
      localStorage.setItem("province", frenchName);
      localStorage.removeItem("selectedEventId");
      localStorage.removeItem("selectedPatientId");
      window.location.href = "evenements.html";
    });
  });
});