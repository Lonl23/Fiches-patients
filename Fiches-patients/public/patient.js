import { db } from "./firebase.js";
import { requireAuth } from "./auth.js";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
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

const selectedPatientId = sessionStorage.getItem("selectedPatientId");

const patientModeLabel = document.getElementById("patientModeLabel");
const eventContext = document.getElementById("eventContext");
const patientCodeDisplay = document.getElementById("patientCodeDisplay");

const unknownIdentityCheckbox = document.getElementById("unknownIdentityCheckbox");
const sex = document.getElementById("sex");
const triageCurrent = document.getElementById("triageCurrent");
const lastName = document.getElementById("lastName");
const firstName = document.getElementById("firstName");
const birthDate = document.getElementById("birthDate");
const ageDisplay = document.getElementById("ageDisplay");
const nationality = document.getElementById("nationality");
const nationalNumber = document.getElementById("nationalNumber");
const patientAddress = document.getElementById("patientAddress");
const postalCode = document.getElementById("postalCode");
const locality = document.getElementById("locality");
const pmaDisplay = document.getElementById("pmaDisplay");
const triageInitialDisplay = document.getElementById("triageInitialDisplay");

const pathology = document.getElementById("pathology");
const chiefComplaint = document.getElementById("chiefComplaint");
const clinicalNotes = document.getElementById("clinicalNotes");

const savePatientBtn = document.getElementById("savePatientBtn");
const backToEventBtn = document.getElementById("backToEventBtn");

let currentEvent = null;
let existingPatient = null;
let unknownIdentity = false;

function getCurrentPma() {
  return {
    id: sessionStorage.getItem("currentPmaId"),
    name: sessionStorage.getItem("currentPmaName")
  };
}

