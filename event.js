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

function getEvents() {
  return JSON.parse(localStorage.getItem("events")) || [];
}

function getPatients() {
  return JSON.parse(localStorage.getItem("patients")) || [];
}

const selectedEventId = localStorage.getItem("selectedEventId");
if (!selectedEventId) {
  window.location.href = "evenements.html";
}

const currentEvent = getEvents().find((event) => event.id === selectedEventId);
if (!currentEvent) {
  localStorage.removeItem("selectedEventId");
  window.location.href = "evenements.html";
}

const eventTitle = document.getElementById("eventTitle");
const eventMeta = document.getElementById("eventMeta");
const eventInfo = document.getElementById("eventInfo");
const patientsTableBody = document.getElementById("patientsTableBody");

eventTitle.textContent = currentEvent.description || "Événement";
eventInfo.textContent = `${currentEvent.commune || "-"} - ${currentEvent.province || "-"}`;
eventMeta.textContent = `${currentEvent.type || "-"} • ${currentEvent.subtype || "-"} • ${formatDate(currentEvent.date)}${currentEvent.status ? ` • ${currentEvent.status}` : ""}`;

document.getElementById("backBtn").addEventListener("click", () => {
  localStorage.removeItem("selectedPatientId");
  window.location.href = "evenements.html";
});

document.getElementById("addPatientBtn").addEventListener("click", () => {
  localStorage.removeItem("selectedPatientId");
  window.location.href = "patient.html";
});

function formatDate(dateString) {
  if (!dateString) return "-";
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
}

function formatDateTime(isoString) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return d.toLocaleTimeString("fr-BE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function computeAgeDisplay(patient) {
  if (!patient.birthDate) return "-";
  if (patient.unknownIdentity && patient.birthDate === "1900-01-01") return "-";

  const birth = new Date(patient.birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (Number.isNaN(age) || age < 0) return "-";
  return age;
}

function getElapsed(patient) {
  if (!patient.timeIn) return "-";

  const start = new Date(patient.timeIn);
  const end = patient.timeOut ? new Date(patient.timeOut) : new Date();

  const diffMs = Math.max(0, end - start);
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function countByTriage(patients, fieldName) {
  const result = {
    U1: 0,
    U2: 0,
    U3H: 0,
    U3NH: 0,
    IMPLIQUE: 0,
    DCD: 0
  };

  patients.forEach((patient) => {
    const triageValue = patient[fieldName];
    if (triageValue && result[triageValue] !== undefined) {
      result[triageValue] += 1;
    }
  });

  return result;
}

function openPatient(patientId) {
  localStorage.setItem("selectedPatientId", patientId);
  window.location.href = "patient.html";
}

window.openPatient = openPatient;

function renderCounters(patients) {
  const inPatients = patients;
  const outPatients = patients.filter((patient) => Boolean(patient.timeOut));

  document.getElementById("countInTotal").textContent = inPatients.length;
  document.getElementById("countOutTotal").textContent = outPatients.length;
  document.getElementById("countStayTotal").textContent = inPatients.length - outPatients.length;

  const inCounts = countByTriage(inPatients, "triageIn");
  const outCounts = countByTriage(outPatients, "triageOut");

  document.getElementById("inU1").textContent = inCounts.U1;
  document.getElementById("inU2").textContent = inCounts.U2;
  document.getElementById("inU3H").textContent = inCounts.U3H;
  document.getElementById("inU3NH").textContent = inCounts.U3NH;
  document.getElementById("inIMPLIQUE").textContent = inCounts.IMPLIQUE;
  document.getElementById("inDCD").textContent = inCounts.DCD;

  document.getElementById("outU1").textContent = outCounts.U1;
  document.getElementById("outU2").textContent = outCounts.U2;
  document.getElementById("outU3H").textContent = outCounts.U3H;
  document.getElementById("outU3NH").textContent = outCounts.U3NH;
  document.getElementById("outIMPLIQUE").textContent = outCounts.IMPLIQUE;
  document.getElementById("outDCD").textContent = outCounts.DCD;
}

function renderPatients() {
  const patients = getPatients().filter((patient) => patient.eventId === selectedEventId);

  renderCounters(patients);
  patientsTableBody.innerHTML = "";

  if (patients.length === 0) {
    patientsTableBody.innerHTML = `
      <tr>
        <td colspan="13" class="empty-row">Aucun patient enregistré pour cet événement</td>
      </tr>
    `;
    return;
  }

  patients.forEach((patient) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${patient.patientCode || "-"}</td>
      <td>${patient.lastName || "-"}</td>
      <td>${patient.firstName || "-"}</td>
      <td>${patient.sex || "-"}</td>
      <td class="triage-${patient.triageIn || ""}">${patient.triageIn || "-"}</td>
      <td class="triage-${patient.triageOut || ""}">${patient.triageOut || "-"}</td>
      <td>${computeAgeDisplay(patient)}</td>
      <td>${patient.destination || "-"}</td>
      <td>${patient.hospitalName || "-"}</td>
      <td>${formatDateTime(patient.timeIn)}</td>
      <td>${formatDateTime(patient.timeOut)}</td>
      <td>${getElapsed(patient)}</td>
      <td>
        <div class="table-action-stack">
          <button class="table-action-btn" onclick="openPatient('${patient.id}')">Ouvrir</button>
        </div>
      </td>
    `;

    patientsTableBody.appendChild(row);
  });
}

renderPatients();
setInterval(renderPatients, 1000);