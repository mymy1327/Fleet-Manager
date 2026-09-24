// Global inspection data
const restapi = " https://developmenterasmus.kolojar.cz";
let vehicle = null;
let checklists = [];
let inspections = [];
let allQuestions = [];
let currentQuestionIndex = 0;
let answers = [];
let inspectionNote = null;
let previousKilometers = null;
let previousInspection = null;
let vehicleId = null;
let vehicleCode = null;

function escapeHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getVehicle(code, onComplete = null) {
    const xhr = new XMLHttpRequest();

    xhr.open(
        "GET",
        restapi + "/api/vehicles?code=" + encodeURIComponent(code),
        true
    );

    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
            console.error("Vehicle code API error:", xhr.status);
            return;
        }

        try {
            const data = JSON.parse(xhr.responseText);

            if (!Array.isArray(data) || !data.length) {
                console.error("Vehicle not found.");
                return;
            }

            const basicVehicle = data[0];

            if (!basicVehicle.id_vehicles) {
                console.error("Vehicle ID not found.");
                return;
            }

            vehicleId = basicVehicle.id_vehicles;

            console.log("Vehicle ID:", vehicleId);

            getVehicleById(vehicleId, onComplete);

        } catch (error) {
            console.error("JSON parse error:", error);
        }
    };

    xhr.onerror = () => {
        console.error("Vehicle API connection failed.");
    };

    xhr.send();
}
function getVehicleById(id, onComplete = null) {
    const xhr = new XMLHttpRequest();

    xhr.open(
        "GET",
        restapi + "/api/vehicles/" + encodeURIComponent(id),
        true
    );

    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
            console.error("Vehicle ID API error:", xhr.status);
            return;
        }

        try {
            const data = JSON.parse(xhr.responseText);

            console.log("Full vehicle:", data);

            vehicle = data;
            vehicleId = vehicle.id_vehicles;

            checklists = Array.isArray(vehicle.checklist)
                ? vehicle.checklist
                : [];

            previousKilometers = vehicle.km ?? null;

            console.log("Checklists:", checklists);

            if (onComplete) onComplete();

        } catch (error) {
            console.error("JSON parse error:", error);
        }
    };

    xhr.onerror = () => {
        console.error("Vehicle ID API connection failed.");
    };

    xhr.send();
}

//Get Inspection history base on the vehicleId to get the type of last Inspection
function getInspections(vehicleId, onComplete = null) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", restapi + "/api/inspections?id_vehicles=" + vehicleId, true);

    xhr.onload = () => {

        if (xhr.status < 200 || xhr.status >= 300) {
            inspections = [];
            if (onComplete) onComplete();
            return;
        }

        try {
            inspections = JSON.parse(xhr.responseText);
            inspections = Array.isArray(inspections) ? inspections : [];
            inspections.sort((a, b) => new Date(b.date) - new Date(a.date));
            const latest = inspections[0];

            if (latest && latest.type === "departure") {
                previousInspection = latest;
                renderPreviousInspection(latest);
            } else {
                previousInspection = null;
            }

            if (onComplete) onComplete();
        } catch (error) {
            console.error("Inspection processing error:", error);
            inspections = [];
            if (onComplete) onComplete();
        }
    };

    xhr.onerror = () => {
        console.error("Inspection API connection failed.");
        inspections = [];
        if (onComplete) onComplete();
    };

    xhr.send();
}
function formatInspectionDate(date) {
    if (!date) return "-";

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
        return date;
    }

    return value.toLocaleString("fi-FI", {
        dateStyle: "short",
        timeStyle: "short"
    });
}
// Render the lastInspection info on the left
function renderPreviousInspection(inspection) {
    const container = document.getElementById("previousInspection");
    if (!container) return;
    container.style.display = "block";
    container.innerHTML = `
        <div class="previous-inspection-card">
            <h3>Edellinen tarkastus</h3>
            <span class="previous-inspection-status status-label ${Number(inspection.passed) === 1 ? "passed" : "failed"}">${Number(inspection.passed) === 1 ? "Hyväksytty" : "Hylätty"}</span>
            <p><strong>Huomio:</strong> ${inspection.note || "-"}</p>
            <p><strong>Päivä:</strong> ${formatInspectionDate(inspection.date)}</p>
            <p><strong>Kilometrit:</strong> ${inspection.km ?? "-"} km</p>
            <p><strong>Polttoaine:</strong> ${inspection.fuel ?? 0}%</p>
        </div>
    `;
}

// Initialize the inspection page
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
        showErrorMessage("Ajoneuvon tunnistetta ei löytynyt.");
        return;
    }

    vehicleCode = code;

    getVehicle(code, () => {
        if (!vehicle || !checklists.length) {
            showErrorMessage("Ajoneuvon tietoja ei löytynyt.");
            return;
        }

        currentQuestionIndex = 0;

        answers = checklists.map(() => ({
            answer: null,
            kilometer: null,
            fuel: null,
            oilPhoto: null,
            oilPhotoConfirmed: false,
            error: null
        }));

        renderVehicleInformation();
        renderProgress();
        renderQuestion();
        updateNavigationButtons();
        setupNavigation();
        setupBackButton();
        setupSummaryModal();
        setupInspectionNote();

        getInspections(vehicle.id_vehicles);
    });
});


// Render vehicle information
function renderVehicleInformation() {
    document.querySelector(".vehicle-name").textContent = vehicle.name;
    document.querySelector(".vehicle-license").textContent = vehicle.license_plate;

    const vehicleKilometers = document.querySelector(".vehicle-kilometer");
    if (vehicleKilometers) vehicleKilometers.textContent = vehicle.km + " km";
}

