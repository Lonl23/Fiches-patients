import { db } from "./firebase.js";
import { requireAuth } from "./auth.js";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
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
const currentEventId = sessionStorage.getItem("currentEventId");

if (!currentEventId) {
  window.location.href = "evenements.html";
}

const eventTitle = document.getElementById("eventTitle");
const eventMeta = document.getElementById("eventMeta");
const eventInfo = document.getElementById("eventInfo");
const currentPmaLabel = document.getElementById("currentPmaLabel");
const patientsTableBody = document.getElementById("patientsTableBody");
const logbookList = document.getElementById("logbookList");
const choosePmaBtn = document.getElementById("choosePmaBtn");
const addPatientBtn = document.getElementById("addPatientBtn");
const backBtn = document.getElementById("backBtn");

const pmaModal = document.getElementById("pmaModal");
const pmaChoiceList = document.getElementById("pmaChoiceList");

const exitModal = document.getElementById("exitModal");
const closeExitModalBtn = document.getElementById("closeExitModalBtn");
const exitDestination = document.getElementById("exitDestination");
const exitTriageOut = document.getElementById("exitTriageOut");
const exitHospitalBlock = document.getElementById("exitHospitalBlock");
const exitTransportMode = document.getElementById("exitTransportMode");
const exitHospitalName = document.getElementById("exitHospitalName");
const exitVectorName = document.getElementById("exitVectorName");
const exitMission112Number = document.getElementById("exitMission112Number");
const confirmExitBtn = document.getElementById("confirmExitBtn");

const logbookForm = document.getElementById("logbookForm");
const logbookText = document.getElementById("logbookText");

let currentEvent = null;
let currentExitPatientId = null;

