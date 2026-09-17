
let vehicle = null;
let inspections = [];
let faults = [];

document.addEventListener("DOMContentLoaded", () => {
    loadVehicle();
});

async function loadVehicle() {

    const params = new URLSearchParams(window.location.search);

    const vehicleId = params.get("id");

    if (!vehicleId) {
        console.error("Vehicle ID puuttuu URL-osoitteesta.");
        showVehicleError("Ajoneuvon tunnus puuttuu.");
        return;
    }

    try {

        const xhr = new XMLHttpRequest();
        xhr.open("GET", "../../api/vehicles/" + vehicleId, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = () => {
            console.log("Raw vehicle response:", xhr.responeText);

            if (!xhr.responeText) {
            throw new Error(
                "Vehicle API returned an empty response."
            );
        }
        const vehicles = xhr.responeText;
        console.log(vehicles);
        };

        

        

        

        console.log("Vehicles:", vehicles);

        // Find the vehicle with the correct ID
        
        vehicle = vehicles.find(
            item =>
                Number(item.id_vehicles) === Number(vehicleId)
        );

        console.log("Selected vehicle:", vehicle);

        if (!vehicle) {
            throw new Error(
                `Vehicle with ID ${vehicleId} not found`
            );
        }

        renderVehicle(vehicle);

        loadInspections(
            vehicle.id_vehicles
        );
                
        renderOpenFaults(vehicle.id_vehicles);

    } catch (error) {

        console.error(
            "Vehicle information could not be loaded:",
            error
        );

        showVehicleError(
            "Ajoneuvon tietoja ei voitu ladata."
        );
    }
}


function renderVehicle(vehicle) {

    const nameElement =
        document.querySelector(".vehicle-name");

    const typeElement =
        document.querySelector(".vehicle-type");

    const statusElement =
        document.querySelector(".vehicle-status");

    const licenseElement =
        document.querySelector(".vehicle-license");


    if (nameElement) {
        nameElement.textContent =
            vehicle.name || "-";
    }

    if (typeElement) {
        typeElement.textContent =
            vehicle.type || "-";
    }

    if (statusElement) {
        statusElement.textContent =
            formatVehicleState(vehicle.state);
    }

    if (licenseElement) {
        licenseElement.textContent =
            vehicle.license_plate || "-";
    }

    stateNotification(vehicle.state);
    setupInspectionButton(vehicle.state,vehicle.id_vehicles);
}


function formatVehicleState(state) {

    switch (state) {

        case "available":
            return "Vapaa";

        case "in_use":
            return "On Käytössä";

        case "disable":
            return "On poistettu";

        default:
            return state || "-";
    }
}

function stateNotification (state) {
    const inUseText = document.querySelector(".in-use-text");
    const inUseDescription = document.querySelector(".in-use-description");
        if (state === "in_use") {
        inUseText.innerHTML = "Kone on käytössä";
        inUseDescription.innerHTML = `
Voit silti aloittaa oman tarkastuksesi — edellinen käyttäjä kirjataan poistuneeksi.`;
}       if (state === "available") {
        inUseText.innerHTML = "Kone on vapaa";
        inUseDescription.innerHTML = `
Voit aloittaa tarkastuksen nyt.`;
}       if (state === "disabled") {
        inUseText.innerHTML = "Kone on poistettu";
        inUseDescription.innerHTML = `
Et saa aloittaa tarkatuksesi.`;
}
}


function setupInspectionButton(state, vehicleId) {
    const button = document.querySelector("#startInspection");
    if (!button) return;
    button.onclick = () => {
        if (state === "disabled") {
            alert("Tarkastusta ei voida aloittaa, koska ajoneuvo on ajokelvoton.");
            return;
        }
        window.location.href = `inspection-step.html?id=${vehicleId}`;
};
}

async function loadInspections(vehicleId) {

    console.log("Loading inspections for vehicle:", vehicleId);

    try {

        const url =
            `../databaseAPI/vehicleInspections.php?vehicle=${vehicleId}`;

        console.log("Inspection API URL:", url);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `HTTP error: ${response.status}`
            );
        }

        const data = await response.json();

        console.log("Inspections:", data);

        inspections = Array.isArray(data) ? data : [];


        renderKilometers();
        renderLastInspection();
        renderInspectionHistory();

    } catch (error) {

        console.error(
            "Inspection information could not be loaded:",
            error
        );

        inspections = [];

        renderKilometers();
        renderLastInspection();
        renderInspectionHistory();
    }
}

//Render Open faults of the vehicle
async function renderOpenFaults(vehicleId) {
    console.log("Loading Faults for vehicle", vehicleId);

    const xhr = new XMLHttpRequest();

    xhr.open(
        "GET",
        "/api/vehicleProblems.php?vehicle=" + encodeURIComponent(vehicleId),
        true
    );

    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = () => {

        console.log("Fault API status:", xhr.status);
        console.log("Fault API response:", xhr.responseText);

        if (xhr.status >= 200 && xhr.status < 300) {

            try {
        const data = JSON.prase(xhr.responseText);

        console.log("Parsed data:", data);

        console.log("All Faults:", data);

        faults = Array.isArray(data) ? data : data.faults || data.data || [];

        const openFaults = faults.filter(
            fault => fault.state === "open"
        );

        console.log("Open faults:", openFaults);

        //Render Openfaults to UI
        renderFaultCards(openFaults);

    } catch (error) {

        console.error(
            "Inspection information could not be loaded:",
            error
        );

        faults = [];

        renderFaultCards([]);
    }
        }
    }
}

