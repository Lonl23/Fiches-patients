import { db } from "./firebase.js";
import { requireAuth, isCoordinator } from "./auth.js";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
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

const { profile } = session;

if (!isCoordinator(profile)) {
  alert("Accès réservé au coordinateur.");
  window.location.href = "province.html";
}

const backBtn = document.getElementById("backBtn");
const requestsTableBody = document.getElementById("requestsTableBody");
const usersTableBody = document.getElementById("usersTableBody");
const userForm = document.getElementById("userForm");
const resetUserFormBtn = document.getElementById("resetUserFormBtn");
const adminMessage = document.getElementById("adminMessage");

const editingUserId = document.getElementById("editingUserId");
const userEmail = document.getElementById("userEmail");
const userFirstName = document.getElementById("userFirstName");
const userLastName = document.getElementById("userLastName");
const userSex = document.getElementById("userSex");
const userBirthDate = document.getElementById("userBirthDate");
const userAllowedProvinces = document.getElementById("userAllowedProvinces");
const userPassword = document.getElementById("userPassword");
const userNumeroInami = document.getElementById("userNumeroInami");
const userNumeroVisa = document.getElementById("userNumeroVisa");
const userIsActive = document.getElementById("userIsActive");

backBtn.addEventListener("click", () => {
  window.location.href = "province.html";
});

function splitCsv(value) {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function getCheckedValues(selector) {
  return [...document.querySelectorAll(selector)]
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);
}

function setCheckedValues(selector, values) {
  document.querySelectorAll(selector).forEach((checkbox) => {
    checkbox.checked = values.includes(checkbox.value);
  });
}

function resetForm() {
  editingUserId.value = "";
  userForm.reset();
  userIsActive.value = "true";
  setCheckedValues(".role-checkbox", []);
  setCheckedValues(".qualification-checkbox", []);
}

resetUserFormBtn.addEventListener("click", resetForm);

function validateRoleSpecificFields(roles) {
  if (roles.includes("medecin") && !userNumeroInami.value.trim()) {
    adminMessage.textContent = "Le numéro INAMI est obligatoire pour un médecin.";
    return false;
  }

  if (roles.includes("infirmier") && !userNumeroVisa.value.trim()) {
    adminMessage.textContent = "Le numéro de visa est obligatoire pour un infirmier.";
    return false;
  }

  if (roles.length === 0) {
    adminMessage.textContent = "Au moins un rôle doit être sélectionné.";
    return false;
  }

  return true;
}

function buildUserPayload() {
  const roles = getCheckedValues(".role-checkbox");
  const qualifications = getCheckedValues(".qualification-checkbox");

  return {
    email: userEmail.value.trim(),
    firstName: userFirstName.value.trim(),
    lastName: userLastName.value.trim(),
    sex: userSex.value,
    birthDate: userBirthDate.value,
    roles,
    qualifications,
    allowedProvinces: splitCsv(userAllowedProvinces.value),
    isActive: userIsActive.value === "true",
    numeroInami: userNumeroInami.value.trim(),
    numeroVisa: userNumeroVisa.value.trim(),
    provisionalPassword: userPassword.value.trim(),
    updatedAt: serverTimestamp()
  };
}

userForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  adminMessage.textContent = "";

  try {
    const payload = buildUserPayload();

    if (!validateRoleSpecificFields(payload.roles)) return;

    if (editingUserId.value.trim()) {
      await updateDoc(doc(db, "users", editingUserId.value.trim()), payload);
      adminMessage.textContent = "Utilisateur modifié.";
    } else {
      const generatedId = crypto.randomUUID();
      await setDoc(doc(db, "users", generatedId), {
        ...payload,
        createdAt: serverTimestamp()
      });
      adminMessage.textContent = "Profil utilisateur créé dans Firestore. Crée ensuite le compte Firebase Auth avec le même email.";
    }

    resetForm();
    await renderUsers();
  } catch (error) {
    console.error(error);
    adminMessage.textContent = "Erreur lors de l'enregistrement.";
  }
});