// Render the current question
function renderQuestion() {
    const container = document.getElementById("questionContainer");

    if (!container) {
        console.error("#questionContainer not found");
        return;
    }

    const checklist = checklists[currentQuestionIndex];

    if (!checklist) {
        console.error("Checklist not found:", currentQuestionIndex);
        return;
    }

    const questionName = checklist.name || "Tarkastus";
    const description = checklist.description || "";
    const normalizedQuestionName = questionName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

    const isOilQuestion =
    normalizedQuestionName.includes("öljy") ||
    normalizedQuestionName.includes("oil");
    const currentAnswer = answers[currentQuestionIndex]?.answer;
    const hasFault = currentAnswer === "Report Faults";

    container.innerHTML = `
        <div class="question-layout ${hasFault ? "has-fault" : ""}">
            <div class="question-header">
                <span class="material-symbols-outlined question-icon">${getQuestionIcon(questionName)}</span>
                <h2 class="question-title">${escapeHTML(questionName)}</h2>
                <span class="required-label">Pakollinen</span>
            </div>
            ${description ? `<p class="question-description">${escapeHTML(description)}</p>` : ""}
            <div class="question-content">
                ${isOilQuestion && !hasFault ? renderOilPhoto() : ""}
                <div id="answerOptions" class="question-options"></div>
            </div>
            <div id="faultContainer" class="fault-container" style="${hasFault ? "" : "display:none;"}"></div>
        </div>
    `;

    renderAnswerOptions(checklist);

    if (isOilQuestion && !hasFault) {
    setupOilCamera();
}

    restoreCurrentAnswer();
    renderProgress();
    updateNavigationButtons();
    updateInspectionNoteVisibility();
}

function restoreCurrentAnswer() {
    const current =
        answers[currentQuestionIndex];

    if (!current) {
        return;
    }

    if (current.answer && current.answer !== "Report Faults") {
    const selected = document.querySelector(
        `.question-option[data-value="${CSS.escape(String(current.answer))}"]`
    );

    if (selected) {
        selected.classList.add("selected");
    }
}

    if (current.answer === "Report Faults" && current.kilometer != null) {
    const kilometerInput = document.querySelector("#kilometerInput");

    if (kilometerInput) {
        kilometerInput.value = current.kilometer;
    }
}



    if (current.oilPhoto) {

        const oilButton =
            document.getElementById(
                "oilPhotoButton"
            );

        if (oilButton) {

            oilButton.classList.add(
                "photo-selected"
            );

            oilButton.innerHTML = `
                <span class="material-symbols-outlined">
                    check_circle
                </span>

                Kuva otettu
            `;
        }

        /*
         * IMPORTANT:
         * Restore actual image preview
         */
        showQuestionPhotoPreview(
            "oilPhotoPreview",
            current.oilPhoto
        );
    }


    if (
        current.answer === "Report Faults"
    ) {

        const layout =
            document.querySelector(
                ".question-layout"
            );

        if (layout) {
            layout.classList.add(
                "has-fault"
            );
        }

        renderFaultForm();

        /*Restore description*/
        const description =
            document.getElementById(
                "faultDescription"
            );

        if (
            description &&
            current.error
        ) {
            description.value =
                current.error.description || "";
        }

        /*Restore priority*/
        const priority =
            current.error?.priority;

        if (priority) {

            const priorityButton =
                document.querySelector(
                    `[data-priority="${CSS.escape(
                        priority
                    )}"]`
                );

            if (priorityButton) {
                priorityButton.classList.add(
                    "selected"
                );
            }
        }

        /*Restore fault photo*/
        if (
            current.error?.photo
        ) {

            const faultButton =
                document.getElementById(
                    "faultPhotoButton"
                );

            if (faultButton) {

                faultButton.classList.add(
                    "photo-selected"
                );

                faultButton.innerHTML = `
                    <span class="material-symbols-outlined">
                        check_circle
                    </span>

                    Kuva valittu
                `;
            }

            showQuestionPhotoPreview(
                "faultPhotoPreview",
                current.error.photo
            );
        }
    }
}

function getQuestionIcon(questionName) {
    const name = questionName.toLowerCase();

    if (name.includes("öljy")) {
        return "oil_barrel";
    }

    if (name.includes("rengas") || name.includes("renka")) {
        return "tire_repair";
    }

    if (name.includes("valo") || name.includes("valot")) {
        return "lightbulb";
    }

    if (name.includes("jÃ¤Ã¤hdytys") || name.includes("neste")) {
        return "water_drop";
    }

    if (name.includes("kilometri") || name.includes("km")) {
        return "speed";
    }

    if (name.includes("polttoaine") || name.includes("bensiini") || name.includes("diesel")) {
        return "local_gas_station";
    }

    return "fact_check";
}

function renderAnswerOptions(checklist) {
    const container = document.getElementById("answerOptions");

    if (!container) return;

    container.innerHTML = "";

    const questionName = (checklist.name || "").toLowerCase();

    // Kilometer
    if (questionName === "kilometrilukema") {
        renderKilometerInput(container);
        return;
    }

    // Fuel
    if (questionName === "polttoaineen määrä") {
        renderFuelGauge(container);
        return;
    }

   const goodButton = document.createElement("button");

    goodButton.type = "button";
    goodButton.className = "question-option";
    goodButton.dataset.value = "Hyvä";
    goodButton.textContent = "Hyvä";

    goodButton.addEventListener("click", () => {
        selectAnswer("Hyvä");
    });

        container.appendChild(goodButton);

    // Report fault
    const faultButton = document.createElement("button");
    const current = answers[currentQuestionIndex];
    faultButton.type = "button";
    faultButton.className = `question-option report-fault"; ${
        current.answer === "Report Faults" ? "selected" : ""
    }`;
    faultButton.dataset.value = "Report Faults";

    faultButton.innerHTML = `
        <span class="material-symbols-outlined">
            report_problem
        </span>
        Ilmoita vika
    `;

    faultButton.addEventListener("click", () => {

        selectFault();
    });

    container.appendChild(faultButton);
}

