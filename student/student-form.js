let restapi = "https://developmenterasmus.kolojar.cz";
let vehicle = null;
let inspections = [];
let faults = [];
let vehicleCode = null;

document.addEventListener("DOMContentLoaded", () => {
    loadVehicle();
});

function loadVehicle() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
        showVehicleError("Ajoneuvon tunnus puuttuu.");
        return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open(
        "GET",
        restapi + "/api/vehicles?code=" + encodeURIComponent(code),
        true
    );
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = () => {
        console.log("Vehicle API:", xhr.status, xhr.responseText);

        if (xhr.status < 200 || xhr.status >= 300) {
            showVehicleError("Ajoneuvon tietoja ei voitu ladata.");
            return;
        }

        try {
            const data = JSON.parse(xhr.responseText);

            if (!Array.isArray(data) || !data.length) {
                showVehicleError("Ajoneuvoa ei löytynyt.");
                return;
            }

            vehicle = data[0];
            vehicleCode = code;

            renderVehicle(vehicle);
            loadInspections(vehicle.id_vehicles);
            loadProblems(vehicle.id_vehicles);

        } catch (error) {
            console.error("Vehicle JSON error:", error);
            showVehicleError("Ajoneuvon tietoja ei voitu ladata.");
        }
    };

    xhr.onerror = () => {
        showVehicleError("Yhteys palvelimeen epäonnistui.");
    };

    xhr.send();
}

function renderVehicle(vehicle) {
    const name = document.querySelector(".vehicle-name");
    const type = document.querySelector(".vehicle-type");
    const status = document.querySelector(".vehicle-status");
    const license = document.querySelector(".vehicle-license");
    const kilometer = document.querySelector(".vehicle-kilometer");

    if (name) name.textContent = vehicle.name || "-";
    if (type) type.textContent = vehicle.type || "-";
    if (status) status.textContent = formatVehicleState(vehicle.state);
    if (license) license.textContent = vehicle.license_plate || "-";
    if (kilometer) kilometer.textContent = `${vehicle.km ?? "-"} km`;

    stateNotification(vehicle.state);
    setupInspectionButton(vehicle.state, vehicle.id_vehicles);
}

function formatVehicleState(state) {
    switch (state) {
        case "available": return "Vapaa";
        case "in_use": return "On käytössä";
        case "disabled": return "Poistettu käytöstä";
        default: return state || "-";
    }
}

function stateNotification(state) {
    const text = document.querySelector(".in-use-text");
    const description = document.querySelector(".in-use-description");

    if (!text || !description) return;

    if (state === "in_use") {
        text.textContent = "Ajoneuvo on käytössä";
        description.textContent = "Voit silti aloittaa oman tarkastuksesi — edellinen käyttäjä kirjataan poistuneeksi.";
    }

    if (state === "available") {
        text.textContent = "Ajoneuvo on vapaa";
        description.textContent = "Voit aloittaa tarkastuksen nyt.";
    }

    if (state === "disabled") {
        text.textContent = "Ajoneuvo on poistettu käytöstä";
        description.textContent = "Et saa aloittaa tarkastusta.";
    }
}

function setupInspectionButton(state) {
    const button = document.querySelector("#startInspection");
    if (!button) return;

    button.onclick = () => {
        if (state === "disabled") {
            alert("Tarkastusta ei voida aloittaa, koska ajoneuvo on ajokelvoton.");
            return;
        }

        window.location.href =
            `inspection-step.html?code=${encodeURIComponent(vehicleCode)}`;
    };
}

function loadInspections(vehicleId) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", restapi + "/api/inspections?id_vehicles=" + vehicleId, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
            inspections = [];
            renderInspectionData();
            return;
        }

        try {
            inspections = JSON.parse(xhr.responseText);
            inspections = Array.isArray(inspections) ? inspections : [];
            inspections.sort((a, b) => new Date(b.date) - new Date(a.date));
            renderInspectionData();
        } catch (error) {
            console.error("Inspection JSON error:", error);
            inspections = [];
            renderInspectionData();
        }
    };

    xhr.send();
}

function loadProblems(vehicleId) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", restapi + "/api/problems?id_vehicles=" + vehicleId, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
            faults = [];
            renderFaultCards([]);
            return;
        }

        try {
            faults = JSON.parse(xhr.responseText);
            faults = Array.isArray(faults) ? faults : [];
            renderFaultCards(faults.filter(fault => fault.state === "open"));
        } catch (error) {
            console.error("Problems JSON error:", error);
            faults = [];
            renderFaultCards([]);
        }
    };

    xhr.send();
}

function renderInspectionData() {
    renderKilometers();
    renderLastInspection();
    renderInspectionHistory();
}

