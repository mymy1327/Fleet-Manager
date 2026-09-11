document.addEventListener("DOMContentLoaded", () => {
  loadVehicle();
});

async function loadVehicle() {
  try {
    const [vehiclesResponse, faultsResponse] =
            await Promise.all([
                fetch("data/vehicles.json"),
                fetch("data/faults.json")
            ]);

    if (!vehiclesResponse.ok) {
      throw new Error("Can not load vehicles.json");
    }

    if (!faultsResponse.ok) {
      throw new Error("Can not load faults.json");
    }

    const vehiclesData =
            await vehiclesResponse.json();

    const faultsData =
            await faultsResponse.json();

    const params =
            new URLSearchParams(window.location.search);

    //take the vehicle base on the id
    const vehicleId =
            Number(params.get("id"));

    const vehicle =
            vehiclesData.vehicles.find(
                vehicle => vehicle.id_vehicles === vehicleId
            );

            if (!vehicle) {
            throw new Error(
                `Can not find vehicle with ID: ${vehicleId}`
            );
  }
  // Take all the faults from this car's ID
  const vehicleFaults =
            faultsData.faults.filter(
                fault => fault.vehicleId === vehicleId
            );


// Render
        renderVehicle(vehicle, vehicleFaults);
        renderFaults(vehicleFaults);
        renderLastInspection(vehicle);
        renderInspectionHistory(vehicle);


    } catch (error) {

        console.error("Error:", error);

    }
}

function renderVehicle(vehicle, vehicleFaults) {

    // Vehicle information
    document.querySelector(".vehicle-name").textContent =
        vehicle.name;

    document.querySelector(".vehicle-type").textContent =
        vehicle.type;

    document.querySelector(".vehicle-status").textContent =
        vehicle.state;

    document.querySelector(".vehicle-license").textContent =
        vehicle.license_plate;


    // Kilometers
    document.querySelector(".kilometers-value").textContent =
        formatKilometers(vehicle.kilometers);

    
    // Open faults
    const openFaults = vehicleFaults.filter(
    fault => fault.status === "open"
).length;

    document.querySelector(".faults-value").textContent = openFaults;


    // Current user / previous user
    const latestInspection =
        vehicle.inspections?.[vehicle.inspections.length - 1];

    if (latestInspection) {

        document.querySelector(".in-use-description").innerHTML = `
            Nykyinen käyttäjä: <strong>${latestInspection.name}</strong><br>
            Käyttö aloitettu: <strong>${formatDate(latestInspection.date)}</strong><br>
            Voit silti aloittaa oman tarkastuksesi - edellinen käyttäjä kirjataan poistuneeksi.
        `;
    }
}

function renderLastInspection(vehicle) {

    const container = document.querySelector(".last-inspection");

    if (!vehicle.inspections || vehicle.inspections.length === 0) {
        container.style.display = "none";
        return;
    }

    const latest =
        vehicle.inspections[vehicle.inspections.length - 1];

    const name =
        container.querySelector(".last-inspection-name");

    const status =
        container.querySelector(".last-inspection-status");

    const date =
        container.querySelector(".last-inspection-date");


    name.textContent = latest.name;

    status.textContent =
        latest.status === "passed"
            ? "Passed"
            : "Failed";


    status.className =
        `last-inspection-status status-label ${latest.status}`;

    date.textContent =
        formatDate(latest.date);
}

function renderInspectionHistory(vehicle) {

    const container =
        document.querySelector(".inspection-history");

    const inspections = vehicle.inspections || [];

    if (inspections.length === 0) {
        container.innerHTML = `
            <div class="inspection-history-icon">
                <span class="material-symbols-outlined">
                    work_history
                </span>
                <p class="inspection-history-text">
                    Tarkastushistoria
                </p>
            </div>

            <p>Ei tarkastushistoriaa</p>
        `;

        return;
    }


    container.innerHTML = `
        <div class="inspection-history-icon">
            <span class="material-symbols-outlined">
                work_history
            </span>

            <p class="inspection-history-text">
                Tarkastushistoria
            </p>
        </div>
    `;


    // Render inspection
    inspections
        .slice()
        .reverse()
        .forEach(inspection => {

            const historyItem =
                document.createElement("div");

            historyItem.className =
                "inspection-history-content";


            historyItem.innerHTML = `
                <p class="inspection-history-name">
                    ${inspection.name}
                </p>

                <span class="inspection-history-status status-label ${inspection.status}">
                    ${inspection.status === "passed" ? "Passed" : "Failed"}
                </span>

                <p class="inspection-history-kilometer">
                    ${formatKilometers(inspection.kilometers)}
                </p>

                <p class="inspection-history-date">
                    ${formatDate(inspection.date)}
                </p>
            `;


            container.appendChild(historyItem);
        });
}

function renderFaults(faults) {

    const container =
        document.querySelector(".faults-render");



    container.innerHTML = `
        <div class="faults-icon">
            <span class="material-symbols-outlined">
                report_problem
            </span>

            <p class="faults-text">
                Havaitut viat
            </p>
        </div>
    `;


    // No faults
    if (faults.length === 0) {

        container.innerHTML += `
            <p class="no-faults">
                Ei havaittuja vikoja
            </p>
        `;

        return;
    }


    // Render faults
    faults.forEach(fault => {

        const faultCard =
            document.createElement("div");

        faultCard.className = "fault-card";


        faultCard.innerHTML = `
            <div class="status-labels">

                <span class="status-label ${fault.status}">
                    ${formatFaultStatus(fault.status)}
                </span>

                <span class="status-label ${fault.priority}">
                    ${formatPriority(fault.priority)}
                </span>

            </div>

            <p class="fault-title">
                ${fault.title}
            </p>

            <p class="fault-description">
                ${fault.description}
            </p>

            <p class="fault-date">
                ${formatDate(fault.date)}
            </p>
        `;


        container.appendChild(faultCard);

    });
}


/* FORMAT FUNCTIONS */
function formatKilometers(kilometers) {
    return kilometers
        .toLocaleString("fi-FI")
        .replace(/\u00A0/g, " ") + " km";
}

function formatDate(dateString) {
    const date = new Date(dateString);

    return date.toLocaleDateString("fi-FI");
}

function formatFaultStatus(status) {

    const statuses = {
        open: "Open",
        resolved: "Resolved",
        closed: "Closed",
        failed: "Failed"
    };


    return statuses[status] || status;
}

function formatPriority(priority) {

    const priorities = {
        low: "Low",
        medium: "Medium",
        high: "High"
    };


    return priorities[priority] || priority;
}