//Take the km form the newest inspection
function renderKilometers() {

    const element =
        document.querySelector(".kilometers-value");

    if (!element) return;

    if (!inspections.length) {
        element.textContent = "-";
        return;
    }

    const latestInspection = inspections[0];

    element.textContent =
        latestInspection.km != null
            ? `${latestInspection.km} km`
            : "-";
}

//renderLastInspection
function renderLastInspection() {

    const nameElement =
        document.querySelector(".last-inspection-name");

    const statusElement =
        document.querySelector(".last-inspection-status");

    const dateElement =
        document.querySelector(".last-inspection-date");

    if (!inspections.length) {

        if (nameElement) {
            nameElement.textContent = "Ei tarkastuksia";
        }

        if (statusElement) {
            statusElement.textContent = "";
        }

        if (dateElement) {
            dateElement.textContent = "";
        }

        return;
    }

    const inspection = inspections[0];

    if (nameElement) {
        nameElement.textContent =
            inspection.username || "Tuntematon käyttäjä";
    }

    if (statusElement) {

        statusElement.textContent =
            Number(inspection.passed) === 1
                ? "Hyväksytty"
                : "Hylätty";

        statusElement.className =
            Number(inspection.passed) === 1
                ? "last-inspection-status status-label passed"
                : "last-inspection-status status-label failed";
    }

    if (dateElement) {

        dateElement.textContent =
            formatInspectionDate(inspection.date);
    }
}

//Format date
function formatInspectionDate(dateString) {

    if (!dateString) return "-";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleString("fi-FI", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

//render all Inspections history
function renderInspectionHistory() {

    const container =
        document.querySelector(".inspection-history");

    if (!container) return;

    container.innerHTML = "";

    if (!inspections.length) {

        container.innerHTML = `
            <p class="no-inspections">
                Ei aikaisempia tarkastuksia.
            </p>
        `;

        return;
    }

    const title = document.createElement("div");

    title.classList.add("inspection-history-icon");

    title.innerHTML = `
        <span class="material-symbols-outlined">
            history
        </span>
        <p class="inspection-history-text">Aikaisemmat tarkastukset</p>
    `;

    container.appendChild(title);

    inspections.forEach((inspection) => {

        const card =
            document.createElement("div");

        card.classList.add("inspection-history-content");

        const passed =
            Number(inspection.passed) === 1;

        card.innerHTML = `
                <p class="inspection-history-name">
                        ${inspection.username || "Tuntematon käyttäjä"}</p>
                <span class="inspection-history-status status-label
                    ${passed ? "passed" : "failed"}">
                    ${passed ? "Hyväksytty" : "Hylätty"}
                </span>
                    <p class="inspection-history-kilometer">
                        ${inspection.km ?? "-"} km
                    </p>

                     <p class="inspection-history-date">
                        ${formatInspectionDate(inspection.date)}
                    </p>
            ${
                inspection.note
                    ? `
                        <p class="inspection-history-note">
                            ${inspection.note}
                        </p>
                    `
                    : ""
            }
        `;

        container.appendChild(card);
    });
}

function renderFaultCards(openFaults) {

    const container =
        document.querySelector(".faults-render");
    if (!container) return;

    container.innerHTML = "";

    container.innerHTML = `
        <div class="faults-icon">
                    <span class="material-symbols-outlined">report_problem</span>
                     <p class="faults-text">Havaitut viat</p>
        </div>
        `;


    if (openFaults.length === 0) {

        container.innerHTML = `
                <p class="faults-card p">
                    Ei avoimia vikoja
                </span>
        `;

        return;
    }

    const faultsValue = 
    document.querySelector(".faults-value");
    if (!faultsValue) return;

    faultsValue.innerHTML = "";

    faultsValue.innerHTML = `${openFaults.length}`;

    openFaults.forEach(fault => {

        const card = document.createElement("div");

        card.classList.add(
            "fault-card"
        );

        card.innerHTML = `
                <span class="fault-priority status-label ${fault.priority}">
                    ${fault.priority || ""}
                </span>
                 <p>
                ${fault.note || "Ei kuvausta"}
                 </p>
                 <p>
                ${fault.date || "Null"}
                 </p>
        `;

        container.appendChild(card);
    });
}

function showVehicleError(message) {

    const nameElement =
        document.querySelector(".vehicle-name");

    if (nameElement) {
        nameElement.textContent = message;
    }

    const typeElement =
        document.querySelector(".vehicle-type");

    if (typeElement) {
        typeElement.textContent = "";
    }

    const statusElement =
        document.querySelector(".vehicle-status");

    if (statusElement) {
        statusElement.textContent = "";
    }

    const licenseElement =
        document.querySelector(".vehicle-license");

    if (licenseElement) {
        licenseElement.textContent = "";
    }
}