function selectAnswer(value) {
    const current = answers[currentQuestionIndex];

    current.answer = value;
    current.error = null;

    // Remove selected
    document.querySelectorAll(".question-option").forEach(button => {
        button.classList.remove("selected");
    });

    // Select current
    const selected = document.querySelector(
        `.question-option[data-value="${CSS.escape(value)}"]`
    );

    if (selected) {
        selected.classList.add("selected");
    }

    const layout = document.querySelector(".question-layout");

    if (layout) {
        layout.classList.remove("has-fault");
    }

    // Hide fault form
    const faultContainer = document.getElementById("faultContainer");

    if (faultContainer) {
        faultContainer.style.display = "none";
        faultContainer.innerHTML = "";
    }

    updateNavigationButtons();
}

function selectFault() {
    const current = answers[currentQuestionIndex];
    const checklist = checklists[currentQuestionIndex];
    const isOilQuestion = (checklist?.name || "").toLowerCase().includes("öljy");

    // If in report fault, click again => cancel
    if (current.answer === "Report Faults") {
        current.answer = current.previousAnswer ?? null;
        current.error = null;

        // If turn back to normal, will ask to take picture of the oil stick
        if (isOilQuestion) {
            current.oilPhoto = null;
            current.oilPhotoConfirmed = false;
        }

        renderQuestion();
        return;
    }

    current.previousAnswer = current.answer;
    current.answer = "Report Faults";

    if (!current.error) {
        current.error = {
            photo: null,
            description: "",
            priority: null
        };
    }

    if (isOilQuestion) {
        current.oilPhoto = null;
        current.oilPhotoConfirmed = false;
    }

    renderQuestion();
    updateNavigationButtons();
}

function renderFaultForm() {
    const container = document.getElementById("faultContainer");

    if (!container) return;

    container.style.display = "block";

    container.innerHTML = `
        <h3 class="fault-title">Report</h3>
        <div class="photo-input-wrapper">
            <p class="photo-description">Ota kuva viasta.</p>
            <button type="button" class="photo-camera-button" id="faultPhotoButton">
                <span class="material-symbols-outlined">photo_camera</span>
                Ota kuva viasta
            </button>
            <div id="faultPhotoPreview" class="question-photo-preview"></div>
        </div>
        <textarea id="faultDescription" class="fault-description" placeholder="Kuvaile vika..."></textarea>
        <div class="fault-priority">
            <p class="fault-label">Vian prioriteetti</p>
            <button type="button" class="question-option" data-priority="low">Matala</button>
            <button type="button" class="question-option" data-priority="medium">Keskitaso</button>
            <button type="button" class="question-option" data-priority="high">Korkea</button>
            <button type="button" class="question-option" data-priority="critical">Kriittinen</button>
        </div>
    `;

    setupFaultForm();
    setupFaultCamera();
}

function setupFaultCamera() {
    const button = document.getElementById("faultPhotoButton");

    if (!button) {
        console.error("#faultPhotoButton not found");
        return;
    }

    button.onclick = () => {

        openCamera("fault", (picture) => {

            if (!answers[currentQuestionIndex].error) {
                answers[currentQuestionIndex].error = {};
            }

            answers[currentQuestionIndex].error.photo = picture;
            answers[currentQuestionIndex].error.photoConfirmed = true;

            showQuestionPhotoPreview("faultPhotoPreview", picture);

            button.classList.add("photo-selected");
            button.innerHTML = `
                <span class="material-symbols-outlined">check_circle</span>
                Kuva valittu
            `;

            updateNavigationButtons();
        });
    };
}

function setupFaultForm() {
    const description = document.getElementById("faultDescription");

    if (description) {
        description.addEventListener("input", () => {
            if (!answers[currentQuestionIndex].error) {
                answers[currentQuestionIndex].error = {};
            }

            answers[currentQuestionIndex].error.description = description.value;
            updateNavigationButtons();
        });
    }

    document.querySelectorAll("[data-priority]").forEach(button => {
        button.addEventListener("click", () => {
            document.querySelectorAll("[data-priority]").forEach(item => {
                item.classList.remove("selected");
            });

            button.classList.add("selected");

            if (!answers[currentQuestionIndex].error) {
                answers[currentQuestionIndex].error = {};
            }

            answers[currentQuestionIndex].error.priority = button.dataset.priority;
            updateNavigationButtons();
        });
    });
}

function renderOilPhoto() {
    return `
        <div class="photo-input-wrapper">
            <p class="photo-description">Ota kuva moottoriöljyn mittatikusta. Kuva on pakollinen.</p>
            <button type="button" class="photo-camera-button" id="oilPhotoButton">
                <span class="material-symbols-outlined">photo_camera</span>
                Ota kuva mittatikusta
            </button>
            <div id="oilPhotoPreview" class="question-photo-preview"></div>
            <p class="photo-required">* Pakollinen kuva</p>
        </div>
    `;
}

function setupOilCamera() {
    const button = document.getElementById("oilPhotoButton");

    if (!button) return;

    button.onclick = () => {
        openCamera("oil", (picture) => {
            answers[currentQuestionIndex].oilPhoto = picture;
            answers[currentQuestionIndex].oilPhotoConfirmed = true;
            showQuestionPhotoPreview("oilPhotoPreview", picture);
        });
    };
}

function showQuestionPhotoPreview(elementId, picture) {
    const container =
        document.getElementById(elementId);

    if (!container || !picture) {
        return;
    }

    const imageUrl =
        getPhotoURL(picture);

    container.innerHTML = `
        <div class="question-photo-preview-content">

            <img
                src="${escapeHTML(imageUrl)}"
                alt="Otettu kuva"
            >

            <span class="photo-success">
                Kuva valittu
            </span>

        </div>
    `;
}

