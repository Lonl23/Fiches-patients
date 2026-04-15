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
const selectedProvince = localStorage.getItem("province");

if (!savedUser) {
  window.location.href = "index.html";
}

if (!selectedProvince) {
  window.location.href = "province.html";
}

const user = JSON.parse(savedUser);

const connectedUser = document.getElementById("connectedUser");
const eventsTitle = document.getElementById("eventsTitle");
const eventsSubtitle = document.getElementById("eventsSubtitle");
const eventProvince = document.getElementById("eventProvince");
const logoutBtn = document.getElementById("logoutBtn");
const backToProvinceBtn = document.getElementById("backToProvinceBtn");
const openCreateModalBtn = document.getElementById("openCreateModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const createEventModal = document.getElementById("createEventModal");
const createEventForm = document.getElementById("createEventForm");
const eventTypeSelect = document.getElementById("eventType");
const eventSubtypeSelect = document.getElementById("eventSubtype");
const eventsTableBody = document.getElementById("eventsTableBody");
const eventsCount = document.getElementById("eventsCount");
const dispatchCountersPanel = document.getElementById("dispatchCountersPanel");
const dispatchCountersGrid = document.getElementById("dispatchCountersGrid");

connectedUser.textContent = `Connecté : ${user.email} (${user.role})`;
eventsTitle.textContent = `Liste des événements - ${selectedProvince}`;
eventsSubtitle.textContent = `Province sélectionnée : ${selectedProvince}`;
eventProvince.value = selectedProvince;

const pimKtaSubtypes = [
  "Exercice",
  "INCENDIE",
  "EXPLOSION",
  "ROULAGE",
  "FUITE",
  "TRAIN",
  "AVION",
  "BUS",
  "PIPS",
  "SANITAIRE",
  "MAINTIENORDRE",
  "AUTRE"
];

const dmpSubtypes = [
  "Folklore",
  "Concert",
  "Festival",
  "Cortège, marche, défilé socioculturel",
  "Grand rassemblement de personnes",
  "Cortège, marche, défilé sociopolitique",
  "Sport de ballon",
  "Cyclisme",
  "Sport moteur",
  "Sport de combat",
  "Autre sport",
  "Aéronautique",
  "Déménagement"
];

function generateId() {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function getStoredEvents() {
  return JSON.parse(localStorage.getItem("events")) || [];
}

function saveStoredEvents(events) {
  localStorage.setItem("events", JSON.stringify(events));
}

function getStoredPatients() {
  return JSON.parse(localStorage.getItem("patients")) || [];
}

function getOperationalYear(dateString) {
  return dateString ? new Date(dateString).getFullYear() : new Date().getFullYear();
}

function pad3(number) {
  return String(number).padStart(3, "0");
}

function assignEventCode(province, date, existingEvents) {
  const operationalYear = getOperationalYear(date);

  const sameYearProvinceEvents = existingEvents.filter((event) => {
    return (
      getOperationalYear(event.date) === operationalYear &&
      event.province === province &&
      event.eventCode
    );
  });

  const maxCode = sameYearProvinceEvents.reduce((max, event) => {
    const numericCode = parseInt(event.eventCode, 10);
    return Number.isNaN(numericCode) ? max : Math.max(max, numericCode);
  }, 0);

  return pad3(maxCode + 1);
}

function ensureCodesOnExistingEvents() {
  let events = getStoredEvents();
  let changed = false;

  events = events.map((event, index, allEvents) => {
    if (!event.eventCode) {
      const previousEvents = allEvents.slice(0, index).filter((item) => item.eventCode);
      event.eventCode = assignEventCode(event.province, event.date, previousEvents);
      changed = true;
    }
    return event;
  });

  if (changed) {
    saveStoredEvents(events);
  }
}

function createSeedDataIfNeeded() {
  const existingEvents = getStoredEvents();
  if (existingEvents.length > 0) return;

  const seedEvents = [];

  const event1 = {
    id: generateId(),
    province: "Liège",
    commune: "Liège",
    street: "Parc d'Avroy",
    type: "DMP",
    subtype: "Festival",
    description: "Festival d'été Liège Centre",
    date: "2026-07-12",
    endDate: "2026-07-13",
    carePosts: 2,
    mobileTeams: 3,
    status: "Ouvert",
    eventCode: "001"
  };

  const event2 = {
    id: generateId(),
    province: "Liège",
    commune: "Spa",
    street: "Circuit",
    type: "DMP",
    subtype: "Sport moteur",
    description: "Meeting sport moteur",
    date: "2026-08-03",
    endDate: "2026-08-03",
    carePosts: 1,
    mobileTeams: 2,
    status: "Ouvert",
    eventCode: "002"
  };

  const event3 = {
    id: generateId(),
    province: "Namur",
    commune: "Namur",
    street: "Centre-ville",
    type: "PIM/KTA",
    subtype: "ROULAGE",
    description: "Exercice routier provincial",
    date: "2026-06-21",
    endDate: "2026-06-21",
    carePosts: 1,
    mobileTeams: 1,
    status: "Clôturé",
    eventCode: "001"
  };

  seedEvents.push(event1, event2, event3);
  saveStoredEvents(seedEvents);

  const seedPatients = [
    {
      id: generateId(),
      eventId: event1.id,
      createdAt: new Date().toISOString(),
      timeIn: new Date().toISOString(),
      timeOut: null,
      patientCode: "26LIE001001",
      patientSequence: 1,
      triageIn: "U3NH",
      triageOut: "",
      lastName: "Dupont",
      firstName: "Marc",
      sex: "Homme",
      birthDate: "1994-03-08",
      destination: ""
    },
    {
      id: generateId(),
      eventId: event1.id,
      createdAt: new Date().toISOString(),
      timeIn: new Date().toISOString(),
      timeOut: null,
      patientCode: "26LIE001002",
      patientSequence: 2,
      triageIn: "U2",
      triageOut: "",
      lastName: "Hubert",
      firstName: "Claire",
      sex: "Femme",
      birthDate: "1988-11-12",
      destination: ""
    },
    {
      id: generateId(),
      eventId: event2.id,
      createdAt: new Date().toISOString(),
      timeIn: new Date().toISOString(),
      timeOut: null,
      patientCode: "26LIE002001",
      patientSequence: 1,
      triageIn: "U3H",
      triageOut: "",
      lastName: "Lejeune",
      firstName: "Paul",
      sex: "Homme",
      birthDate: "2001-01-20",
      destination: ""
    }
  ];

  localStorage.setItem("patients", JSON.stringify(seedPatients));
}

createSeedDataIfNeeded();
ensureCodesOnExistingEvents();

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("user");
  localStorage.removeItem("province");
  localStorage.removeItem("selectedEventId");
  localStorage.removeItem("selectedPatientId");
  window.location.href = "index.html";
});

