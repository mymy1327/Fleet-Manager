let vehicles = [];
let allChecklists = [];
let selectedVehicleId = null;
let assignedChecklists = [];
let availableChecklists = [];
let draggedChecklist = null;
let originalAssignedChecklists = [];

const assignChecklistButton = document.getElementById("assignChecklistButton");
const vehicleChecklistModal = document.getElementById("vehicleChecklistModal");
const closeChecklistModal = document.getElementById("closeChecklistModal");
const cancelChecklistButton = document.getElementById("cancelChecklistButton");

const vehicleSelect = document.getElementById("vehicleSelect");
const selectedVehicle = document.getElementById("selectedVehicle");
const selectedVehicleImage = document.getElementById("selectedVehicleImage");
const selectedVehicleName = document.getElementById("selectedVehicleName");
const selectedVehicleLicense = document.getElementById("selectedVehicleLicense");
const selectedVehicleType = document.getElementById("selectedVehicleType");

const assignedChecklistList = document.getElementById("assignedChecklistList");
const availableChecklistList = document.getElementById("availableChecklistList");
const assignedChecklistCount = document.getElementById("assignedChecklistCount");
const availableChecklistCount = document.getElementById("availableChecklistCount");

const submitChecklistButton = document.getElementById("submitChecklistButton");

const addChecklistButton = document.getElementById("addChecklistButton");
const addChecklistModal = document.getElementById("addChecklistModal");
const closeAddChecklistModal = document.getElementById("closeAddChecklistModal");
const cancelAddChecklistButton = document.getElementById("cancelAddChecklistButton");
const addChecklistForm = document.getElementById("addChecklistForm");

const newChecklistName = document.getElementById("newChecklistName");
const newChecklistDescription = document.getElementById("newChecklistDescription");

assignChecklistButton.addEventListener("click", () => {
    vehicleChecklistModal.style.display = "flex";
    loadVehicles();
    loadAllChecklists();
});

closeChecklistModal.addEventListener("click", closeChecklistModalWindow);
cancelChecklistButton.addEventListener("click", closeChecklistModalWindow);

function closeChecklistModalWindow() {
    vehicleChecklistModal.style.display = "none";
    selectedVehicleId = null;
    assignedChecklists = [];
    availableChecklists = [];
    draggedChecklist = null;
    vehicleSelect.value = "";
    selectedVehicle.style.display = "none";
    assignedChecklistList.innerHTML = "";
    availableChecklistList.innerHTML = "";
}

async function loadVehicles() {
    try {
        const response = await fetch(restapi + "/api/vehicles");
        vehicles = await response.json();
        renderVehicles();
    } catch (error) {
        console.error("Error loading vehicles:", error);
    }
}

function renderVehicles() {
    vehicleSelect.innerHTML = "";

    vehicles.forEach(vehicle => {
        const option = document.createElement("option");
        option.value = vehicle.id_vehicles;
        option.textContent = `${vehicle.name} - ${vehicle.license_plate}`;
        vehicleSelect.appendChild(option);
    });

    vehicleSelect.addEventListener("change", selectVehicle);

    if (vehicles.length > 0) {
        vehicleSelect.value = vehicles[0].id_vehicles;
        selectVehicle();
    }
}

async function selectVehicle() {
    selectedVehicleId = Number(vehicleSelect.value);

    const vehicle = vehicles.find(
        item => Number(item.id_vehicles) === selectedVehicleId
    );

    if (!vehicle) {
        selectedVehicle.style.display = "none";
        return;
    }

    selectedVehicle.style.display = "flex";

    selectedVehicleName.textContent = vehicle.name || "Unknown vehicle";
    selectedVehicleLicense.textContent = vehicle.license_plate || "-";
    selectedVehicleType.textContent = vehicle.type || "-";

    if (vehicle.id_files) {
        selectedVehicleImage.src =
            `${restapi}/api/files/${vehicle.id_files}`;
    } else {
        selectedVehicleImage.removeAttribute("src");
    }

    await loadVehicleChecklists(selectedVehicleId);
}

async function loadVehicleChecklists(vehicleId) {
    try {
        const response = await fetch(
            `${restapi}/api/checklists?id_vehicles=${vehicleId}`
        );

        assignedChecklists = await response.json();

        originalAssignedChecklists = assignedChecklists.map(item => ({
            ...item
        }));

        updateAvailableChecklists();
        renderChecklists();
    } catch (error) {
        console.error("Error loading vehicle checklists:", error);
        assignedChecklists = [];
        originalAssignedChecklists = [];
        updateAvailableChecklists();
        renderChecklists();
    }
}

async function loadAllChecklists() {
    try {
        const response = await fetch(restapi + "/api/checklists");
        allChecklists = await response.json();

        updateAvailableChecklists();
        renderChecklists();
    } catch (error) {
        console.error("Error loading checklists:", error);
    }
}

function updateAvailableChecklists() {
    const assignedIds = new Set(
        assignedChecklists.map(item => Number(item.id_checklists))
    );

    availableChecklists = allChecklists.filter(
        item => !assignedIds.has(Number(item.id_checklists))
    );
}