function setupOilPhoto() {
    const input = document.getElementById("oilPhotoInput");
    const button = document.getElementById("oilPhotoButton");

    if (!input || !button) return;

    input.addEventListener("change", () => {
        const file = input.files[0];

        if (!file) return;

        answers[currentQuestionIndex].oilPhoto = file;

        button.classList.add("photo-selected");

        button.innerHTML = `
            <span class="material-symbols-outlined">
                check_circle
            </span>
            Kuva otettu
        `;

        updateNavigationButtons();
    });
}

function renderProgress() {
    const questionNumber = document.getElementById("questionNumber");
    const progressPercent = document.getElementById("progressPercent");
    const progressSegments = document.getElementById("progressSegments");

    if (!questionNumber || !progressPercent || !progressSegments) {
        console.error("Progress elements not found.");
        return;
    }

    const total = checklists.length;

    if (total === 0) {
        questionNumber.textContent = "0 / 0";
        progressPercent.textContent = "0%";
        progressSegments.innerHTML = "";
        return;
    }

    const current = currentQuestionIndex + 1;

    const percentage = Math.round((current / total) * 100);

    // Question number
    questionNumber.textContent = `${current} / ${total}`;

    // Percentage
    progressPercent.textContent = `${percentage}%`;

    // Clear old segments
    progressSegments.innerHTML = "";

    // Create one segment for each question
    for (let i = 0; i < total; i++) {
        const segment = document.createElement("div");

        segment.classList.add("progress-segment");

        /*
         * Active:
         * questions already reached
         */
        if (i <= currentQuestionIndex) {
            segment.classList.add("active");
        }

        /*
         * Current question
         */
        if (i === currentQuestionIndex) {
            segment.classList.add("current");
        }

        progressSegments.appendChild(segment);
    }
}

function updateNavigationButtons() {
    const previousButton = document.getElementById("previousButton");
    const nextButton = document.getElementById("nextButton");

    if (previousButton) {
        previousButton.disabled = currentQuestionIndex === 0;
    }

    if (nextButton) {
        if (currentQuestionIndex === checklists.length - 1) {
            nextButton.textContent = "Valmis";
        } else {
            nextButton.textContent = "Seuraava";
        }
    }
}

function setupNavigation() {
    const previousButton =document.getElementById("previousButton");

    const nextButton =document.getElementById("nextButton");

    if (previousButton) {
        previousButton.onclick =previousQuestion;
    }

    if (nextButton) {
        nextButton.onclick =nextQuestion;
    }
}

function previousQuestion() {
    if (currentQuestionIndex <= 0) {
        return;
    }

    currentQuestionIndex--;

    renderQuestion();
    renderProgress();
    updateNavigationButtons();

    window.scrollTo({top: 0,behavior: "smooth"});
}

function nextQuestion() {
    if (!validateCurrentQuestion()) {
        return;
    }

    if (currentQuestionIndex <checklists.length - 1) {
        currentQuestionIndex++;

        renderQuestion();
        renderProgress();
        updateNavigationButtons();

        window.scrollTo({top: 0,behavior: "smooth"});
        return;
    }
    // Last question
    finishInspection();
}

function validateCurrentQuestion() {
    const checklist = checklists[currentQuestionIndex];
    const current = answers[currentQuestionIndex];

    if (!checklist || !current) return false;

    const name = (checklist.name || "").toLowerCase();

    // Kilometer validation
    if (name === "kilometrilukema") {
        const km = current.kilometer;

        if (km === null || km === undefined || km === "") {
            alert("Syötä kilometrilukema.");
            return false;
        }

        if (Number(km) < Number(previousKilometers)) {
            alert(`Kilometrilukema ei voi olla pienempi kuin edellinen lukema (${previousKilometers} km).`);
            return false;
        }

        if (current.answer === "Report Faults") return validateFault(current);

        return true;
    }

    // Fuel validation
    if (name === "polttoaineen määrä") {
        if (current.fuel === null || current.fuel === undefined) {
            alert("Valitse polttoaineen määrä.");
            return false;
        }

        if (current.answer === "Report Faults") return validateFault(current);

        return true;
    }

    // General answer validation
    if (!current.answer) {
        alert("Valitse vastaus ennen jatkamista.");
        return false;
    }

        // Oil photo is required only in normal Oil mode.
    if (
        name.includes("öljy") &&
        current.answer !== "Report Faults" &&
        !current.oilPhoto
    ) {
        alert("Ota kuva moottoriöljyn mittatikusta.");
        return false;
    }

    // Fault validation
    if (current.answer === "Report Faults") {
        return validateFault(current);
    }

    return true;
}

function validateFault(current) {
    if (!current.error?.photo) {
        alert("Ota kuva viasta ennen jatkamista.");
        return false;
    }

    if (!current.error.description?.trim()) {
        alert("Kuvaile vika ennen jatkamista.");
        return false;
    }

    if (!current.error.priority) {
        alert("Valitse vian prioriteetti.");
        return false;
    }

    return true;
}
function finishInspection() {
    if (!validateCurrentQuestion()) {
        return;
    }

    const inspectionResult = {
        vehicleId: vehicle?.id_vehicles || null,

        vehicle:
            vehicle?.name ||
            document.querySelector(".vehicle-name")?.textContent ||
            "",

        vehicleType:
            vehicle?.type || "",

        licensePlate:
            vehicle?.license_plate ||
            vehicle?.plate ||
            "",

        checklists: checklists.map(
            checklist => ({
                checklistId:
                    checklist.id_checklists,

                vehicleId:
                    checklist.id_vehicles,

                name:
                    checklist.name,

                description:
                    checklist.description || ""
            })
        ),

        answers: checklists.map(
            (checklist, index) => ({
                checklistId:
                    checklist.id_checklists,

                question:
                    checklist.name,

                description:
                    checklist.description || "",

                answer:
                    answers[index] || null
            })
        )
    };


    /*
     * Show fireworks when inspection reaches 100%
     */
    showFireworks();

    /*
     * Small delay so fireworks can appear
     * before summary opens
     */
    setTimeout(() => {
        showSummaryModal(inspectionResult);
    }, 500);
}

