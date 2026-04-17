import { db } from "./firebase.js";
import { logout, requireAuth } from "./auth.js";
import {
  collection,
  getDocs,
  orderBy,
  query
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

const connectedUser = document.getElementById("connectedUser");
const eventsTableBody = document.getElementById("eventsTableBody");
const logoutBtn = document.getElementById("logoutBtn");

const session = await requireAuth();
if (!session) throw new Error("Auth requise");

const { authUser, profile } = session;

connectedUser.textContent = `${profile.firstName || ""} ${profile.lastName || ""} • ${profile.role}`;

logoutBtn.addEventListener("click", async () => {
  await logout();
  window.location.href = "index.html";
});

function formatDate(dateString) {
  if (!dateString) return "-";
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
}

async function loadEvents() {
  const q = query(collection(db, "events"), orderBy("date", "desc"));
  const snapshot = await getDocs(q);

  const allEvents = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));

  if (profile.role === "coordinateur" || profile.role === "responsable_evenement") {
    return allEvents;
  }

  return allEvents.filter((event) => event.status === "Ouvert");
}

function openEvent(eventId) {
  sessionStorage.setItem("currentEventId", eventId);
  sessionStorage.removeItem("currentPmaId");
  sessionStorage.removeItem("currentPmaName");
  window.location.href = "event.html";
}
window.openEvent = openEvent;

async function renderEvents() {
  const events = await loadEvents();
  eventsTableBody.innerHTML = "";

  if (events.length === 0) {
    eventsTableBody.innerHTML = `<tr><td colspan="6" class="empty-row">Aucun événement disponible.</td></tr>`;
    return;
  }

  events.forEach((event) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${event.description || "-"}</td>
      <td>${formatDate(event.date)}</td>
      <td>${event.province || "-"}</td>
      <td>${event.commune || "-"}</td>
      <td>${event.status || "-"}</td>
      <td><button class="table-action-btn" onclick="openEvent('${event.id}')">Ouvrir</button></td>
    `;
    eventsTableBody.appendChild(row);
  });
}

await renderEvents();