function renderChecklists() {
    assignedChecklistList.innerHTML = "";
    availableChecklistList.innerHTML = "";

    assignedChecklistCount.textContent = assignedChecklists.length;
    availableChecklistCount.textContent = availableChecklists.length;

    if (assignedChecklists.length === 0) {
        assignedChecklistList.innerHTML =
            `<div class="checklist-empty">No checklists assigned</div>`;
    }

    if (availableChecklists.length === 0) {
        availableChecklistList.innerHTML =
            `<div class="checklist-empty">No available checklists</div>`;
    }

    assignedChecklists.forEach(checklist => {
        assignedChecklistList.appendChild(
            createChecklistElement(checklist)
        );
    });

    availableChecklists.forEach(checklist => {
        availableChecklistList.appendChild(
            createChecklistElement(checklist)
        );
    });
}

function createChecklistElement(checklist) {
    const item = document.createElement("div");

    item.className = "checklist-item";
    item.draggable = true;
    item.dataset.id = checklist.id_checklists;

    item.innerHTML = `
        <div class="checklist-item-name">
            ${escapeHtml(checklist.name)}
        </div>
        <div class="checklist-item-description">
            ${escapeHtml(checklist.description || "")}
        </div>
    `;

    item.addEventListener("dragstart", event => {
        draggedChecklist = checklist;
        item.classList.add("dragging");

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData(
            "text/plain",
            String(checklist.id_checklists)
        );
    });

    item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        draggedChecklist = null;
    });

    return item;
}

assignedChecklistList.addEventListener("dragover", event => {
    event.preventDefault();
    assignedChecklistList.classList.add("drag-over");
});

assignedChecklistList.addEventListener("dragleave", () => {
    assignedChecklistList.classList.remove("drag-over");
});

assignedChecklistList.addEventListener("drop", event => {
    event.preventDefault();
    assignedChecklistList.classList.remove("drag-over");

    if (!draggedChecklist) return;

    const exists = assignedChecklists.some(
        item =>
            Number(item.id_checklists) ===
            Number(draggedChecklist.id_checklists)
    );

    if (!exists) {
        assignedChecklists.push(draggedChecklist);
    }

    availableChecklists = availableChecklists.filter(
        item =>
            Number(item.id_checklists) !==
            Number(draggedChecklist.id_checklists)
    );

    renderChecklists();
});

availableChecklistList.addEventListener("dragover", event => {
    event.preventDefault();
    availableChecklistList.classList.add("drag-over");
});

availableChecklistList.addEventListener("dragleave", () => {
    availableChecklistList.classList.remove("drag-over");
});

availableChecklistList.addEventListener("drop", event => {
    event.preventDefault();
    availableChecklistList.classList.remove("drag-over");

    if (!draggedChecklist) return;

    assignedChecklists = assignedChecklists.filter(
        item =>
            Number(item.id_checklists) !==
            Number(draggedChecklist.id_checklists)
    );

    const exists = availableChecklists.some(
        item =>
            Number(item.id_checklists) ===
            Number(draggedChecklist.id_checklists)
    );

    if (!exists) {
        availableChecklists.push(draggedChecklist);
    }

    renderChecklists();
});

submitChecklistButton.addEventListener("click", async () => {
    if (!selectedVehicleId) return;

    const originalIds = new Set(
        originalAssignedChecklists.map(
            item => Number(item.id_checklists)
        )
    );

    const newChecklists = assignedChecklists.filter(
        item => !originalIds.has(Number(item.id_checklists))
    );

    if (newChecklists.length === 0) {
        alert("No new checklists to save");
        return;
    }

    try {
        submitChecklistButton.disabled = true;

        await Promise.all(
            newChecklists.map(checklist =>
                insertVehicleChecklist(
                    selectedVehicleId,
                    checklist.id_checklists
                )
            )
        );

        await loadVehicleChecklists(selectedVehicleId);

        alert("All checklists saved successfully");
    } catch (error) {
        console.error("Error assigning checklists:", error);
        alert(error.message);
    } finally {
        submitChecklistButton.disabled = false;
    }
});

async function insertVehicleChecklist(vehicleId, checklistId) {
    const response = await fetch(
        `${restapi}/api/vehicles/${vehicleId}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id_checklists: checklistId
            })
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `Checklist ${checklistId}: ${response.status} ${errorText}`
        );
    }

    return true;
}

addChecklistButton.addEventListener("click", () => {
    addChecklistModal.style.display = "flex";
});

closeAddChecklistModal.addEventListener("click", () => {
    addChecklistModal.style.display = "none";
});

cancelAddChecklistButton.addEventListener("click", () => {
    addChecklistModal.style.display = "none";
});

addChecklistForm.addEventListener("submit", async event => {
    event.preventDefault();

    const name = newChecklistName.value.trim();
    const description = newChecklistDescription.value.trim();

    if (!name) return;

    try {
        await createChecklistItem(name, description);

        addChecklistForm.reset();
        addChecklistModal.style.display = "none";

        await loadAllChecklists();

        if (selectedVehicleId) {
            await loadVehicleChecklists(selectedVehicleId);
        }
    } catch (error) {
        console.error("Error creating checklist:", error);
        alert("Failed to create checklist");
    }
});

async function createChecklistItem(name, description) {
    const response = await fetch(
        restapi + "/api/checklists",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                description
            })
        }
    );

    if (!response.ok) {
        throw new Error("Failed to create checklist");
    }

    return response.json();
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
}