async function renderRequests() {
  const q = query(collection(db, "account_requests"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  requestsTableBody.innerHTML = "";

  if (snapshot.empty) {
    requestsTableBody.innerHTML = `<tr><td colspan="7" class="empty-row">Aucune demande d'accès.</td></tr>`;
    return;
  }

  snapshot.forEach((docSnap) => {
    const req = docSnap.data();
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${req.lastName || "-"}</td>
      <td>${req.firstName || "-"}</td>
      <td>${req.email || "-"}</td>
      <td>${req.sex || "-"}</td>
      <td>${req.birthDate || "-"}</td>
      <td>${req.status || "-"}</td>
      <td>
        <div class="button-col">
          <button class="table-action-btn" data-fill-request="${docSnap.id}">Préremplir</button>
          <button class="table-action-btn" data-approve-request="${docSnap.id}">Marquer validée</button>
          <button class="table-action-btn" data-reject-request="${docSnap.id}">Refuser</button>
        </div>
      </td>
    `;
    requestsTableBody.appendChild(row);
  });

  document.querySelectorAll("[data-fill-request]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const requestId = btn.dataset.fillRequest;
      const allRequests = await getDocs(collection(db, "account_requests"));
      const found = allRequests.docs.find((d) => d.id === requestId);
      if (!found) return;

      const req = found.data();
      editingUserId.value = "";
      userEmail.value = req.email || "";
      userFirstName.value = req.firstName || "";
      userLastName.value = req.lastName || "";
      userSex.value = req.sex || "";
      userBirthDate.value = req.birthDate || "";
      adminMessage.textContent = "Demande préremplie. Complète les rôles, provinces et mot de passe provisoire.";
    });
  });

  document.querySelectorAll("[data-approve-request]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await updateDoc(doc(db, "account_requests", btn.dataset.approveRequest), {
        status: "approved",
        reviewedAt: serverTimestamp()
      });
      await renderRequests();
    });
  });

  document.querySelectorAll("[data-reject-request]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await updateDoc(doc(db, "account_requests", btn.dataset.rejectRequest), {
        status: "rejected",
        reviewedAt: serverTimestamp()
      });
      await renderRequests();
    });
  });
}

async function renderUsers() {
  const q = query(collection(db, "users"), orderBy("lastName", "asc"));
  const snapshot = await getDocs(q);

  usersTableBody.innerHTML = "";

  if (snapshot.empty) {
    usersTableBody.innerHTML = `<tr><td colspan="6" class="empty-row">Aucun utilisateur.</td></tr>`;
    return;
  }

  snapshot.forEach((docSnap) => {
    const user = { id: docSnap.id, ...docSnap.data() };
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.lastName || "-"}</td>
      <td>${user.firstName || "-"}</td>
      <td>${user.email || "-"}</td>
      <td>${Array.isArray(user.roles) ? user.roles.join(", ") : "-"}</td>
      <td>${user.isActive ? "Oui" : "Non"}</td>
      <td>
        <div class="button-col">
          <button class="table-action-btn" data-edit-user="${user.id}">Modifier</button>
          <button class="table-action-btn" data-disable-user="${user.id}">Désactiver</button>
          <button class="table-action-btn" data-delete-user="${user.id}">Supprimer</button>
        </div>
      </td>
    `;
    usersTableBody.appendChild(row);
  });

  document.querySelectorAll("[data-edit-user]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const userId = btn.dataset.editUser;
      const allUsers = await getDocs(collection(db, "users"));
      const found = allUsers.docs.find((d) => d.id === userId);
      if (!found) return;

      const user = found.data();
      editingUserId.value = userId;
      userEmail.value = user.email || "";
      userFirstName.value = user.firstName || "";
      userLastName.value = user.lastName || "";
      userSex.value = user.sex || "";
      userBirthDate.value = user.birthDate || "";
      userAllowedProvinces.value = (user.allowedProvinces || []).join(", ");
      userPassword.value = user.provisionalPassword || "";
      userNumeroInami.value = user.numeroInami || "";
      userNumeroVisa.value = user.numeroVisa || "";
      userIsActive.value = user.isActive ? "true" : "false";

      setCheckedValues(".role-checkbox", user.roles || []);
      setCheckedValues(".qualification-checkbox", user.qualifications || []);

      adminMessage.textContent = "Utilisateur chargé pour modification.";
    });
  });

  document.querySelectorAll("[data-disable-user]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await updateDoc(doc(db, "users", btn.dataset.disableUser), {
        isActive: false,
        updatedAt: serverTimestamp()
      });
      await renderUsers();
    });
  });

  document.querySelectorAll("[data-delete-user]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ok = confirm("Supprimer ce profil utilisateur Firestore ?");
      if (!ok) return;
      await deleteDoc(doc(db, "users", btn.dataset.deleteUser));
      await renderUsers();
    });
  });
}

await renderRequests();
await renderUsers();