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

let editingChecklist = null;

const editChecklistModalElement = document.getElementById("editChecklistModal");
const editChecklistModal = new bootstrap.Modal(editChecklistModalElement);
const editChecklistForm = document.getElementById("editChecklistForm");
const editChecklistName = document.getElementById("editChecklistName");
const editChecklistDescription = document.getElementById("editChecklistDescription");

function openEditChecklistModal(checklist) {
    editingChecklist = checklist;

    editChecklistName.value = checklist.name || "";
    editChecklistDescription.value =
        checklist.description || "";

    editChecklistModal.show();
}


editChecklistForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!editingChecklist) return;

    const name = editChecklistName.value.trim();
    const description = editChecklistDescription.value.trim();

    if (!name) return;

    const saveButton =
        document.getElementById("saveEditChecklistButton");

    try {
        saveButton.disabled = true;

        await updateChecklist(
            editingChecklist.id_checklists,
            name,
            description
        );

        editingChecklist.name = name;
        editingChecklist.description = description;

        const index = allChecklists.findIndex(
            item =>
                Number(item.id_checklists) ===
                Number(editingChecklist.id_checklists)
        );

        if (index !== -1) {
            allChecklists[index].name = name;
            allChecklists[index].description = description;
        }

        renderChecklists();
        editChecklistModal.hide();
        editingChecklist = null;
    } catch (error) {
        console.error("Error updating checklist:", error);
        alert(error.message);
    } finally {
        saveButton.disabled = false;
    }
});

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
vehicleSelect.addEventListener("change", selectVehicle);
function renderVehicles() {
    vehicleSelect.innerHTML = "";

    vehicles.forEach(vehicle => {
        const option = document.createElement("option");
        option.value = vehicle.id_vehicles;
        option.textContent = `${vehicle.name} - ${vehicle.license_plate}`;
        vehicleSelect.appendChild(option);
    });

    if (vehicles.length > 0) {
        vehicleSelect.value = vehicles[0].id_vehicles;
        selectVehicle();
    }
}

async function selectVehicle() {
    console.log("CHANGE EVENT");
    console.log("vehicleSelect.value:", vehicleSelect.value);

    selectedVehicleId = Number(vehicleSelect.value);

    console.log("selectedVehicleId:", selectedVehicleId);

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

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        console.log("Vehicle ID:", vehicleId);
        console.log("API checklists:", data);

        assignedChecklists = Array.isArray(data)
            ? data
            : data.checklists || data.data || [];

        console.log("New assignedChecklists:", assignedChecklists);

        originalAssignedChecklists = assignedChecklists.map(item => ({
            ...item
        }));

        updateAvailableChecklists();

        console.log("Before render:", assignedChecklists);

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
    console.log("RENDERING:", assignedChecklists);

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
            console.log("Rendering checklist:", checklist);
        assignedChecklistList.appendChild(
            createChecklistElement(checklist, false)
        );
    });

    availableChecklists.forEach(checklist => {
        availableChecklistList.appendChild(
            createChecklistElement(checklist, true)
        );
    });
}

function createChecklistElement(checklist, isAvailable) {
    const item = document.createElement("div");

    item.className = "checklist-item";
    item.draggable = true;
    item.dataset.id = checklist.id_checklists;

    item.innerHTML = `
        <div class="checklist-item-content">
            <div class="checklist-item-name">
                ${escapeHtml(checklist.name)}
            </div>

            <div class="checklist-item-description">
                ${escapeHtml(checklist.description || "")}
            </div>

            ${
                isAvailable
                    ? `<button type="button" class="checklist-add-button" aria-label="Add checklist">+</button>`
                    : `<button type="button" class="checklist-remove-button" aria-label="Remove checklist">−</button>`
            }
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

    item.addEventListener("dblclick", event => {
        if (event.target.closest(".checklist-add-button")) {
            return;
        }

        event.stopPropagation();
        openEditChecklistModal(checklist);
    });

    if (isAvailable) {
        const addButton =
            item.querySelector(".checklist-add-button");

        addButton.addEventListener("click", event => {
            event.stopPropagation();

            const exists = assignedChecklists.some(
                current =>
                    Number(current.id_checklists) ===
                    Number(checklist.id_checklists)
            );

            if (exists) {
                return;
            }

            assignedChecklists.push(checklist);

            availableChecklists =
                availableChecklists.filter(
                    current =>
                        Number(current.id_checklists) !==
                        Number(checklist.id_checklists)
                );

            renderChecklists();
        });
    } else {
        const removeButton = item.querySelector(".checklist-remove-button");
        removeButton.addEventListener("click", async event => {
            event.stopPropagation();

            assignedChecklists = assignedChecklists.filter(
                current => Number(current.id_checklists) !== Number(checklist.id_checklists)
            );

            availableChecklists.push(checklist);
            renderChecklists();
        });
    }

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

    const currentIds = new Set(
        assignedChecklists.map(
            item => Number(item.id_checklists)
        )
    );

    const checklistsToAdd = assignedChecklists.filter(
        item => !originalIds.has(Number(item.id_checklists))
    );

    const checklistsToRemove = originalAssignedChecklists.filter(
        item => !currentIds.has(Number(item.id_checklists))
    );

    if (
        checklistsToAdd.length === 0 &&
        checklistsToRemove.length === 0
    ) {
        alert("No changes to save");
        return;
    }

    try {
        submitChecklistButton.disabled = true;

        await Promise.all(
            checklistsToAdd.map(checklist =>
                insertVehicleChecklist(
                    selectedVehicleId,
                    checklist.id_checklists
                )
            )
        );

        await Promise.all(
            checklistsToRemove.map(checklist =>
                removeVehicleChecklist(
                    selectedVehicleId,
                    checklist.id_checklists
                )
            )
        );

        await loadVehicleChecklists(selectedVehicleId);

        alert("Changes saved successfully");
    } catch (error) {
        console.error("Error saving checklist changes:", error);
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
async function removeVehicleChecklist(vehicleId, checklistId) {
    const response = await fetch(
        `${restapi}/api/vehicles/${vehicleId}/${checklistId}`,
        {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            }
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `Failed to remove checklist ${checklistId}: ${response.status} ${errorText}`
        );
    }

    return true;
}
async function updateChecklist(checklistId, name, description) {
    await patchChecklistColumn(checklistId, "name", name);
    await patchChecklistColumn(checklistId, "description", description);
    return true;
}

async function patchChecklistColumn(checklistId, column, value) {
    const data = {
        [column]: value
    };

    const response = await fetch(
        restapi + "/api/checklists/"+ checklistId,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }
    );

    if (response.status !== 200 && response.status !== 201) {
        const errorText = await response.text();
        throw new Error(`${response.status}|${errorText}`);
    }

    return true;
}