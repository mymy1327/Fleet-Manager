const problemRestApi = typeof restapi !== "undefined"
    ? restapi
    : "https://developmenterasmus.kolojar.cz";

let problems = [];
let problemVehicles = [];
let selectedProblemVehicle = null;
let currentProblemSort = "priority-desc";
let editingProblemId = null;

function escapeProblemHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

async function loadProblems() {
    const container = document.getElementById("problemList");
    if (!container) return;

    container.innerHTML = '<div class="inspection-loading">Ladataan ongelmia...</div>';

    try {
        const [problemsResponse, vehiclesResponse] = await Promise.all([
            fetch(problemRestApi + "/api/problems"),
            fetch(problemRestApi + "/api/vehicles")
        ]);

        if (!problemsResponse.ok) {
            throw new Error("Failed to load problems: " + problemsResponse.status);
        }

        if (!vehiclesResponse.ok) {
            throw new Error("Failed to load vehicles: " + vehiclesResponse.status);
        }

        problems = await problemsResponse.json();
        problemVehicles = await vehiclesResponse.json();

        problems = Array.isArray(problems) ? problems : [];
        problemVehicles = Array.isArray(problemVehicles) ? problemVehicles : [];

        renderProblemVehicleFilter();
        renderProblems();
    } catch (error) {
        console.error("Error loading problems:", error);
        container.innerHTML = '<div class="workflow-error">Ongelmien lataaminen epäonnistui.</div>';
    }
}

async function loadProblemsByVehicle(vehicleId) {
    try {
        const response = await fetch(
            problemRestApi + "/api/problems?id_vehicles=" + encodeURIComponent(vehicleId)
        );

        if (!response.ok) {
            throw new Error("Failed to load vehicle problems: " + response.status);
        }

        problems = await response.json();
        problems = Array.isArray(problems) ? problems : [];

        renderProblems();
    } catch (error) {
        console.error("Error loading vehicle problems:", error);

        const container = document.getElementById("problemList");
        if (container) {
            container.innerHTML =
                '<div class="workflow-error">Ongelmien lataaminen epäonnistui.</div>';
        }
    }
}

function getProblemPriorityValue(priority) {
    const values = {
        low: 1,
        medium: 2,
        high: 3,
        critical: 4
    };

    return values[String(priority).toLowerCase()] || 0;
}

function sortProblems(items) {
    const sorted = [...items];

    switch (currentProblemSort) {
        case "priority-asc":
            sorted.sort(
                (a, b) =>
                    getProblemPriorityValue(a.priority) -
                    getProblemPriorityValue(b.priority)
            );
            break;

        case "open":
            sorted.sort((a, b) => {
                const aOpen = String(a.state).toLowerCase() === "open";
                const bOpen = String(b.state).toLowerCase() === "open";
                return Number(bOpen) - Number(aOpen);
            });
            break;

        case "resolved":
            sorted.sort((a, b) => {
                const aResolved =String(a.state).toLowerCase() === "resolved";
                const bResolved =String(b.state).toLowerCase() === "resolved";
                return Number(bResolved) - Number(aResolved);
            });
            break;

        case "priority-desc":
        default:
            sorted.sort(
                (a, b) =>
                    getProblemPriorityValue(b.priority) -
                    getProblemPriorityValue(a.priority)
            );
            break;
    }

    return sorted;
}

function renderProblems() {
    const container = document.getElementById("problemList");
    const count = document.getElementById("problemCount");

    if (!container) return;

    const sortedProblems = sortProblems(problems);

    if (count) {
        count.textContent = sortedProblems.length;
    }

    if (!sortedProblems.length) {
        container.innerHTML =
            '<div class="workflow-empty">Ei ongelmia.</div>';
        return;
    }

    container.innerHTML = sortedProblems.map(problem => {
        const priority = String(problem.priority || "low").toLowerCase();
        const state = String(problem.state || "open").toLowerCase();

        const priorityText = {
            low: "Low",
            medium: "Medium",
            high: "High",
            critical: "Critical"
        };

        const stateText = {
            open: "Open",
            resolved: "Resolved"
        };

        return `
            <article
                class="problem-card priority-${escapeProblemHtml(priority)}"
                data-problem-id="${problem.id_problems}">

                <div class="problem-card-header">
                    <div>
                        <span class="problem-priority-badge">
                            ${priorityText[priority] || priority}
                        </span>

                        <h3>
                            ${escapeProblemHtml(
                                problem.checklist?.name ||
                                "Unknown problem"
                            )}
                        </h3>
                    </div>

                    <span class="problem-state ${state}">
                        ${stateText[state] || state}
                    </span>
                </div>

                <p class="problem-description">
                    ${escapeProblemHtml(
                        problem.checklist?.description ||
                        problem.note ||
                        "No description"
                    )}
                </p>
            </article>
        `;
    }).join("");

    container.querySelectorAll(".problem-card").forEach(card => {
        card.addEventListener("click", () => {
            const problemId = Number(card.dataset.problemId);
            openEditProblem(problemId);
        });
    });
}

