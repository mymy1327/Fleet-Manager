const workflowRestApi = typeof restapi !== "undefined"
    ? restapi
    : "https://developmenterasmus.kolojar.cz";

let inspectionVehicles = [];

function escapeWorkflowHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

async function loadInspectionVehicles() {
    const container = document.getElementById("inspectionList");
    if (!container) return;

    container.innerHTML = '<div class="inspection-loading">Loading vehicles...</div>';

    try {
        const response = await fetch(workflowRestApi + "/api/vehicles");

        if (!response.ok) {
            throw new Error("Failed to load vehicles: " + response.status);
        }

        inspectionVehicles = await response.json();

        if (!Array.isArray(inspectionVehicles) || !inspectionVehicles.length) {
            container.innerHTML = '<div class="workflow-empty">No vehicles found.</div>';
            return;
        }

        renderInspectionVehicles();
    } catch (error) {
        console.error("Error loading vehicles:", error);
        container.innerHTML = '<div class="workflow-error">Failed to load vehicles.</div>';
    }
}

function renderInspectionVehicles() {
    const container = document.getElementById("inspectionList");
    if (!container) return;

    container.innerHTML = "";

    inspectionVehicles.forEach(vehicle => {
        const card = document.createElement("article");
        card.className = "vehicle-card";

        const imageUrl = vehicle.id_files
            ? `${workflowRestApi}/api/files/${vehicle.id_files}`
            : "";

            card.innerHTML = `
        <div class="vehicle-card-image">
            ${imageUrl
                ? `<img src="${imageUrl}" alt="${escapeWorkflowHtml(vehicle.name)}">`
                : `<div class="workflow-empty">Ei kuvaa</div>`
            }
        </div>

        <div class="vehicle-card-body">
            <h3 class="vehicle-card-title">
                ${escapeWorkflowHtml(vehicle.name || "Tuntematon ajoneuvo")}
            </h3>

            <div class="vehicle-card-info">
                <div class="vehicle-card-info-row">
                    <span>Rekisterinumero</span>
                    <strong>${escapeWorkflowHtml(vehicle.license_plate || "-")}</strong>
                </div>

                <div class="vehicle-card-info-row">
                    <span>Tyyppi</span>
                    <strong>${escapeWorkflowHtml(vehicle.type || "-")}</strong>
                </div>

                <div class="vehicle-card-info-row">
                    <span>Koodi</span>
                    <strong>${escapeWorkflowHtml(vehicle.code || "-")}</strong>
                </div>
            </div>

            <div class="vehicle-card-footer">
                <span class="btn btn-primary btn-sm">
                    Aloita tarkastus
                </span>
            </div>
        </div>
    `;

        card.addEventListener("click", () => {
            openStudentInspection(vehicle);
        });

        container.appendChild(card);
    });
}

function openStudentInspection(vehicle) {
    if (!vehicle.code) {
        alert("Vehicle code is missing.");
        return;
    }

    const url =
        "../student/studentForm.html?code=" +
        encodeURIComponent(vehicle.code);

    window.location.href = url;
}

function setupInspectionRefresh() {
    const button = document.getElementById("refreshInspections");
    if (!button) return;

    button.addEventListener("click", loadInspectionVehicles);
}

document.addEventListener("DOMContentLoaded", () => {
    loadInspectionVehicles();
    setupInspectionRefresh();
});