async function loadEvent(eventId) {
  const snap = await getDoc(doc(db, "events", eventId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

async function loadPatients() {
  const q = query(collection(db, "patients"), where("eventId", "==", currentEventId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function loadLogbook() {
  const q = query(
    collection(db, "logbook"),
    where("eventId", "==", currentEventId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const [y, m, d] = dateString.split("-");
  return `${d}-${m}-${y}`;
}

function formatDateTime(isoString) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return d.toLocaleTimeString("fr-BE", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getCurrentPma() {
  return {
    id: sessionStorage.getItem("currentPmaId"),
    name: sessionStorage.getItem("currentPmaName")
  };
}

function getCanChoosePma() {
  return profile.role === "soignant_pma";
}

async function ensurePmaSelection() {
  const pmas = currentEvent.pmas || [];
  if (!getCanChoosePma()) {
    currentPmaLabel.textContent = "Vue globale";
    return;
  }

  if (pmas.length === 0) {
    currentPmaLabel.textContent = "Aucun PMA défini";
    return;
  }

  if (pmas.length === 1) {
    sessionStorage.setItem("currentPmaId", pmas[0].id);
    sessionStorage.setItem("currentPmaName", pmas[0].name);
    currentPmaLabel.textContent = pmas[0].name;
    return;
  }

  const current = getCurrentPma();
  if (!current.id) {
    openPmaModal();
  } else {
    currentPmaLabel.textContent = current.name || "PMA sélectionné";
  }
}

function openPmaModal() {
  const pmas = currentEvent.pmas || [];
  pmaChoiceList.innerHTML = "";

  pmas.forEach((pma) => {
    const btn = document.createElement("button");
    btn.className = "btn-secondary full-width-btn";
    btn.textContent = pma.name;
    btn.addEventListener("click", () => {
      sessionStorage.setItem("currentPmaId", pma.id);
      sessionStorage.setItem("currentPmaName", pma.name);
      currentPmaLabel.textContent = pma.name;
      pmaModal.classList.add("hidden");
      renderPatients();
    });
    pmaChoiceList.appendChild(btn);
  });

  pmaModal.classList.remove("hidden");
}

function getVisiblePatients(allPatients) {
  if (profile.role !== "soignant_pma") return allPatients;

  const currentPma = getCurrentPma();
  return allPatients.filter((patient) => patient.pmaId === currentPma.id);
}

function getEffectiveInTriage(patient) {
  if (patient.timeOut) return patient.triageOut || patient.triageCurrent || patient.triageInitial || "";
  return patient.triageCurrent || patient.triageInitial || "";
}

function countTriages(patients, mode) {
  const counts = { U1: 0, U2: 0, U3H: 0, U3NH: 0, IMPLIQUE: 0, DCD: 0 };

  patients.forEach((patient) => {
    let triage = "";

    if (mode === "in") {
      triage = getEffectiveInTriage(patient);
    } else if (mode === "out") {
      triage = patient.timeOut ? (patient.triageOut || "") : "";
    } else if (mode === "stay") {
      triage = !patient.timeOut ? (patient.triageCurrent || patient.triageInitial || "") : "";
    }

    if (counts[triage] !== undefined) {
      counts[triage] += 1;
    }
  });

  return counts;
}

function applyCounter(prefix, counts) {
  document.getElementById(`${prefix}U1`).textContent = counts.U1;
  document.getElementById(`${prefix}U2`).textContent = counts.U2;
  document.getElementById(`${prefix}U3H`).textContent = counts.U3H;
  document.getElementById(`${prefix}U3NH`).textContent = counts.U3NH;
  document.getElementById(`${prefix}IMPLIQUE`).textContent = counts.IMPLIQUE;
  document.getElementById(`${prefix}DCD`).textContent = counts.DCD;
}

function getSexDisplay(sex) {
  if (sex === "Homme") return "♂";
  if (sex === "Femme") return "♀";
  return "I";
}

function openPatient(patientId) {
  sessionStorage.setItem("selectedPatientId", patientId);
  window.location.href = "patient.html";
}
window.openPatient = openPatient;

function openExitModal(patientId) {
  currentExitPatientId = patientId;
  exitDestination.value = "";
  exitTriageOut.value = "";
  exitTransportMode.value = "";
  exitHospitalName.value = "";
  exitVectorName.value = "";
  exitMission112Number.value = "";
  exitHospitalBlock.classList.add("hidden");
  exitModal.classList.remove("hidden");
}
window.openExitModal = openExitModal;

function closeExitModal() {
  currentExitPatientId = null;
  exitModal.classList.add("hidden");
}

closeExitModalBtn.addEventListener("click", closeExitModal);

exitDestination.addEventListener("change", () => {
  exitHospitalBlock.classList.toggle("hidden", exitDestination.value !== "Hopital");
});

confirmExitBtn.addEventListener("click", async () => {
  if (!currentExitPatientId) return;

  if (!exitDestination.value) {
    alert("La destination est obligatoire.");
    return;
  }

  if (!exitTriageOut.value) {
    alert("Le triage OUT est obligatoire.");
    return;
  }

  if (exitDestination.value === "Hopital") {
    if (!exitTransportMode.value) {
      alert("Le mode de transport est obligatoire.");
      return;
    }

    if (!exitHospitalName.value.trim()) {
      alert("L'hôpital est obligatoire.");
      return;
    }

    if (
      (exitTransportMode.value === "VSL" ||
        exitTransportMode.value === "Ambulance 112" ||
        exitTransportMode.value === "Ambulance ATNUP") &&
      !exitVectorName.value.trim()
    ) {
      alert("Le nom du vecteur est obligatoire.");
      return;
    }

    if (
      exitTransportMode.value === "Ambulance 112" &&
      !exitMission112Number.value.trim()
    ) {
      alert("Le numéro de mission 112 est obligatoire.");
      return;
    }
  }

  await updateDoc(doc(db, "patients", currentExitPatientId), {
    destination: exitDestination.value,
    triageOut: exitTriageOut.value,
    hospitalTransportMode: exitDestination.value === "Hopital" ? exitTransportMode.value : "",
    hospitalName: exitDestination.value === "Hopital" ? exitHospitalName.value.trim() : "",
    hospitalVectorName: exitDestination.value === "Hopital" ? exitVectorName.value.trim() : "",
    mission112Number: exitTransportMode.value === "Ambulance 112" ? exitMission112Number.value.trim() : "",
    triageCurrent: exitTriageOut.value,
    timeOut: new Date().toISOString()
  });

  closeExitModal();
  await renderPatients();
});

backBtn.addEventListener("click", () => {
  sessionStorage.removeItem("currentEventId");
  sessionStorage.removeItem("currentPmaId");
  sessionStorage.removeItem("currentPmaName");
  window.location.href = "evenements.html";
});

choosePmaBtn.addEventListener("click", openPmaModal);

addPatientBtn.addEventListener("click", () => {
  sessionStorage.removeItem("selectedPatientId");
  window.location.href = "patient.html";
});

logbookForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = logbookText.value.trim();
  if (!text) return;

  const currentPma = getCurrentPma();

  await addDoc(collection(db, "logbook"), {
    eventId: currentEventId,
    pmaId: currentPma.id || "",
    pmaName: currentPma.name || "",
    text,
    createdByUid: authUser.uid,
    createdByEmail: authUser.email,
    createdAt: serverTimestamp()
  });

  logbookText.value = "";
  await renderLogbook();
});

async function renderPatients() {
  const allPatients = await loadPatients();
  const visiblePatients = getVisiblePatients(allPatients);

  const countsIn = countTriages(visiblePatients, "in");
  const countsOut = countTriages(visiblePatients, "out");
  const countsStay = countTriages(visiblePatients, "stay");

  applyCounter("in", countsIn);
  applyCounter("out", countsOut);
  applyCounter("stay", countsStay);

  patientsTableBody.innerHTML = "";

  if (visiblePatients.length === 0) {
    patientsTableBody.innerHTML = `<tr><td colspan="11" class="empty-row">Aucun patient.</td></tr>`;
    return;
  }

  visiblePatients.forEach((patient) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${patient.patientCode || "-"}</td>
      <td>${patient.lastName || "-"}</td>
      <td>${patient.firstName || "-"}</td>
      <td>${getSexDisplay(patient.sex)}</td>
      <td>${patient.triageCurrent || patient.triageInitial || "-"}</td>
      <td>${patient.triageOut || "-"}</td>
      <td>${patient.destination || "-"}</td>
      <td>${patient.pmaName || "-"}</td>
      <td>${formatDateTime(patient.timeIn)}</td>
      <td>${formatDateTime(patient.timeOut)}</td>
      <td>
        <div class="button-col">
          <button class="table-action-btn" onclick="openPatient('${patient.id}')">Ouvrir</button>
          ${patient.timeOut ? "" : `<button class="table-action-btn" onclick="openExitModal('${patient.id}')">Sortie</button>`}
        </div>
      </td>
    `;
    patientsTableBody.appendChild(row);
  });
}

async function renderLogbook() {
  const entries = await loadLogbook();
  const currentPma = getCurrentPma();

  let visibleEntries = entries;

  if (profile.role === "soignant_pma" && currentPma.id) {
    visibleEntries = entries.filter((entry) => entry.pmaId === currentPma.id || !entry.pmaId);
  }

  logbookList.innerHTML = "";

  if (visibleEntries.length === 0) {
    logbookList.innerHTML = `<div class="page-subtitle">Aucune entrée logbook.</div>`;
    return;
  }

  visibleEntries.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "logbook-item";
    item.innerHTML = `
      <strong>${entry.pmaName || "Global"}</strong>
      <div>${entry.text}</div>
      <small>${entry.createdByEmail || ""}</small>
    `;
    logbookList.appendChild(item);
  });
}

async function init() {
  currentEvent = await loadEvent(currentEventId);

  if (!currentEvent) {
    window.location.href = "evenements.html";
    return;
  }

  eventTitle.textContent = currentEvent.description || "Événement";
  eventInfo.textContent = `${currentEvent.commune || "-"} • ${currentEvent.province || "-"}`;
  eventMeta.textContent = `${formatDate(currentEvent.date)} • ${currentEvent.status || "-"}`;

  if (profile.role === "soignant_pma" && (currentEvent.pmas || []).length > 1) {
    choosePmaBtn.classList.remove("hidden");
  }

  await ensurePmaSelection();
  await renderPatients();
  await renderLogbook();
}

await init();