function showSummaryModal(inspectionResult) {
    const modal = document.getElementById("summaryModal");

    if (!modal) {
        console.error("Summary modal was not found.");
        return;
    }

    /*
     * Vehicle information
     */
    const vehicleElement = modal.querySelector(".summary-vehicle-name");
    const vehicleDetails = modal.querySelector(".summary-vehicle-details");

    const plate = inspectionResult.licensePlate
        ? inspectionResult.licensePlate
        : "";

    if (vehicleElement) {
        vehicleElement.textContent = inspectionResult.vehicle || "Ajoneuvo";
    }

    if (vehicleDetails) {
        vehicleDetails.textContent = plate
            ? `Rekisterinumero: ${plate}`
            : "";
    }

    /*
     * Answers
     */
    const answersContainer = modal.querySelector(".summary-answers");

    if (answersContainer) {
        answersContainer.innerHTML = "";

        inspectionResult.answers.forEach((item, index) => {
            const card = document.createElement("div");
            card.classList.add("summary-answer");

            /*
             * Question number
             */
            const questionNumber = document.createElement("div");

            questionNumber.classList.add("summary-question-number");
            questionNumber.textContent = index + 1;

            card.appendChild(questionNumber);

            /*
             * Question content
             */
            const answerContent = document.createElement("div");

            answerContent.classList.add("summary-answer-content");

            /*
             * Question title
             */
            const title = document.createElement("p");

            title.classList.add("summary-question");
            title.textContent = item.question || "Tarkastus";

            answerContent.appendChild(title);

            /*
             * Description
             */
            if (item.description) {
                const description = document.createElement("p");

                description.classList.add("summary-question-description");
                description.textContent = item.description;

                answerContent.appendChild(description);
            }

            /*
             * Answer
             */
            const answerText = document.createElement("p");

            answerText.classList.add("summary-value");

            answerText.innerHTML = `<strong>Vastaus:</strong> ${
                escapeHTML(formatSummaryAnswer(item.answer))
            }`;

            answerContent.appendChild(answerText);

            /*
             * Add content to card
             */
            card.appendChild(answerContent);

            /*
             * Oil photo
             */
            if (item.answer?.oilPhoto) {
                appendSummaryPhoto(
                    card,
                    item.answer.oilPhoto,
                    "Öljymittatikun kuva"
                );
            }

            /*
             * Normal photo
             */
            if (item.answer?.photo) {
                appendSummaryPhoto(card, item.answer.photo);
            }

            /*
             * Fault
             */
            if (item.answer?.error) {
                const fault = item.answer.error;

                const faultBox = document.createElement("div");

                faultBox.classList.add("summary-fault");

                const faultTitle = document.createElement("strong");

                faultTitle.textContent = "Vika";

                faultBox.appendChild(faultTitle);

                /*
                 * Description
                 */
                if (fault.description) {
                    const description = document.createElement("p");

                    description.textContent = `Kuvaus: ${fault.description}`;

                    faultBox.appendChild(description);
                }

                /*
                 * Priority
                 */
                if (fault.priority) {
                    const priority = document.createElement("p");

                    priority.textContent = `Prioriteetti: ${
                        getPriorityLabel(fault.priority)
                    }`;

                    faultBox.appendChild(priority);
                }

                card.appendChild(faultBox);

                /*
                 * Fault photo
                 */
                if (fault.photo) {
                    appendSummaryPhoto(
                        card,
                        fault.photo,
                        "Kuva viasta"
                    );
                }
            }

            answersContainer.appendChild(card);
        });
    }

    /*
     * Confirmation checkbox
     */
    const confirmation = modal.querySelector("#summary-confirmation");

    /*
     * Submit button
     */
    const submitButton = modal.querySelector("#summary-submit");

    if (confirmation) {
        confirmation.checked = false;

        confirmation.onchange = () => {
            if (submitButton) {
                submitButton.disabled = !confirmation.checked;
            }
        };
    }

    if (submitButton) {
        submitButton.disabled = true;

        submitButton.onclick = () => {
            if (!confirmation || !confirmation.checked) {
                return;
            }

            submitInspection(inspectionResult);
        };
    }

    /*
     * Show modal
     */
    modal.classList.add("show");
}

function formatSummaryAnswer(answer) {
    if (!answer) {
        return "Ei vastausta";
    }

    if (
        answer.answer !== undefined &&
        answer.answer !== null &&
        answer.answer !== ""
    ) {
        return String(answer.answer);
    }

    if (
        answer.value !== undefined &&
        answer.value !== null &&
        answer.value !== ""
    ) {
        return String(answer.value);
    }

    return "Ei vastausta";
}
function appendSummaryPhoto(container, photo, label = "Kuva") {
    if (!photo) return;

    const photoContainer = document.createElement("div");
    photoContainer.className = "summary-photo-container";

    const image = document.createElement("img");
    image.className = "summary-photo-image";
    image.src = getPhotoURL(photo);
    image.alt = label;
    image.title = "Klikkaa nähdäksesi kuvan suurempana";

    image.onclick = () => {
        openPhotoViewer(photo);
    };

    const name = document.createElement("span");
    name.className = "summary-photo-name";
    name.textContent = label;

    photoContainer.appendChild(image);
    photoContainer.appendChild(name);
    container.appendChild(photoContainer);
}

function getPriorityLabel(priority) {
    const labels = {
        low: "Matala",
        medium: "Keskitaso",
        high: "Korkea",
        critical: "Kriittinen"
    };

    return labels[priority] || priority || "Ei määritetty";
}