function renderProblemVehicleFilter() {
    const list = document.getElementById("vehicleFilterList");
    if (!list) return;

    renderProblemVehicleList(problemVehicles);

    const searchInput = document.getElementById("vehicleSearchInput");

    if (searchInput && !searchInput.dataset.ready) {
        searchInput.dataset.ready = "true";

        searchInput.addEventListener("input", () => {
            const search = searchInput.value.trim().toLowerCase();

            const filtered = problemVehicles.filter(vehicle =>
                String(vehicle.name || "")
                    .toLowerCase()
                    .includes(search)
            );

            renderProblemVehicleList(filtered);
        });
    }
}

function renderProblemVehicleList(vehicles) {
    const list = document.getElementById("vehicleFilterList");
    if (!list) return;

    list.innerHTML = `
        <button type="button" class="vehicle-filter-item ${selectedProblemVehicle === null ? "active" : ""} data-vehicle-id=""> All vehicles</button>

        ${vehicles.map(vehicle => `
            <button
                type="button"
                class="vehicle-filter-item ${
                    Number(selectedProblemVehicle) === Number(vehicle.id_vehicles)
                        ? "active"
                        : ""
                }"
                data-vehicle-id="${vehicle.id_vehicles}">
                ${escapeProblemHtml(vehicle.name || "Unknown vehicle")}
            </button>
        `).join("")}
    `;

    list
        .querySelectorAll(".vehicle-filter-item")
        .forEach(button => {
            button.addEventListener("click", () => {
                const vehicleId = button.dataset.vehicleId;

                if (!vehicleId) {
                    selectedProblemVehicle = null;
                    closeProblemVehicleFilter();
                    loadProblems();
                    return;
                }

                selectedProblemVehicle = Number(vehicleId);
                closeProblemVehicleFilter();
                loadProblemsByVehicle(selectedProblemVehicle);
            });
        });
}

function setupProblemVehicleFilter() {
    const button = document.getElementById("vehicleFilterButton");
    const dropdown = document.getElementById("vehicleFilterDropdown");

    if (!button || !dropdown) return;

    button.addEventListener("click", event => {
        event.stopPropagation();

        dropdown.hidden = !dropdown.hidden;

        if (!dropdown.hidden) {
            const input = document.getElementById("vehicleSearchInput");

            if (input) {
                input.value = "";
                input.focus();
            }

            renderProblemVehicleList(problemVehicles);
        }
    });

    dropdown.addEventListener("click", event => {
        event.stopPropagation();
    });

    document.addEventListener("click", () => {
        closeProblemVehicleFilter();
    });
}

function closeProblemVehicleFilter() {
    const dropdown = document.getElementById("vehicleFilterDropdown");

    if (dropdown) {
        dropdown.hidden = true;
    }
}

function setupProblemSorting() {
    const menu = document.getElementById("problemSortMenu");

    if (!menu) return;

    menu.querySelectorAll("[data-sort]").forEach(button => {
        button.addEventListener("click", () => {
            currentProblemSort = button.dataset.sort;

            const sortButton = document.getElementById("problemSortButton");

            if (sortButton) {
                sortButton.textContent = button.textContent;
            }

            renderProblems();
        });
    });
}

function openEditProblem(problemId) {
    const problem = problems.find(
        item => Number(item.id_problems) === Number(problemId)
    );

    if (!problem) return;

    editingProblemId = problemId;

    const priorityInput = document.getElementById("editProblemPriority");
    const stateInput = document.getElementById("editProblemState");
    const imageBox = document.getElementById("editProblemImageBox");
    const image = document.getElementById("editProblemImage");

    if (priorityInput) {
        priorityInput.value = String(problem.priority || "low").toLowerCase();
    }

    if (stateInput) {
        stateInput.value = String(problem.state || "open").toLowerCase();
    }

    if (imageBox && image) {
        const photo = problem.photo || problem.image || problem.photo_url;

        if (photo) {
            image.src = photo;
            imageBox.classList.add("has-image");
        } else {
            image.src = "";
            imageBox.classList.remove("has-image");
        }
    }

    const modalElement = document.getElementById("editProblemModal");

    if (!modalElement) return;

    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
}
async function updateProblem(problemId, state, priority) {
    await patchProblemColumn(problemId, "state", state);
    await patchProblemColumn(problemId, "priority", priority);
    return true;
}

async function patchProblemColumn(problemId, column, value) {
    const data = {
        [column]: value
    };

    const response = await fetch(
        restapi + "/api/problems/" + problemId,
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

async function saveProblem() {
    const problemId = document.getElementById("editProblemId").value;
    const state = document.getElementById("editProblemState").value;
    const priority = document.getElementById("editProblemPriority").value;

    try {
        await updateProblem(problemId, state, priority);

        // Close modal
        const modal = bootstrap.Modal.getInstance(
            document.getElementById("editProblemModal")
        );
        modal?.hide();

        // Reload problems
        getAllProblems();
    } catch (error) {
        console.error("Failed to update problem:", error);
        alert("Failed to update problem.");
    }
}

function setupProblemEditForm() {
    const form = document.getElementById("editProblemForm");

    if (!form) return;

    form.addEventListener("submit", event => {
        event.preventDefault();
        saveProblem();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    loadProblems();
    setupProblemVehicleFilter();
    setupProblemSorting();
    setupProblemEditForm();
});