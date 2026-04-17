import { requireAuth, logout, isCoordinator } from "./auth.js";

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

const connectedUser = document.getElementById("connectedUser");
const logoutBtn = document.getElementById("logoutBtn");
const adminUsersBtn = document.getElementById("adminUsersBtn");
const selectedProvinceLabel = document.getElementById("selectedProvinceLabel");
const svgMapContainer = document.getElementById("svgMapContainer");

connectedUser.textContent = `${profile.firstName || ""} ${profile.lastName || ""}`;

if (isCoordinator(profile)) {
  adminUsersBtn.classList.remove("hidden");
}

adminUsersBtn?.addEventListener("click", () => {
  window.location.href = "admin-users.html";
});

logoutBtn?.addEventListener("click", async () => {
  await logout();
  window.location.href = "index.html";
});

function setSelectedProvinceLabel(provinceName) {
  selectedProvinceLabel.textContent = provinceName || "Aucune province sélectionnée";
}

function selectProvince(provinceName) {
  if (!provinceName) return;
  sessionStorage.setItem("selectedProvince", provinceName);
  setSelectedProvinceLabel(provinceName);
  window.location.href = "evenements.html";
}

function bindProvinceEvents() {
  const provinceShapes = svgMapContainer.querySelectorAll("[data-province]");

  if (provinceShapes.length === 0) {
    svgMapContainer.innerHTML = `
      <p class="page-subtitle">
        La carte a bien été chargée, mais aucun élément avec l’attribut
        <strong>data-province</strong> n’a été trouvé dans be.svg.
      </p>
    `;
    return;
  }

  provinceShapes.forEach((shape) => {
    shape.classList.add("province-shape");

    shape.addEventListener("click", () => {
      selectProvince(shape.dataset.province);
    });

    shape.addEventListener("mouseenter", () => {
      setSelectedProvinceLabel(shape.dataset.province);
    });

    shape.addEventListener("mouseleave", () => {
      setSelectedProvinceLabel(sessionStorage.getItem("selectedProvince"));
    });
  });
}

async function loadSvgMap() {
  try {
    const response = await fetch("./be.svg");
    if (!response.ok) {
      throw new Error(`Chargement impossible de be.svg (${response.status})`);
    }

    const svgText = await response.text();
    svgMapContainer.innerHTML = svgText;
    bindProvinceEvents();
  } catch (error) {
    console.error(error);
    svgMapContainer.innerHTML = `
      <p class="page-subtitle">
        Impossible d’afficher la carte SVG.
      </p>
    `;
  }
}

document.querySelectorAll(".province-list-btn").forEach((button) => {
  button.addEventListener("click", () => {
    selectProvince(button.dataset.province);
  });
});

setSelectedProvinceLabel(sessionStorage.getItem("selectedProvince"));
await loadSvgMap();