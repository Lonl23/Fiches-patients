const selectedEventId = localStorage.getItem("selectedEventId");

if (!selectedEventId) {
  window.location.href = "evenements.html";
}

function getEvents() {
  return JSON.parse(localStorage.getItem("events")) || [];
}

function getPatients() {
  return JSON.parse(localStorage.getItem("patients")) || [];
}

function savePatients(data) {
  localStorage.setItem("patients", JSON.stringify(data));
}

const event = getEvents().find(e => e.id === selectedEventId);

document.getElementById("eventTitle").textContent = event.description;
document.getElementById("eventInfo").textContent = `${event.commune} - ${event.province}`;

document.getElementById("backBtn").onclick = () => {
  window.location.href = "evenements.html";
};

function renderPatients() {
  const patients = getPatients().filter(p => p.eventId === selectedEventId);
  const table = document.getElementById("patientsTable");

  table.innerHTML = "";
  document.getElementById("patientsCount").textContent = patients.length;

  patients.forEach(p => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${p.lastName}</td>
      <td>${p.firstName}</td>
      <td>${p.birthDate || "-"}</td>
      <td>${p.city || "-"}</td>
      <td>${p.note || "-"}</td>
      <td><button data-id="${p.id}">X</button></td>
    `;

    table.appendChild(row);
  });
}

document.getElementById("addPatientBtn").onclick = () => {
  const newPatient = {
    id: Date.now(),
    eventId: selectedEventId,
    lastName: document.getElementById("lastName").value,
    firstName: document.getElementById("firstName").value,
    birthDate: document.getElementById("birthDate").value,
    nationalNumber: document.getElementById("nationalNumber").value,
    city: document.getElementById("city").value,
    note: document.getElementById("note").value
  };

  const patients = getPatients();
  patients.push(newPatient);
  savePatients(patients);

  renderPatients();
};

document.getElementById("patientsTable").onclick = (e) => {
  if (e.target.tagName === "BUTTON") {
    let patients = getPatients();
    patients = patients.filter(p => p.id != e.target.dataset.id);
    savePatients(patients);
    renderPatients();
  }
};

/* ===== SIMULATION LECTURE CARTE ===== */
document.getElementById("scanBtn").onclick = () => {
  alert("Lecture eID non disponible en web pur.\nPrévoir module local ou lecteur eID.");
};

renderPatients();