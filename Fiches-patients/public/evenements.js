import { db } from "./firebase.js";
import { logout, requireAuth, canCreateEvent } from "./auth.js";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
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

const session = await requireAuth();
if (!session) throw new Error("Auth requise");

const { authUser, profile } = session;

const selectedProvince = sessionStorage.getItem("selectedProvince");
if (!selectedProvince) {
  window.location.href = "province.html";
}

const connectedUser = document.getElementById("connectedUser");
const eventsTableBody = document.getElementById("eventsTableBody");
const logoutBtn = document.getElementById("logoutBtn");
const changeProvinceBtn = document.getElementById("changeProvinceBtn");
const toggleCreateEventBtn = document.getElementById("toggleCreateEventBtn");
const cancelCreateEventBtn = document.getElementById("cancelCreateEventBtn");
const createEventBlock = document.getElementById("createEventBlock");
const createEventForm = document.getElementById("createEventForm");
const createEventMessage = document.getElementById("createEventMessage");

const eventDescription = document.getElementById("eventDescription");
const eventDate = document.getElementById("eventDate");
const eventCommune = document.getElementById("eventCommune");
const eventProvince = document.getElementById("eventProvince");
const eventStatus = document.getElementById("eventStatus");
const eventCode = document.getElementById("eventCode");

connectedUser.textContent = `${profile.firstName || ""} ${profile.lastName || ""} • ${selectedProvince}`;
eventProvince.value = selectedProvince;

if (canCreateEvent(profile)) {
  toggleCreateEventBtn.classList.remove("hidden");
}

logoutBtn.addEventListener("click", async () => {
  await logout();
  window.location.href = "index.html";
});

changeProvinceBtn.addEventListener("click", () => {
  window.location.href = "province.html";
});

toggleCreateEventBtn.addEventListener("click", () => {
  createEventBlock.classList.remove("hidden");
});

cancelCreateEventBtn.addEventListener("click", () => {
  createEventBlock.classList.add("hidden");
  createEventForm.reset();
  eventProvince.value = selectedProvince;
  createEventMessage.textContent = "";
});

function formatDate(dateString) {
  if (!dateString) return "-";
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
}

function buildNamedUnitArray(prefix, label) {
  const result = [];

  for (let i = 1; i <= 10; i += 1) {
    const input = document.getElementById(`${prefix}${i}`);
    const name = input?.value?.trim();

    if (name) {
      result.push({
        id: `${prefix.toUpperCase()}${i}`,
        name,
        type: label
      });
    }
  }

  return result;
}

function countDisplay(list) {
  return Array.isArray(list) ? list.length : 0;
}

function canSeeEvent(event) {
  if (profile.roles?.includes("coordinateur") || profile.roles?.includes("responsable_evenement")) {
    return true;
  }

  return event.status === "Ouvert";
}

async function loadEvents() {
  const q = query(
    collection(db, "events"),
    where("province", "==", selectedProvince)
  );

  const snapshot = await getDocs(q);

  const events = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));

  events.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return events.filter(canSeeEvent);
}

function openEvent(eventId) {
  sessionStorage.setItem("currentEventId", eventId);
  sessionStorage.removeItem("currentPmaId");
  sessionStorage.removeItem("currentPmaName");
  window.location.href = "event.html";
}
window.openEvent = openEvent;

createEventForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  createEventMessage.textContent = "";

  try {
    const pmas = buildNamedUnitArray("pma", "PMA");
    const cas = buildNamedUnitArray("ca", "CA");

    const payload = {
      description: eventDescription.value.trim(),
      date: eventDate.value,
      commune: eventCommune.value.trim(),
      province: selectedProvince,
      status: eventStatus.value,
      eventCode: eventCode.value.trim(),
      pmas,
      cas,
      createdByUid: authUser.uid,
      createdByEmail: authUser.email,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, "events"), payload);

    createEventMessage.textContent = "Événement créé.";
    createEventForm.reset();
    eventProvince.value = selectedProvince;
    await renderEvents();
  } catch (error) {
    console.error(error);
    createEventMessage.textContent = "Impossible de créer l’événement.";
  }
});

async function renderEvents() {
  const events = await loadEvents();
  eventsTableBody.innerHTML = "";

  if (events.length === 0) {
    eventsTableBody.innerHTML = `<tr><td colspan="8" class="empty-row">Aucun événement disponible.</td></tr>`;
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
      <td>${countDisplay(event.pmas)}</td>
      <td>${countDisplay(event.cas)}</td>
      <td><button class="table-action-btn" onclick="openEvent('${event.id}')">Ouvrir</button></td>
    `;
    eventsTableBody.appendChild(row);
  });
}

await renderEvents();