function setupBackButton() {
    const backButton = document.querySelector(".back-button");
    if (!backButton) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    backButton.onclick = () => {
        if (code) {
            window.location.href = `studentForm.html?code=${encodeURIComponent(code)}`;
        } else {
            window.history.back();
        }
    };
}

function setupSummaryModal() {
    const closeButton = document.getElementById("summary-close");

    if (closeButton) {
        closeButton.onclick = closeSummaryModal;
    }
}

function closeSummaryModal() {
    const modal = document.getElementById("summaryModal");

    if (modal) {
        modal.classList.remove("show");
    }
}

function renderKilometerInput(container) {
    const wrapper = document.createElement("div");

    wrapper.className = "kilometer-input-wrapper";

    const current =
        answers[currentQuestionIndex];

    const currentKm =
        current?.kilometer ?? "";

    const previousKm =
        getPreviousKilometers();

    wrapper.innerHTML = `
        <label for="kilometerInput">
            Nykyinen kilometrilukema
        </label>

        <div class="kilometer-input-row">
            <input
                type="number"
                id="kilometerInput"
                min="0"
                step="1"
                placeholder="Syötä km"
                value="${escapeHTML(currentKm)}"
            >

            <span>km</span>
        </div>

        <div class="last-inspection-kilometer">
            <span>
                Edellisen tarkastuksen lukema
            </span>

            <strong>
                ${
                    previousKm !== null &&
                    previousKm !== undefined
                        ? `${previousKm} km`
                        : "-"
                }
            </strong>
        </div>

        <div
            id="kilometerComparison"
            class="kilometer-comparison"
        ></div>

        <div class="kilometer-fault-section">

            <p class="kilometer-fault-question">
                Onko kilometrilukemassa tai ajoneuvossa ongelma?
            </p>

            <button
                type="button"
                class="question-option report-fault kilometer-report-fault"
                id="kilometerFaultButton"
            >
                <span class="material-symbols-outlined">
                    report_problem
                </span>

                Ilmoita vika
            </button>

        </div>

            <div
        id="faultContainer"
        class="fault-container"
        style="display:none;"
    ></div>
    `;

    container.appendChild(wrapper);

    const input =
        document.getElementById("kilometerInput");

    if (!input) return;

    /*
     * Restore comparison
     */
    updateKilometerComparison();

    /*
     * Save kilometer
     */
    input.addEventListener("input", () => {

        const value =
            input.value.trim();

        current.kilometer =
            value === ""
                ? null
                : Number(value);

        /*
         * answer remains the kilometer
         * unless fault is selected
         */
        if (
            current.answer !== "Report Faults"
        ) {
            current.answer =
                current.kilometer;
        }

        updateKilometerComparison();

        updateNavigationButtons();
    });

    /*
     * Fault button
     */
    const faultButton =
        document.getElementById(
            "kilometerFaultButton"
        );

    if (faultButton) {
        faultButton.addEventListener(
            "click",
            () => {
                selectFault();
            }
        );
    }

    /*
     * Restore existing fault
     */
    if (
        current.answer === "Report Faults"
    ) {
        renderFaultForm();
    }
}

function updateKilometerComparison() {
    const input =
        document.getElementById("kilometerInput");

    const comparison =
        document.getElementById("kilometerComparison");

    if (!input || !comparison) {
        return;
    }

    const value = input.value.trim();

    if (value === "") {
        comparison.innerHTML = "";
        return;
    }

    const currentKm = Number(value);
    const previousKm = Number(previousKilometers);

    /*
     * No previous kilometer available
     */
    if (
        previousKilometers === null ||
        previousKilometers === undefined ||
        Number.isNaN(previousKm)
    ) {
        comparison.innerHTML = `
            <div class="km-info">
                Kilometrilukema tallennetaan.
            </div>
        `;

        return;
    }

    const difference = currentKm - previousKm;

    /*
     * Current km is smaller than old km
     */
    if (difference < 0) {
        comparison.innerHTML = `
            <div class="km-warning">
                <span class="material-symbols-outlined">
                    warning
                </span>

                Kilometrilukema ei voi olla pienempi kuin
                ${previousKm.toLocaleString("fi-FI")} km.
            </div>
        `;

        return;
    }

    /*
     * Correct kilometer
     */
    comparison.innerHTML = `
        <div class="km-success">
            <span class="material-symbols-outlined">
                check_circle
            </span>

            +${difference.toLocaleString("fi-FI")} km
            edellisestä tarkastuksesta
        </div>
    `;
}
function getPreviousKilometers() {
    return previousKilometers ?? "-";
}

