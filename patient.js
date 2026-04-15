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

function getEvents() {
  return JSON.parse(localStorage.getItem("events")) || [];
}

function saveEvents(events) {
  localStorage.setItem("events", JSON.stringify(events));
}

function getPatients() {
  return JSON.parse(localStorage.getItem("patients")) || [];
}

function savePatients(patients) {
  localStorage.setItem("patients", JSON.stringify(patients));
}

function generateId() {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

const selectedEventId = localStorage.getItem("selectedEventId");
if (!selectedEventId) {
  window.location.href = "evenements.html";
}

const selectedPatientId = localStorage.getItem("selectedPatientId");
const currentEvent = getEvents().find((event) => event.id === selectedEventId);

if (!currentEvent) {
  localStorage.removeItem("selectedEventId");
  window.location.href = "evenements.html";
}

const existingPatient = selectedPatientId
  ? getPatients().find((patient) => patient.id === selectedPatientId && patient.eventId === selectedEventId)
  : null;

const patientModeLabel = document.getElementById("patientModeLabel");
const eventContext = document.getElementById("eventContext");
const patientCodeDisplay = document.getElementById("patientCodeDisplay");

const unknownIdentityCheckbox = document.getElementById("unknownIdentityCheckbox");
const readEidBtn = document.getElementById("readEidBtn");
const demoEidBtn = document.getElementById("demoEidBtn");
const eidStatus = document.getElementById("eidStatus");

const sex = document.getElementById("sex");
const triageIn = document.getElementById("triageIn");
const lastName = document.getElementById("lastName");
const firstName = document.getElementById("firstName");
const birthDate = document.getElementById("birthDate");
const ageDisplay = document.getElementById("ageDisplay");
const nationality = document.getElementById("nationality");
const nationalNumber = document.getElementById("nationalNumber");
const patientAddress = document.getElementById("patientAddress");
const postalCode = document.getElementById("postalCode");
const locality = document.getElementById("locality");

const pathology = document.getElementById("pathology");
const chiefComplaint = document.getElementById("chiefComplaint");

const samplerS = document.getElementById("samplerS");
const samplerA = document.getElementById("samplerA");
const samplerM = document.getElementById("samplerM");
const samplerP = document.getElementById("samplerP");
const samplerL = document.getElementById("samplerL");
const samplerE = document.getElementById("samplerE");
const samplerR = document.getElementById("samplerR");

const opqrstO = document.getElementById("opqrstO");
const opqrstP = document.getElementById("opqrstP");
const opqrstQ = document.getElementById("opqrstQ");
const opqrstR = document.getElementById("opqrstR");
const opqrstS = document.getElementById("opqrstS");
const opqrstT = document.getElementById("opqrstT");

const bodyImage = document.getElementById("bodyImage");
const markersLayer = document.getElementById("markersLayer");

const vitalsTableBody = document.getElementById("vitalsTableBody");
const addVitalsColumnBtn = document.getElementById("addVitalsColumnBtn");

const glasgowAgeGroup = document.getElementById("glasgowAgeGroup");
const glasgowEye = document.getElementById("glasgowEye");
const glasgowVerbal = document.getElementById("glasgowVerbal");
const glasgowMotor = document.getElementById("glasgowMotor");
const glasgowScore = document.getElementById("glasgowScore");

const materialUsed = document.getElementById("materialUsed");
const clinicalNotes = document.getElementById("clinicalNotes");
const savePatientBtn = document.getElementById("savePatientBtn");

let markers = [];
let unknownIdentity = false;
let vitalsColumns = [];

patientModeLabel.textContent = existingPatient ? "Modification de fiche" : "Nouvelle fiche patient";
eventContext.textContent = `${currentEvent.description} • ${currentEvent.commune} • ${currentEvent.province}`;

document.getElementById("backToEventBtn").addEventListener("click", () => {
  localStorage.removeItem("selectedPatientId");
  window.location.href = "event.html";
});

const provinceCodeMap = {
  "Liège": "LIE",
  "Namur": "NAM",
  "Hainaut": "HAI",
  "Luxembourg": "LUX",
  "Bruxelles": "BRU",
  "Brabant wallon": "BWA",
  "Brabant flamand": "BFL",
  "Anvers": "ANV",
  "Limbourg": "LIM",
  "Flandre orientale": "FOR",
  "Flandre occidentale": "FOC"
};

const glasgowOptions = {
  gt5: {
    eye: [
      { value: 4, label: "4 - Spontanée" },
      { value: 3, label: "3 - À la parole" },
      { value: 2, label: "2 - À la douleur" },
      { value: 1, label: "1 - Nulle" }
    ],
    verbal: [
      { value: 5, label: "5 - Orientée" },
      { value: 4, label: "4 - Confuse" },
      { value: 3, label: "3 - Inappropriée" },
      { value: 2, label: "2 - Incompréhensible" },
      { value: 1, label: "1 - Nulle" }
    ],
    motor: [
      { value: 6, label: "6 - Obéit aux ordres" },
      { value: 5, label: "5 - Localisation douleur" },
      { value: 4, label: "4 - Retrait" },
      { value: 3, label: "3 - Flexion" },
      { value: 2, label: "2 - Extension" },
      { value: 1, label: "1 - Nulle" }
    ]
  },
  "2to5": {
    eye: [
      { value: 4, label: "4 - Spontanée" },
      { value: 3, label: "3 - À la parole" },
      { value: 2, label: "2 - À la douleur" },
      { value: 1, label: "1 - Nulle" }
    ],
    verbal: [
      { value: 5, label: "5 - Mots / phrases appropriés" },
      { value: 4, label: "4 - Mots / phrases inappropriés" },
      { value: 3, label: "3 - Cris ou pleurs persistants" },
      { value: 2, label: "2 - Gémissements" },
      { value: 1, label: "1 - Nulle" }
    ],
    motor: [
      { value: 6, label: "6 - Obéit aux ordres" },
      { value: 5, label: "5 - Localisation douleur" },
      { value: 4, label: "4 - Retrait" },
      { value: 3, label: "3 - Flexion" },
      { value: 2, label: "2 - Extension" },
      { value: 1, label: "1 - Nulle" }
    ]
  },
  "1to2": {
    eye: [
      { value: 4, label: "4 - Spontanée" },
      { value: 3, label: "3 - À la parole" },
      { value: 2, label: "2 - À la douleur" },
      { value: 1, label: "1 - Nulle" }
    ],
    verbal: [
      { value: 5, label: "5 - Sourire / interaction" },
      { value: 4, label: "4 - Cris irritables" },
      { value: 3, label: "3 - Cris / pleurs inappropriés" },
      { value: 2, label: "2 - Gémissements / agitation" },
      { value: 1, label: "1 - Nulle" }
    ],
    motor: [
      { value: 6, label: "6 - Mouvements spontanés / dirigés" },
      { value: 5, label: "5 - Localisation douleur" },
      { value: 4, label: "4 - Retrait" },
      { value: 3, label: "3 - Flexion" },
      { value: 2, label: "2 - Extension" },
      { value: 1, label: "1 - Nulle" }
    ]
  },
  lt1: {
    eye: [
      { value: 4, label: "4 - Spontanée" },
      { value: 3, label: "3 - Au cri" },
      { value: 2, label: "2 - À la douleur" },
      { value: 1, label: "1 - Nulle" }
    ],
    verbal: [
      { value: 5, label: "5 - Sourire / interaction" },
      { value: 4, label: "4 - Cris irritables" },
      { value: 3, label: "3 - Cris / pleurs inappropriés" },
      { value: 2, label: "2 - Gémissements / agitation" },
      { value: 1, label: "1 - Nulle" }
    ],
    motor: [
      { value: 6, label: "6 - Mouvements spontanés / dirigés" },
      { value: 5, label: "5 - Localisation douleur" },
      { value: 4, label: "4 - Retrait" },
      { value: 3, label: "3 - Flexion" },
      { value: 2, label: "2 - Extension" },
      { value: 1, label: "1 - Nulle" }
    ]
  }
};

function setEidStatus(message, isError = false) {
  eidStatus.textContent = message;
  eidStatus.style.color = isError ? "#b00020" : "#5d6975";
}

function formatBelgianNationalNumber(rawValue) {
  if (!rawValue) return "";
  return String(rawValue).replace(/\D/g, "");
}

function normalizeSexFromEid(value) {
  const v = String(value || "").trim().toUpperCase();
  if (v === "M" || v === "MALE" || v === "HOMME") return "Homme";
  if (v === "F" || v === "FEMALE" || v === "FEMME") return "Femme";
  return "Indéterminé / inconnu";
}

function normalizeProvinceCode(province) {
  return provinceCodeMap[province] || province.substring(0, 3).toUpperCase();
}

function pad3(num) {
  return String(num).padStart(3, "0");
}

function getOperationalYearForEvent(event) {
  return event.date ? new Date(event.date).getFullYear() : new Date().getFullYear();
}

function ensureEventCode(event) {
  const events = getEvents();
  const operationalYear = getOperationalYearForEvent(event);
  let changed = false;

  const updatedEvents = events.map((item) => {
    if (item.id !== event.id) return item;

    if (!item.eventCode) {
      const sameYearProvinceEvents = events.filter((ev) => {
        return ev.id !== item.id &&
          getOperationalYearForEvent(ev) === operationalYear &&
          ev.province === item.province &&
          ev.eventCode;
      });

      const maxCode = sameYearProvinceEvents.reduce((max, ev) => {
        const value = parseInt(ev.eventCode, 10);
        return Number.isNaN(value) ? max : Math.max(max, value);
      }, 0);

      item.eventCode = pad3(maxCode + 1);
      changed = true;
    }

    return item;
  });

  if (changed) {
    saveEvents(updatedEvents);
  }

  return updatedEvents.find((item) => item.id === event.id) || event;
}

const refreshedEvent = ensureEventCode(currentEvent);

function getTwoDigitYear(dateString) {
  return new Date(dateString).getFullYear().toString().slice(-2);
}

function extractBirthDateFromBelgianNationalNumber(niss) {
  const digits = String(niss || "").replace(/\D/g, "");

  if (digits.length < 6) return "";

  const yy = parseInt(digits.slice(0, 2), 10);
  const mm = parseInt(digits.slice(2, 4), 10);
  const dd = parseInt(digits.slice(4, 6), 10);

  if (
    Number.isNaN(yy) ||
    Number.isNaN(mm) ||
    Number.isNaN(dd) ||
    mm < 1 || mm > 12 ||
    dd < 1 || dd > 31
  ) {
    return "";
  }

  const currentYear = new Date().getFullYear() % 100;
  const fullYear = yy <= currentYear ? 2000 + yy : 1900 + yy;

  return `${fullYear}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

function calculateAge(dateString) {
  if (!dateString) return "";
  if (unknownIdentity && dateString === "1900-01-01") return "";

  const birth = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return Number.isNaN(age) || age < 0 ? "" : age;
}

function updateAgeField() {
  const age = calculateAge(birthDate.value);
  ageDisplay.value = age === "" ? "" : `${age} an(s)`;
}

function isAdminDataOptional() {
  const age = calculateAge(birthDate.value);
  return unknownIdentity || (age !== "" && age < 18);
}

function updatePostalRules() {
  const optional = isAdminDataOptional();
  postalCode.required = !optional;
  locality.required = !optional;
}

function applyUnknownIdentityState() {
  if (unknownIdentity) {
    lastName.value = "Doe";
    firstName.value = "Jane";
    birthDate.value = "1900-01-01";
    nationality.value = "";
    nationalNumber.value = "";
    if (!sex.value) {
      sex.value = "Indéterminé / inconnu";
    }
  }
  updateAgeField();
  updatePostalRules();
}

function tryAutofillBirthDateFromNationalNumber() {
  if (nationality.value !== "BE") return;
  if (unknownIdentity) return;

  const extractedDate = extractBirthDateFromBelgianNationalNumber(nationalNumber.value);
  if (extractedDate) {
    birthDate.value = extractedDate;
    updateAgeField();
    updatePostalRules();
  }
}

function applyEidData(data) {
  unknownIdentity = false;
  unknownIdentityCheckbox.checked = false;

  lastName.value = data.lastName || "";
  firstName.value = data.firstName || "";
  birthDate.value = data.birthDate || "";
  nationalNumber.value = formatBelgianNationalNumber(data.nationalNumber || "");
  nationality.value = data.nationality || "";
  postalCode.value = data.postalCode || "";
  locality.value = data.city || "";
  patientAddress.value = data.street || "";
  sex.value = normalizeSexFromEid(data.sex);

  tryAutofillBirthDateFromNationalNumber();
  updateAgeField();
  updatePostalRules();
}

unknownIdentityCheckbox.addEventListener("change", () => {
  unknownIdentity = unknownIdentityCheckbox.checked;
  applyUnknownIdentityState();
});

birthDate.addEventListener("change", () => {
  updateAgeField();
  updatePostalRules();
});

nationality.addEventListener("change", () => {
  tryAutofillBirthDateFromNationalNumber();
});

nationalNumber.addEventListener("input", () => {
  if (nationality.value === "BE") {
    tryAutofillBirthDateFromNationalNumber();
  }
});

readEidBtn.addEventListener("click", async () => {
  try {
    setEidStatus("Lecture de la carte en cours...");

    const response = await fetch("http://127.0.0.1:8383/read-eid", {
      method: "GET"
    });

    if (!response.ok) {
      throw new Error("Service local eID indisponible.");
    }

    const cardData = await response.json();

    applyEidData({
      lastName: cardData.lastName,
      firstName: cardData.firstName,
      birthDate: cardData.birthDate,
      nationalNumber: cardData.nationalNumber,
      nationality: cardData.nationality,
      postalCode: cardData.postalCode,
      city: cardData.city,
      street: cardData.street,
      sex: cardData.sex
    });

    setEidStatus("Carte d'identité lue avec succès.");
  } catch (error) {
    console.error(error);
    setEidStatus("Impossible de lire la carte. Vérifie le lecteur, le middleware eID et le service local.", true);
  }
});

demoEidBtn.addEventListener("click", () => {
  applyEidData({
    lastName: "Dupont",
    firstName: "Jean",
    birthDate: "1992-04-17",
    nationalNumber: "92041712345",
    nationality: "BE",
    postalCode: "4000",
    city: "Liège",
    street: "Rue de l'Exemple 12",
    sex: "M"
  });

  setEidStatus("Carte d'identité simulée chargée.");
});

function fillSelectOptions(selectElement, options, selectedValue = null) {
  selectElement.innerHTML = "";
  options.forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option.value;
    opt.textContent = option.label;
    if (selectedValue !== null && String(option.value) === String(selectedValue)) {
      opt.selected = true;
    }
    selectElement.appendChild(opt);
  });
}

function refreshGlasgowSelectors(preservedValues = null) {
  const ageGroup = glasgowAgeGroup.value;
  const config = glasgowOptions[ageGroup];

  const eyeValue = preservedValues?.eye ?? config.eye[0].value;
  const verbalValue = preservedValues?.verbal ?? config.verbal[0].value;
  const motorValue = preservedValues?.motor ?? config.motor[0].value;

  fillSelectOptions(glasgowEye, config.eye, eyeValue);
  fillSelectOptions(glasgowVerbal, config.verbal, verbalValue);
  fillSelectOptions(glasgowMotor, config.motor, motorValue);

  updateGlasgowScore();
}

function updateGlasgowScore() {
  const total =
    parseInt(glasgowEye.value, 10) +
    parseInt(glasgowVerbal.value, 10) +
    parseInt(glasgowMotor.value, 10);

  glasgowScore.textContent = total;
}

glasgowAgeGroup.addEventListener("change", () => {
  refreshGlasgowSelectors();
});
glasgowEye.addEventListener("change", updateGlasgowScore);
glasgowVerbal.addEventListener("change", updateGlasgowScore);
glasgowMotor.addEventListener("change", updateGlasgowScore);

function renderMarkers() {
  markersLayer.innerHTML = "";
  markers.forEach((marker, index) => {
    const node = document.createElement("div");
    node.className = "body-marker";
    node.style.left = `${marker.x}%`;
    node.style.top = `${marker.y}%`;
    node.textContent = "✕";
    node.addEventListener("click", (e) => {
      e.stopPropagation();
      markers.splice(index, 1);
      renderMarkers();
    });
    markersLayer.appendChild(node);
  });
}

bodyImage.addEventListener("click", (e) => {
  const rect = bodyImage.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  markers.push({
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2))
  });
  renderMarkers();
});

function getCurrentHHMM() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function createEmptyVitalsColumn() {
  return {
    id: generateId(),
    hour: getCurrentHHMM(),
    ta: "",
    puls: "",
    fr: "",
    spo2: "",
    glycemia: "",
    temperature: ""
  };
}

function renderVitalsTable() {
  const rows = [
    { key: "hour", label: "Heure" },
    { key: "ta", label: "TA" },
    { key: "puls", label: "Puls" },
    { key: "fr", label: "FR" },
    { key: "spo2", label: "SpO2" },
    { key: "glycemia", label: "Glycémie" },
    { key: "temperature", label: "Température" }
  ];

  vitalsTableBody.innerHTML = "";

  rows.forEach((rowDef) => {
    const tr = document.createElement("tr");
    const firstCell = document.createElement("td");
    firstCell.textContent = rowDef.label;
    tr.appendChild(firstCell);

    vitalsColumns.forEach((column, columnIndex) => {
      const td = document.createElement("td");

      if (rowDef.key === "hour") {
        td.innerHTML = `
          <input type="time" value="${column.hour}">
          <button type="button" class="table-action-btn" data-remove-col="${columnIndex}" style="margin-top:6px;">Suppr.</button>
        `;

        const input = td.querySelector("input");
        input.addEventListener("input", () => {
          vitalsColumns[columnIndex].hour = input.value;
        });

        const removeBtn = td.querySelector("button");
        removeBtn.addEventListener("click", () => {
          vitalsColumns.splice(columnIndex, 1);
          renderVitalsTable();
        });
      } else {
        const input = document.createElement("input");
        input.type = "text";
        input.value = column[rowDef.key] || "";
        input.addEventListener("input", () => {
          vitalsColumns[columnIndex][rowDef.key] = input.value;
        });
        td.appendChild(input);
      }

      tr.appendChild(td);
    });

    vitalsTableBody.appendChild(tr);
  });
}

addVitalsColumnBtn.addEventListener("click", () => {
  vitalsColumns.push(createEmptyVitalsColumn());
  renderVitalsTable();
});

function collectLesions() {
  return [...document.querySelectorAll("[data-lesion]:checked")].map((checkbox) => checkbox.dataset.lesion);
}

function applyLesions(lesions) {
  document.querySelectorAll("[data-lesion]").forEach((checkbox) => {
    checkbox.checked = lesions.includes(checkbox.dataset.lesion);
  });
}

function nextPatientSequence(eventId) {
  const patients = getPatients();
  const year = getOperationalYearForEvent(refreshedEvent);

  return patients.filter((patient) => {
    return patient.eventId === eventId &&
      patient.createdAt &&
      new Date(patient.createdAt).getFullYear() === year;
  }).length + 1;
}

function buildPatientCode(event, sequence, createdAt) {
  return `${getTwoDigitYear(createdAt)}${normalizeProvinceCode(event.province)}${event.eventCode || "001"}${pad3(sequence)}`;
}

function validateBaseData() {
  if (!triageIn.value) {
    alert("Le triage IN est obligatoire.");
    return false;
  }

  if (!unknownIdentity) {
    if (!lastName.value.trim()) {
      alert("Le nom est obligatoire.");
      return false;
    }
    if (!firstName.value.trim()) {
      alert("Le prénom est obligatoire.");
      return false;
    }
    if (!birthDate.value) {
      alert("La date de naissance est obligatoire.");
      return false;
    }
    if (!sex.value) {
      alert("Le sexe est obligatoire.");
      return false;
    }
    if (!nationality.value) {
      alert("La nationalité est obligatoire.");
      return false;
    }
  }

  if (!isAdminDataOptional()) {
    if (!postalCode.value.trim()) {
      alert("Le code postal est obligatoire.");
      return false;
    }
    if (!locality.value.trim()) {
      alert("La localité est obligatoire.");
      return false;
    }
  }

  return true;
}

function buildPatientRecord() {
  const nowIso = new Date().toISOString();
  let createdAt = existingPatient?.createdAt || nowIso;
  let sequence = existingPatient?.patientSequence;

  if (!existingPatient) {
    sequence = nextPatientSequence(refreshedEvent.id);
  }

  const patientCode = existingPatient?.patientCode || buildPatientCode(refreshedEvent, sequence, createdAt);

  return {
    id: existingPatient?.id || generateId(),
    eventId: refreshedEvent.id,
    createdAt,
    timeIn: existingPatient?.timeIn || nowIso,
    timeOut: existingPatient?.timeOut || null,
    patientSequence: sequence,
    patientCode,
    unknownIdentity,
    triageIn: existingPatient?.triageIn || triageIn.value,
    triageOut: existingPatient?.triageOut || "",
    destination: existingPatient?.destination || "",
    hospitalTransportMode: existingPatient?.hospitalTransportMode || "",
    hospitalVectorName: existingPatient?.hospitalVectorName || "",
    hospitalName: existingPatient?.hospitalName || "",
    sex: sex.value,
    lastName: lastName.value.trim(),
    firstName: firstName.value.trim(),
    birthDate: birthDate.value,
    nationality: nationality.value,
    nationalNumber: nationalNumber.value.trim(),
    patientAddress: patientAddress.value.trim(),
    postalCode: postalCode.value.trim(),
    locality: locality.value.trim(),
    pathology: pathology.value,
    chiefComplaint: chiefComplaint.value.trim(),
    sampler: {
      S: samplerS.value.trim(),
      A: samplerA.value.trim(),
      M: samplerM.value.trim(),
      P: samplerP.value.trim(),
      L: samplerL.value.trim(),
      E: samplerE.value.trim(),
      R: samplerR.value.trim()
    },
    opqrst: {
      O: opqrstO.value.trim(),
      P: opqrstP.value.trim(),
      Q: opqrstQ.value.trim(),
      R: opqrstR.value.trim(),
      S: opqrstS.value.trim(),
      T: opqrstT.value.trim()
    },
    bodyMarkers: markers,
    lesions: collectLesions(),
    vitals: vitalsColumns,
    glasgow: {
      ageGroup: glasgowAgeGroup.value,
      eye: glasgowEye.value,
      verbal: glasgowVerbal.value,
      motor: glasgowMotor.value,
      total:
        parseInt(glasgowEye.value, 10) +
        parseInt(glasgowVerbal.value, 10) +
        parseInt(glasgowMotor.value, 10)
    },
    materialUsed: materialUsed.value.trim(),
    clinicalNotes: clinicalNotes.value.trim()
  };
}

savePatientBtn.addEventListener("click", () => {
  if (!validateBaseData()) return;

  const record = buildPatientRecord();
  const patients = getPatients();

  const updatedPatients = existingPatient
    ? patients.map((patient) => patient.id === existingPatient.id ? record : patient)
    : [...patients, record];

  savePatients(updatedPatients);
  localStorage.removeItem("selectedPatientId");
  window.location.href = "event.html";
});

function fillExistingPatient(patient) {
  unknownIdentity = Boolean(patient.unknownIdentity);
  unknownIdentityCheckbox.checked = unknownIdentity;

  patientCodeDisplay.textContent = patient.patientCode || "En attente";

  sex.value = patient.sex || "";
  triageIn.value = patient.triageIn || "";
  triageIn.disabled = true;

  lastName.value = patient.lastName || "";
  firstName.value = patient.firstName || "";
  birthDate.value = patient.birthDate || "";
  nationality.value = patient.nationality || "";
  nationalNumber.value = patient.nationalNumber || "";
  patientAddress.value = patient.patientAddress || "";
  postalCode.value = patient.postalCode || "";
  locality.value = patient.locality || "";

  pathology.value = patient.pathology || "";
  chiefComplaint.value = patient.chiefComplaint || "";

  samplerS.value = patient.sampler?.S || "";
  samplerA.value = patient.sampler?.A || "";
  samplerM.value = patient.sampler?.M || "";
  samplerP.value = patient.sampler?.P || "";
  samplerL.value = patient.sampler?.L || "";
  samplerE.value = patient.sampler?.E || "";
  samplerR.value = patient.sampler?.R || "";

  opqrstO.value = patient.opqrst?.O || "";
  opqrstP.value = patient.opqrst?.P || "";
  opqrstQ.value = patient.opqrst?.Q || "";
  opqrstR.value = patient.opqrst?.R || "";
  opqrstS.value = patient.opqrst?.S || "";
  opqrstT.value = patient.opqrst?.T || "";

  markers = patient.bodyMarkers || [];
  renderMarkers();

  applyLesions(patient.lesions || []);

  vitalsColumns = patient.vitals && patient.vitals.length > 0
    ? patient.vitals
    : [createEmptyVitalsColumn()];
  renderVitalsTable();

  glasgowAgeGroup.value = patient.glasgow?.ageGroup || "gt5";
  refreshGlasgowSelectors({
    eye: patient.glasgow?.eye || "4",
    verbal: patient.glasgow?.verbal || "5",
    motor: patient.glasgow?.motor || "6"
  });

  materialUsed.value = patient.materialUsed || "";
  clinicalNotes.value = patient.clinicalNotes || "";

  updateAgeField();
  updatePostalRules();
}

if (existingPatient) {
  fillExistingPatient(existingPatient);
} else {
  patientCodeDisplay.textContent = "Attribué à l'enregistrement";
  vitalsColumns = [createEmptyVitalsColumn()];
  renderVitalsTable();
  refreshGlasgowSelectors();
  updateAgeField();
  updatePostalRules();
}