backToProvinceBtn.addEventListener("click", () => {
  localStorage.removeItem("selectedEventId");
  localStorage.removeItem("selectedPatientId");
  window.location.href = "province.html";
});

openCreateModalBtn.addEventListener("click", () => {
  createEventModal.classList.remove("hidden");
});

closeModalBtn.addEventListener("click", () => {
  createEventModal.classList.add("hidden");
});

window.addEventListener("click", (event) => {
  if (event.target === createEventModal) {
    createEventModal.classList.add("hidden");
  }
});

eventTypeSelect.addEventListener("change", () => {
  eventSubtypeSelect.innerHTML = `<option value="">Choisir un sous-type...</option>`;

  let subtypes = [];

  if (eventTypeSelect.value === "PIM/KTA") {
    subtypes = pimKtaSubtypes;
  } else if (eventTypeSelect.value === "DMP") {
    subtypes = dmpSubtypes;
  }

  subtypes.forEach((item) => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    eventSubtypeSelect.appendChild(option);
  });
});

createEventForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const events = getStoredEvents();
  const eventDate = document.getElementById("eventDate").value;
  const eventCode = assignEventCode(selectedProvince, eventDate, events);

  const newEvent = {
    id: generateId(),
    province: selectedProvince,
    commune: document.getElementById("eventCommune").value.trim(),
    street: document.getElementById("eventStreet").value.trim(),
    type: document.getElementById("eventType").value,
    subtype: document.getElementById("eventSubtype").value,
    description: document.getElementById("eventDescription").value.trim(),
    date: eventDate,
    endDate: document.getElementById("eventEndDate").value,
    carePosts: parseInt(document.getElementById("eventCarePosts").value, 10),
    mobileTeams: parseInt(document.getElementById("eventMobileTeams").value, 10),
    status: "Ouvert",
    eventCode
  };

  events.push(newEvent);
  saveStoredEvents(events);

  createEventForm.reset();
  eventProvince.value = selectedProvince;
  eventSubtypeSelect.innerHTML = `<option value="">Choisir un sous-type...</option>`;
  createEventModal.classList.add("hidden");

  renderEvents();
});

function getPatientCountForEvent(eventId) {
  return getStoredPatients().filter((patient) => patient.eventId === eventId).length;
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
}

function renderDispatchCounters(events) {
  if (user.role !== "dispatch" && user.role !== "admin") {
    dispatchCountersPanel.classList.add("hidden");
    return;
  }

  dispatchCountersPanel.classList.remove("hidden");
  dispatchCountersGrid.innerHTML = "";

  const provinceEvents = events.filter((event) => event.province === selectedProvince);

  if (provinceEvents.length === 0) {
    dispatchCountersGrid.innerHTML = `<div class="dispatch-empty">Aucun compteur à afficher pour cette province.</div>`;
    return;
  }

  provinceEvents.forEach((event) => {
    const patientCount = getPatientCountForEvent(event.id);

    const card = document.createElement("div");
    card.className = "dispatch-counter-card";
    card.innerHTML = `
      <div class="dispatch-counter-title">${event.description}</div>
      <div class="dispatch-counter-meta">${event.commune} • ${formatDate(event.date)} • EVT ${event.eventCode || "-"}</div>
      <div class="dispatch-counter-number">${patientCount}</div>
    `;

    dispatchCountersGrid.appendChild(card);
  });
}

function renderEvents() {
  const events = getStoredEvents();
  const filteredEvents = events.filter((event) => event.province === selectedProvince);

  eventsTableBody.innerHTML = "";
  eventsCount.textContent = filteredEvents.length;

  if (filteredEvents.length === 0) {
    eventsTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-row">Aucun événement pour cette province</td>
      </tr>
    `;
  } else {
    filteredEvents.forEach((event) => {
      const patientCount = getPatientCountForEvent(event.id);

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${event.description}</td>
        <td>${event.type}</td>
        <td>${event.subtype}</td>
        <td>${event.commune}</td>
        <td>${formatDate(event.date)}</td>
        <td>${patientCount}</td>
        <td>
          <span class="status-badge ${event.status === "Ouvert" ? "status-open" : "status-closed"}">
            ${event.status}
          </span>
        </td>
        <td>
          <button class="table-action-btn open-event-btn" data-event-id="${event.id}">Ouvrir</button>
        </td>
      `;
      eventsTableBody.appendChild(row);
    });
  }

  renderDispatchCounters(events);
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("open-event-btn")) {
    const eventId = e.target.dataset.eventId;

    localStorage.setItem("selectedEventId", eventId);
    localStorage.removeItem("selectedPatientId");
    window.location.href = "event.html";
  }
});

renderEvents();