function renderFuelGauge(container) {
    const wrapper = document.createElement("div");

    wrapper.className = "fuel-gauge-wrapper";

    const current =
        answers[currentQuestionIndex];

    /*
     * Restore previous value
     *
     * If no previous value exists,
     * default to 50.
     */
    const savedValue =
        current?.fuel !== null &&
        current?.fuel !== undefined
            ? Number(current.fuel)
            : 50;

    wrapper.innerHTML = `
        <div class="fuel-gauge">

            <svg
                class="fuel-gauge-svg"
                viewBox="0 0 200 120"
            >

                <path
                    class="fuel-gauge-background"
                    d="M 20 100 A 80 80 0 0 1 180 100"
                />

                <path
                    class="fuel-gauge-fill"
                    id="fuelGaugeFill"
                    d="M 20 100 A 80 80 0 0 1 180 100"
                />

                <text
                    x="100"
                    y="78"
                    text-anchor="middle"
                    id="fuelGaugeValue"
                    class="fuel-gauge-value"
                >
                    ${savedValue}%
                </text>

            </svg>

            <div class="fuel-gauge-icon">
                <span class="material-symbols-outlined">
                    local_gas_station
                </span>
            </div>

        </div>

        <div class="fuel-slider-wrapper">

            <div class="fuel-slider-labels">
                <span>0 %</span>

                <strong id="fuelSliderValue">
                    ${savedValue} %
                </strong>

                <span>100 %</span>
            </div>

            <input
                type="range"
                id="fuelSlider"
                min="0"
                max="100"
                value="${savedValue}"
                step="1"
            >

        </div>

        <div class="fuel-fault-section">

            <p class="fuel-fault-question">
                Onko polttoainejärjestelmässä ongelma?
            </p>

            <button
                type="button"
                class="question-option report-fault"
                id="fuelFaultButton"
            >
                <span class="material-symbols-outlined">
                    report_problem
                </span>

                Ilmoita vika
            </button>

        </div>
    `;

    container.appendChild(wrapper);


    if (
        current.fuel === null ||
        current.fuel === undefined
    ) {
        current.fuel = savedValue;
        current.answer = savedValue;
    }

    updateFuelGauge(savedValue);

    const slider =
        document.getElementById("fuelSlider");

    if (slider) {

        slider.addEventListener("input", () => {

            const value =
                Number(slider.value);

            current.fuel = value;
            current.answer = value;

            updateFuelGauge(value);

            updateNavigationButtons();
        });
    }


    const fuelFaultButton =
        document.getElementById(
            "fuelFaultButton"
        );

    if (fuelFaultButton) {

        fuelFaultButton.addEventListener(
            "click",
            () => {
                selectFault();
            }
        );
    }

    if (current.answer === "Report Faults") {
        renderFaultForm();
    }
}

function updateFuelGauge(value) {
    const gaugeValue = document.getElementById("fuelGaugeValue");
    const sliderValue = document.getElementById("fuelSliderValue");
    const gaugeFill = document.getElementById("fuelGaugeFill");

    if (!gaugeValue || !sliderValue || !gaugeFill) {
        return;
    }

    gaugeValue.textContent = `${value}%`;
    sliderValue.textContent = `${value} %`;

    const length = gaugeFill.getTotalLength();
    const progress = length * (value / 100);

    gaugeFill.style.strokeDasharray = `${progress} ${length}`;
}

function showFireworks() {
    const container = document.createElement("div");

    container.className = "fireworks-container";
    container.style.pointerEvents = "none";

    document.body.appendChild(container);

    // Create large central fireworks
    for (let i = 0; i < 6; i++) {
        setTimeout(() => {
            createFireworkBurst(container);
        }, i * 280);
    }

    setTimeout(() => {
        container.remove();
    }, 5000);
}

function createFireworkBurst(container) {
    const burst = document.createElement("div");

    burst.className = "firework-burst";

    // Keep fireworks around the center of the screen
    const x = 35 + Math.random() * 30;
    const y = 25 + Math.random() * 30;

    burst.style.left = `${x}vw`;
    burst.style.top = `${y}vh`;

    container.appendChild(burst);

    // Create many particles
    const particleCount = 48;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("span");

        particle.className = "firework-particle";

        const angle = (360 / particleCount) * i;

        // Large explosion radius
        const distance = 180 + Math.random() * 220;

        // Large particles
        const size = 7 + Math.random() * 5;

        particle.style.setProperty("--angle", `${angle}deg`);
        particle.style.setProperty("--distance", `${distance}px`);

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        burst.appendChild(particle);
    }

    setTimeout(() => {
        burst.remove();
    }, 2100);
}

function createFirework(container) {
    const firework = document.createElement("div");

    firework.className = "firework";

    firework.style.left = `${20 + Math.random() * 60}%`;
    firework.style.top = `${15 + Math.random() * 40}%`;

    container.appendChild(firework);

    for (let i = 0; i < 24; i++) {
        const particle = document.createElement("span");

        particle.className = "firework-particle";

        const angle = (Math.PI * 2 * i) / 24;
        const distance = 60 + Math.random() * 80;

        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        particle.style.setProperty("--x", `${x}px`);
        particle.style.setProperty("--y", `${y}px`);

        firework.appendChild(particle);
    }

    setTimeout(() => {
        firework.remove();
    }, 1400);
}

function showErrorMessage(message) {
    const container = document.getElementById("questionContainer");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const error = document.createElement("div");

    error.classList.add("inspection-error");
    error.textContent = message;

    container.appendChild(error);
}
function getPhotoURL(photo) {
    if (!photo) {
        return "";
    }

    if (
        photo instanceof Blob ||
        photo instanceof File
    ) {
        return URL.createObjectURL(photo);
    }

    return String(photo);
}

function openPhotoViewer(photo) {
    if (!photo) return;

    const viewer = document.getElementById("photoViewer");
    const image = document.getElementById("photoViewerImage");
    const closeButton = document.getElementById("photoViewerClose");

    if (!viewer || !image) return;

    image.src = getPhotoURL(photo);
    viewer.classList.add("show");

    closeButton.onclick = () => {
        viewer.classList.remove("show");
        image.src = "";
    };

    viewer.onclick = event => {
        if (event.target === viewer) {
            viewer.classList.remove("show");
            image.src = "";
        }
    };
}

// SUBMIT PART //
function createFile(blob) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", blob, "inspection.jpg");

        const xhr = new XMLHttpRequest();
        xhr.open("POST", restapi + "/api/files", true);

        xhr.onload = () => {
            if (xhr.status < 200 || xhr.status >= 300) {
                reject(new Error("File upload failed: " + xhr.status));
                return;
            }

            try {
                const data = JSON.parse(xhr.responseText);
                resolve(data.new_id);
            } catch (error) {
                reject(new Error("Invalid file response."));
            }
        };

        xhr.onerror = () => reject(new Error("File upload connection failed."));
        xhr.send(formData);
    });
}