function renderKilometers() {
    const element = document.querySelector(".kilometers-value");
    if (!element) return;

    element.textContent = inspections.length
        ? `${inspections[0].km ?? "-"} km`
        : "-";
}

async function renderLastInspection() {
    const name = document.querySelector(".last-inspection-name");
    const status = document.querySelector(".last-inspection-status");
    const date = document.querySelector(".last-inspection-date");

    if (!inspections.length) {
        if (name) name.textContent = "Ei tarkastuksia";
        if (status) status.textContent = "";
        if (date) date.textContent = "";
        return;
    }

    const inspection = inspections[0];
    const username = await getUsername(inspection.id_users);

    if (name) name.textContent = username ?? "-";

    if (status) {
        const passed = Number(inspection.passed) === 1;
        status.textContent = passed ? "Hyväksytty" : "Hylätty";
        status.className = `last-inspection-status status-label ${passed ? "passed" : "failed"}`;
    }

    if (date) date.textContent = formatInspectionDate(inspection.date);
}

function formatInspectionDate(date) {
    if (!date) return "-";

    const value = new Date(date);

    return Number.isNaN(value.getTime())
        ? date
        : value.toLocaleString("fi-FI", {
            dateStyle: "short",
            timeStyle: "short"
        });
}

//render all Inspections history
const userCache = {};

function getUsername(userId) {
    if (!userId) return Promise.resolve("-");

    if (userCache[userId]) {
        return Promise.resolve(userCache[userId]);
    }

    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();

        xhr.open("GET", `${restapi}/api/users/${userId}`, true);

        xhr.onload = () => {
            if (xhr.status < 200 || xhr.status >= 300) {
                resolve("-");
                return;
            }

            try {
                const data = JSON.parse(xhr.responseText);
                const username = data.username ?? data.name ?? "-";

                userCache[userId] = username;
                resolve(username);
            } catch {
                resolve("-");
            }
        };

        xhr.onerror = () => resolve("-");
        xhr.send();
    });
}
async function renderInspectionHistory(inspections) {
    const container = document.querySelector(".inspection-history");
    if (!container) return;

    container.innerHTML = `
        <div class="inspection-history-icon">
            <span class="material-symbols-outlined">history</span>
            <p class="inspection-history-text">Aikaisemmat tarkastukset</p>
        </div>
    `;

    if (!inspections.length) {
        container.innerHTML += `<p class="no-inspections">Ei aikaisempia tarkastuksia.</p>`;
        return;
    }

    const recentInspections = inspections.slice(0, 5);

    for (const inspection of recentInspections) {
        const passed = Number(inspection.passed) === 1;
        const username = await getUsername(inspection.id_users);

        const card = document.createElement("div");

        card.className = "inspection-history-content";
        card.innerHTML = `
            <p class="inspection-history-name">${username}</p>
            <span class="inspection-history-status status-label ${passed ? "passed" : "failed"}">
                ${passed ? "Hyväksytty" : "Hylätty"}
            </span>
            <p class="inspection-history-kilometer">${inspection.km ?? "-"} km</p>
            <p class="inspection-history-date">${formatInspectionDate(inspection.date)}</p>
            ${inspection.note ? `<p class="inspection-history-note">${inspection.note}</p>` : ""}
        `;

        container.appendChild(card);
    }
}

function renderFaultCards(openFaults) {
    const container = document.querySelector(".faults-render");
    const count = document.querySelector(".faults-value");

    if (!container) return;

    if (count) count.textContent = openFaults.length;

    container.innerHTML = `
        <div class="faults-icon">
            <span class="material-symbols-outlined">report_problem</span>
            <p class="faults-text">Havaitut viat</p>
        </div>
    `;

    if (!openFaults.length) {
        container.innerHTML += `<p class="faults-card">Ei avoimia vikoja</p>`;
        return;
    }

    openFaults.forEach(fault => {
        const card = document.createElement("div");
        card.className = "fault-card";

        card.innerHTML = `
            <span class="fault-priority status-label ${fault.priority || ""}">
                ${fault.priority || "-"}
            </span>
            <p>${fault.checklist?.name || "Vika"}</p>
            <p>${fault.note || "Ei kuvausta"}</p>
        `;

        container.appendChild(card);
    });
}

function showVehicleError(message) {
    const nameElement = document.querySelector(".vehicle-name");

    if (nameElement) {
        nameElement.textContent = message;
    }

    const typeElement = document.querySelector(".vehicle-type");

    if (typeElement) {
        typeElement.textContent = "";
    }

    const statusElement = document.querySelector(".vehicle-status");

    if (statusElement) {
        statusElement.textContent = "";
    }

    const licenseElement = document.querySelector(".vehicle-license");

    if (licenseElement) {
        licenseElement.textContent = "";
    }
}