async function loadEvent(eventId) {
  const snap = await getDoc(doc(db, "events", eventId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

async function loadPatient(patientId) {
  const snap = await getDoc(doc(db, "patients", patientId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

function getTwoDigitYear(dateString) {
  return new Date(dateString).getFullYear().toString().slice(-2);
}

function pad3(num) {
  return String(num).padStart(3, "0");
}

function normalizeProvinceCode(province) {
  const map = {
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
  return map[province] || String(province || "").substring(0, 3).toUpperCase();
}

async function nextPatientSequence(eventId) {
  const q = query(collection(db, "patients"), where("eventId", "==", eventId));
  const snapshot = await getDocs(q);
  return snapshot.size + 1;
}

function extractBirthDateFromBelgianNationalNumber(niss) {
  const digits = String(niss || "").replace(/\D/g, "");
  if (digits.length < 6) return "";

  const yy = parseInt(digits.slice(0, 2), 10);
  const mm = parseInt(digits.slice(2, 4), 10);
  const dd = parseInt(digits.slice(4, 6), 10);

  if (Number.isNaN(yy) || Number.isNaN(mm) || Number.isNaN(dd) || mm < 1 || mm > 12 || dd < 1 || dd > 31) {
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

function updatePostalRules() {
  const age = calculateAge(birthDate.value);
  const optional = unknownIdentity || (age !== "" && age < 18);
  postalCode.required = !optional;
  locality.required = !optional;
}

function tryAutofillBirthDateFromNationalNumber() {
  if (nationality.value !== "BE") return;
  if (unknownIdentity) return;

  const extracted = extractBirthDateFromBelgianNationalNumber(nationalNumber.value);
  if (extracted) {
    birthDate.value = extracted;
    updateAgeField();
    updatePostalRules();
  }
}

function applyUnknownIdentityState() {
  if (unknownIdentity) {
    lastName.value = "Doe";
    firstName.value = "Jane";
    birthDate.value = "1900-01-01";
    nationality.value = "";
    nationalNumber.value = "";
    sex.value = "Indéterminé / inconnu";
  }
  updateAgeField();
  updatePostalRules();
}

function validateBaseData() {
  if (!triageCurrent.value) {
    alert("Le triage courant est obligatoire.");
    return false;
  }

  if (!unknownIdentity) {
    if (!lastName.value.trim() || !firstName.value.trim() || !birthDate.value || !sex.value || !nationality.value) {
      alert("Les champs d'identité obligatoires ne sont pas complets.");
      return false;
    }
  }

  return true;
}

async function buildPatientRecord() {
  const nowIso = new Date().toISOString();
  const currentPma = getCurrentPma();

  if (profile.role === "soignant_pma" && !currentPma.id) {
    alert("Aucun PMA sélectionné.");
    return null;
  }

  const eventCode = currentEvent.eventCode || "001";
  const sequence = existingPatient?.patientSequence || await nextPatientSequence(currentEvent.id);
  const createdAt = existingPatient?.createdAt || nowIso;
  const patientCode = existingPatient?.patientCode || `${getTwoDigitYear(createdAt)}${normalizeProvinceCode(currentEvent.province)}${eventCode}${pad3(sequence)}`;

  const triageInitialValue = existingPatient?.triageInitial || triageCurrent.value;

  return {
    eventId: currentEvent.id,
    pmaId: existingPatient?.pmaId || currentPma.id || "",
    pmaName: existingPatient?.pmaName || currentPma.name || "",
    createdByUid: existingPatient?.createdByUid || authUser.uid,
    createdByEmail: existingPatient?.createdByEmail || authUser.email,
    createdAt,
    timeIn: existingPatient?.timeIn || nowIso,
    timeOut: existingPatient?.timeOut || null,
    patientSequence: sequence,
    patientCode,
    unknownIdentity,
    triageInitial: triageInitialValue,
    triageCurrent: triageCurrent.value,
    triageOut: existingPatient?.triageOut || "",
    destination: existingPatient?.destination || "",
    hospitalTransportMode: existingPatient?.hospitalTransportMode || "",
    hospitalName: existingPatient?.hospitalName || "",
    hospitalVectorName: existingPatient?.hospitalVectorName || "",
    mission112Number: existingPatient?.mission112Number || "",
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
    clinicalNotes: clinicalNotes.value.trim()
  };
}

function fillPatient(patient) {
  unknownIdentity = Boolean(patient.unknownIdentity);
  unknownIdentityCheckbox.checked = unknownIdentity;

  patientCodeDisplay.textContent = patient.patientCode || "En attente";
  sex.value = patient.sex || "";
  triageCurrent.value = patient.triageCurrent || patient.triageInitial || "";
  lastName.value = patient.lastName || "";
  firstName.value = patient.firstName || "";
  birthDate.value = patient.birthDate || "";
  nationality.value = patient.nationality || "";
  nationalNumber.value = patient.nationalNumber || "";
  patientAddress.value = patient.patientAddress || "";
  postalCode.value = patient.postalCode || "";
  locality.value = patient.locality || "";
  pmaDisplay.value = patient.pmaName || "";
  triageInitialDisplay.value = patient.triageInitial || "";

  pathology.value = patient.pathology || "";
  chiefComplaint.value = patient.chiefComplaint || "";
  clinicalNotes.value = patient.clinicalNotes || "";

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

nationality.addEventListener("change", tryAutofillBirthDateFromNationalNumber);
nationalNumber.addEventListener("input", tryAutofillBirthDateFromNationalNumber);

savePatientBtn.addEventListener("click", async () => {
  if (!validateBaseData()) return;

  const record = await buildPatientRecord();
  if (!record) return;

  if (existingPatient?.id) {
    await updateDoc(doc(db, "patients", existingPatient.id), record);
  } else {
    await addDoc(collection(db, "patients"), record);
  }

  sessionStorage.removeItem("selectedPatientId");
  window.location.href = "event.html";
});

backToEventBtn.addEventListener("click", () => {
  sessionStorage.removeItem("selectedPatientId");
  window.location.href = "event.html";
});

async function init() {
  currentEvent = await loadEvent(currentEventId);

  if (!currentEvent) {
    window.location.href = "evenements.html";
    return;
  }

  if (selectedPatientId) {
    existingPatient = await loadPatient(selectedPatientId);
  }

  patientModeLabel.textContent = existingPatient ? "Modification de fiche" : "Nouvelle fiche patient";
  eventContext.textContent = `${currentEvent.description || ""} • ${currentEvent.commune || ""} • ${currentEvent.province || ""}`;

  if (existingPatient) {
    fillPatient(existingPatient);
  } else {
    const currentPma = getCurrentPma();
    pmaDisplay.value = currentPma.name || "Non défini";
    triageInitialDisplay.value = "";
    patientCodeDisplay.textContent = "Attribué à l'enregistrement";
    updateAgeField();
    updatePostalRules();
  }
}

await init();