function createInspection(id_vehicles, passed, note, id_users, km, fuel, type, oil_picture, link) {
    return new Promise((resolve, reject) => {
        const data = {
            id_vehicles,
            passed,
            note,
            id_users,
            km,
            fuel,
            type,
            oil_picture,
            link
        };

        const xhr = new XMLHttpRequest();
        xhr.open("POST", restapi + "/api/inspections", true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onload = () => {

            if (xhr.status < 200 || xhr.status >= 300) {
                reject(new Error("Inspection creation failed: " + xhr.status));
                return;
            }

            try {
                const data = JSON.parse(xhr.responseText);
                resolve(data.new_id);
            } catch (error) {
                reject(new Error("Invalid inspection response."));
            }
        };

        xhr.onerror = () => reject(new Error("Inspection connection failed."));
        xhr.send(JSON.stringify(data));
    });
}

function createProblem(inspectionId, checklistId, note, fileId, priority) {
    return new Promise((resolve, reject) => {
        const data = {
            id_inspections: inspectionId,
            id_checklists: checklistId,
            note,
            id_files: fileId,
            priority
        };

        const xhr = new XMLHttpRequest();
        xhr.open("POST", restapi + "/api/problems", true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onload = () => {

            if (xhr.status < 200 || xhr.status >= 300) {
                reject(new Error("Problem creation failed: " + xhr.status));
                return;
            }

            resolve(JSON.parse(xhr.responseText));
        };

        xhr.onerror = () => reject(new Error("Problem connection failed."));
        xhr.send(JSON.stringify(data));
    });
}
function getInspectionPassed() {
    return answers.some(
        answer => answer?.answer === "Report Faults"
    )
        ? 0
        : 1;
}
function updateInspectionNoteVisibility() {
    const container =
        document.getElementById("inspectionNoteContainer");

    if (!container) return;

    const isLastQuestion =
        currentQuestionIndex === checklists.length - 1;

    container.style.display =
        isLastQuestion ? "block" : "none";
}
function setupInspectionNote() {
    const noteInput =
        document.getElementById("inspectionNote");

    if (!noteInput) return;

    noteInput.value = inspectionNote;

    noteInput.addEventListener("input", () => {
        inspectionNote = noteInput.value;
    });
}
function validateInspectionAnswers() {
    for (let i = 0; i < checklists.length; i++) {
        if (!answers[i]?.answer) {
            currentQuestionIndex = i;
            renderQuestion();
            updateNavigationButtons();
            alert("Vastaa kaikkiin tarkastuskysymyksiin.");
            return false;
        }
    }

    return true;
}
function getAnswerByChecklistName(name) {
    const index = checklists.findIndex(item => item.name === name);
    if (index === -1) return null;

    const current = answers[index];

    if (!current) return null;

    if (name === "Kilometrilukema") {
        return current.kilometer;
    }

    if (name === "Polttoaineen määrä") {
        return current.fuel;
    }

    return current.answer;
}
function inspectionSubmitDate() {
    return new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
}
function getInspectionType() {
    const previousInspection = document.getElementById("previousInspection");

    if (previousInspection && previousInspection.innerHTML.trim() !== "") {
        return "return";
    }

    return "departure";
}
async function submitInspection (inspectionResult) {
    if (!validateInspectionAnswers()) return;
    const submitButton = document.getElementById("summary-submit");

    if(submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Lähetetään...";
    }
    const userId = await GetLoggedInUserID();

        if(userId == null) {
            alert("Käyttäjää ei löytynyt. Kirjaudu uudelleen.");
            return;
        }
    const vehicleId = vehicle?.id_vehicles;
    try {
        const type = getInspectionType();
        let link = null;

        if (type === "return") {
            const departure = inspections
                .filter(item => item.type === "departure")
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

            if (!departure) {
                alert("Aikaisempaa lähtötarkastusta ei löytynyt.");
                return;
            }

            link = departure.id_inspections;
        }
        const km = getAnswerByChecklistName("Kilometrilukema") ?? vehicle.km;
        const fuel = getAnswerByChecklistName("Polttoaineen määrä") ?? 0;
        const note = inspectionNote.trim() || null;
        const passed = getInspectionPassed();

        let oilPictureId = 0;

        const oilIndex = checklists.findIndex (
            checklist => checklist.name === "Moottoriöljyn taso"
        );

        if (oilIndex !== -1 ) {
            const oilAnswer = answers[oilIndex];

                const oilPhoto =
            oilAnswer?.answer === "Report Faults"
                ? oilAnswer?.error?.photo
                : oilAnswer?.oilPhoto;

        if (oilPhoto) {
            oilPictureId = await createFile(oilPhoto);
    }
        }

        const inspectionId = await createInspection(
            vehicleId,
            passed,
            note,
            userId,
            km,
            fuel,
            type,
            oilPictureId,
            link
        );


        for (let i = 0; i < checklists.length; i++) {
            const checklist = checklists[i];
            const answer = answers[i];

            if (!answer?.error) continue;

            if (!answer.error.photo) {
                throw new Error(`Kuvavika puuttuu: ${checklist.name}`);
            }

            let fileId;

            const isOilChecklist =(checklist.name || "").toLowerCase().includes("öljy");

            if (isOilChecklist && answer.answer === "Report Faults") {
                fileId = oilPictureId;
            } else {
                fileId = await createFile(answer.error.photo);
            }

            await createProblem(
                inspectionId,
                checklist.id_checklists,
                answer.error.description || answer.answer,
                fileId,
                answer.error.priority || "medium"
            );
        }

        alert("Tarkastus lähetetty onnistuneesti.");
        window.location.href = `studentForm.html?code=${encodeURIComponent(vehicleCode)}`;


    } catch (error) {
        console.error("Inspection submission error:", error);
        alert("Tarkastuksen lähettäminen epäonnistui.");

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Lähetä tarkastus";
        }
    }
}
