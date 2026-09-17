// Global inspection data
let vehicle = null;
let checklists = [];
let allQuestions = [];
let currentQuestionIndex = 0;
let answers = [];
let previousKilometers = null;

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

// Initialize the inspection page
document.addEventListener("DOMContentLoaded", () => {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const vehicleId =
        params.get("id");

    console.log(
        "Vehicle ID:",
        vehicleId
    );

    if (!vehicleId) {

        console.error(
            "Vehicle ID not found in URL"
        );

        showErrorMessage(
            "Ajoneuvon tunnistetta ei löytynyt."
        );

        return;
    }

    loadInspectionData(vehicleId);
});


// Load all inspection data
async function loadInspectionData(vehicleId) {

    try {

        await loadVehicleData(vehicleId);

        await loadChecklistData(vehicleId);

        console.log(
            "Vehicle loaded:",
            vehicle
        );

        console.log(
            "Checklists loaded:",
            checklists
        );

        if (!vehicle) {

            throw new Error(
                "Vehicle data is missing."
            );
        }

        if (
            !Array.isArray(checklists) ||
            checklists.length === 0
        ) {

            throw new Error(
                "No checklists found for this vehicle."
            );
        }

        currentQuestionIndex = 0;

        answers = checklists.map(() => ({
            answer: null,
            oilPhoto: null,
            error: null
        }));

        renderVehicleInformation();

        renderProgress();

        renderQuestion();

        updateNavigationButtons();

        setupNavigation();

        setupBackButton();

        setupSummaryModal();

        console.log(
            "Inspection page initialized successfully."
        );

    } catch (error) {

        console.error(
            "Inspection initialization error:",
            error
        );

        showErrorMessage(
            "Tarkastuksen tietojen lataaminen epäonnistui."
        );
    }
}

// Load vehicle information
// Load vehicle information
async function loadVehicleData(vehicleId) {

    const response = await fetch(
        `http://localhost/api/vehicles.php?vehicle=${vehicleId}`
    );

    if (!response.ok) {
        throw new Error(
            `Vehicle API error: ${response.status}`
        );
    }

    vehicle = await response.json();

    console.log("Vehicle:", vehicle);
}


// Load checklist items assigned to the vehicle
async function loadChecklistData(vehicleId) {

    const response = await fetch(
        `http://localhost/api/checklists.php?vehicle=${vehicleId}`
    );

    if (!response.ok) {
        throw new Error(
            `Checklist API error: ${response.status}`
        );
    }

    const data = await response.json();

    checklists =
        Array.isArray(data)
            ? data
            : data.data || [];

    console.log(
        "Checklists loaded:",
        checklists
    );
}


// Render vehicle information
function renderVehicleInformation() {

    if (!vehicle) {

        console.error(
            "Vehicle data is missing."
        );

        return;
    }


    const vehicleName =
        document.querySelector(
            ".vehicle-name"
        );

    const vehiclePlate =
        document.querySelector(
            ".vehicle-license"
        );

    const vehicleKilometers =
        document.querySelector(
            ".vehicle-kilometer"
        );


    if (vehicleName) {

        vehicleName.textContent =
            vehicle.name || "-";
    }


    if (vehiclePlate) {

        vehiclePlate.textContent =
            vehicle.license_plate ||
            vehicle.plate ||
            "-";
    }


    if (vehicleKilometers) {

        vehicleKilometers.textContent =
            vehicle.kilometers != null
                ? `${vehicle.kilometers} km`
                : "-";
    }
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
    const isOilQuestion = questionName.toLowerCase().includes("öljy");
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
                ${isOilQuestion ? renderOilPhoto() : ""}
                <div id="answerOptions" class="question-options"></div>
            </div>
            <div id="faultContainer" class="fault-container" style="${hasFault ? "" : "display:none;"}"></div>
        </div>
    `;

    renderAnswerOptions(checklist);

    if (isOilQuestion) {
        setupOilCamera();
    }

    restoreCurrentAnswer();
    renderProgress();
    updateNavigationButtons();
}

function restoreCurrentAnswer() {

    const current =
        answers[currentQuestionIndex];

    if (!current) {
        return;
    }


    // Restore normal answer

    if (current.answer) {

        const selected =
            document.querySelector(
                `.question-option[data-value="${CSS.escape(
                    current.answer
                )}"]`
            );

        if (selected) {

            selected.classList.add(
                "selected"
            );
        }
    }


    // Restore fault form

    if (
        current.answer === "Report Faults"
    ) {
        const layout =
            document.querySelector(".question-layout");

        if (layout) {
            layout.classList.add("has-fault");
        }

        renderFaultForm();

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
    }


    // Restore oil photo button

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
    }
}

function getQuestionIcon(questionName) {

    const name =
        questionName.toLowerCase();

    if (name.includes("öljy")) {
        return "oil_barrel";
    }

    if (
        name.includes("rengas") ||
        name.includes("renka")
    ) {
        return "tire_repair";
    }

    if (
        name.includes("valo") ||
        name.includes("valot")
    ) {
        return "lightbulb";
    }

    if (
        name.includes("jäähdytys") ||
        name.includes("neste")
    ) {
        return "water_drop";
    }

    if (
        name.includes("kilometri") ||
        name.includes("km")
    ) {
        return "speed";
    }

    if (
        name.includes("polttoaine") ||
        name.includes("bensiini") ||
        name.includes("diesel")
    ) {
        return "local_gas_station";
    }

    return "fact_check";
}

function renderAnswerOptions(checklist) {

    const container =
        document.getElementById("answerOptions");

    if (!container) return;

    container.innerHTML = "";

    const questionName =
        checklist.name.toLowerCase();

    // Render kilometer input
    if (questionName === "kilometrilukema") {
        renderKilometerInput(container);
        return;
    }

    // Render fuel gauge
    if (questionName === "polttoaineen määrä") {
        renderFuelGauge(container);
        return;
    }

    const options = [
        "Hyvä",
        "Kunnossa",
        "Huono",
        "En tiedä"
    ];


    options.forEach(option => {

        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            "question-option";

        button.dataset.value =
            option;

        button.textContent =
            option;

        button.addEventListener(
            "click",
            () => {

                selectAnswer(option);
            }
        );

        container.appendChild(button);
    });


    //Report faults if needed

    const faultButton =
        document.createElement("button");

    faultButton.type = "button";

    faultButton.className =
        "question-option report-fault";

    faultButton.dataset.value =
        "Report Faults";

    faultButton.innerHTML = `

        <span class="material-symbols-outlined">
            report_problem
        </span>

        Ilmoita vika
    `;

    faultButton.addEventListener(
        "click",
        () => {

            selectFault();
        }
    );

    container.appendChild(faultButton);
}

function selectAnswer(value) {

    const current =
        answers[currentQuestionIndex];

    current.answer = value;

    current.error = null;


    // Remove selected
    document
        .querySelectorAll(".question-option")
        .forEach(button => {

            button.classList.remove("selected");
        });


    // Select current
    const selected =
        document.querySelector(
            `.question-option[data-value="${CSS.escape(value)}"]`
        );

    if (selected) {
        selected.classList.add("selected");
    }

    const layout =
    document.querySelector(".question-layout");

    if (layout) {
        layout.classList.remove("has-fault");
}


    // Hide fault form
    const faultContainer =
        document.getElementById("faultContainer");

    if (faultContainer) {

        faultContainer.style.display =
            "none";

        faultContainer.innerHTML = "";
    }


    updateNavigationButtons();
}

function selectFault() {

    const current =
        answers[currentQuestionIndex];

    current.answer = "Report Faults";

    if (!current.error) {
        current.error = {
            photo: null,
            description: "",
            priority: null
        };
    }

    document
        .querySelectorAll(".question-option")
        .forEach(button => {
            button.classList.remove("selected");
        });

    const faultButton =
        document.querySelector(
            '.question-option[data-value="Report Faults"]'
        );

    if (faultButton) {
        faultButton.classList.add("selected");
    }

    const layout =
        document.querySelector(".question-layout");

    if (layout) {
        layout.classList.add("has-fault");
    }

    renderFaultForm();

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
        console.log("Fault camera button clicked");

        openCamera("fault", (picture) => {
            console.log("Fault picture received:", picture);

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
    const container = document.getElementById(elementId);

    if (!container || !picture) return;

    const imageUrl = URL.createObjectURL(picture);

    container.innerHTML = `
        <div class="question-photo-preview-content">
            <img src="${imageUrl}" alt="Otettu kuva">
            <span class="photo-success">Kuva valittu</span>
        </div>
    `;
}

function setupOilPhoto() {

    const input =
        document.getElementById(
            "oilPhotoInput"
        );

    const button =
        document.getElementById(
            "oilPhotoButton"
        );

    if (!input || !button) return;


    input.addEventListener(
        "change",
        () => {

            const file =
                input.files[0];

            if (!file) return;


            answers[
                currentQuestionIndex
            ].oilPhoto = file;


            button.classList.add(
                "photo-selected"
            );

            button.innerHTML = `

                <span class="material-symbols-outlined">
                    check_circle
                </span>

                Kuva otettu

            `;


            updateNavigationButtons();
        }
    );
}

function renderProgress() {
    const questionNumber =
        document.getElementById("questionNumber");

    const progressPercent =
        document.getElementById("progressPercent");

    const progressSegments =
        document.getElementById("progressSegments");

    if (
        !questionNumber ||
        !progressPercent ||
        !progressSegments
    ) {
        console.error(
            "Progress elements not found."
        );
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

    const percentage = Math.round(
        (current / total) * 100
    );

    // Question number
    questionNumber.textContent =
        `${current} / ${total}`;

    // Percentage
    progressPercent.textContent =
        `${percentage}%`;

    // Clear old segments
    progressSegments.innerHTML = "";

    // Create one segment for each question
    for (let i = 0; i < total; i++) {
        const segment =
            document.createElement("div");

        segment.classList.add(
            "progress-segment"
        );

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

        progressSegments.appendChild(
            segment
        );
    }
}

function updateNavigationButtons() {
    const previousButton =
        document.getElementById(
            "previousButton"
        );

    const nextButton =
        document.getElementById(
            "nextButton"
        );

    if (previousButton) {
        previousButton.disabled =
            currentQuestionIndex === 0;
    }

    if (nextButton) {
        if (
            currentQuestionIndex ===
            checklists.length - 1
        ) {
            nextButton.textContent =
                "Valmis";
        } else {
            nextButton.textContent =
                "Seuraava";
        }
    }
}

function setupNavigation() {
    const previousButton =
        document.getElementById(
            "previousButton"
        );

    const nextButton =
        document.getElementById(
            "nextButton"
        );

    if (previousButton) {
        previousButton.onclick =
            previousQuestion;
    }

    if (nextButton) {
        nextButton.onclick =
            nextQuestion;
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

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function nextQuestion() {
    if (!validateCurrentQuestion()) {
        return;
    }

    if (
        currentQuestionIndex <
        checklists.length - 1
    ) {
        currentQuestionIndex++;

        renderQuestion();
        renderProgress();
        updateNavigationButtons();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        return;
    }

    // Last question
    finishInspection();
}

function validateCurrentQuestion() {
    const checklist =
        checklists[currentQuestionIndex];

    const answer =
        answers[currentQuestionIndex];

    if (!checklist) {
        return false;
    }

    /*
     * Every question requires an answer
     */
const questionName =
    checklists[currentQuestionIndex].name
        .toLowerCase();

if (questionName === "kilometrilukema") {
    const value =
        answers[currentQuestionIndex].answer;

    if (
        value === null ||
        value === undefined ||
        value === "" ||
        Number(value) < 0
    ) {
        showValidationError(
            "Syötä kilometrilukema."
        );

        return false;
    }

    return true;
}

if (questionName === "polttoaineen määrä") {
    const value =
        answers[currentQuestionIndex].answer;

    if (
        value === null ||
        value === undefined
    ) {
        showValidationError(
            "Valitse polttoaineen määrä."
        );

        return false;
    }

    return true;
}

    if (
        !answer ||
        !answer.answer
    ) {
        alert(
            "Valitse vastaus ennen jatkamista."
        );

        return false;
    }

    /*
     * Oil question requires photo
     */
    const isOilQuestion =
        (checklist.name || "")
            .toLowerCase()
            .includes("öljy");

    if (
        isOilQuestion &&
        !answer.oilPhoto
    ) {
        alert(
            "Ota kuva moottoriöljyn mittatikusta."
        );

        return false;
    }

    /*
     * Fault validation
     */
    if (
        answer.answer === "Report Faults" ||
        answer.answer === "Ilmoita vika"
    ) {
        if (
            !answer.error ||
            !answer.error.photo
        ) {
            alert(
                "Ota kuva viasta ennen jatkamista."
            );

            return false;
        }

        if (
            !answer.error.description ||
            answer.error.description.trim() === ""
        ) {
            alert(
                "Kuvaile vika ennen jatkamista."
            );

            return false;
        }

        if (!answer.error.priority) {
            alert(
                "Valitse vian prioriteetti."
            );

            return false;
        }
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
            document.querySelector(
                ".vehicle-name"
            )?.textContent ||
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

    console.log(
        "Inspection result:",
        inspectionResult
    );

    /*
     * Show fireworks when inspection reaches 100%
     */
    showFireworks();

    /*
     * Small delay so fireworks can appear
     * before summary opens
     */
    setTimeout(() => {
        showSummaryModal(
            inspectionResult
        );
    }, 500);
}

function showSummaryModal(
    inspectionResult
) {
    const modal =
        document.getElementById(
            "summaryModal"
        );

    if (!modal) {
        console.error(
            "Summary modal was not found."
        );

        return;
    }

    /*
     * Vehicle information
     */
    const vehicleElement =
    modal.querySelector(
        ".summary-vehicle-name"
    );

const vehicleDetails =
    modal.querySelector(
        ".summary-vehicle-details"
    );

const plate =
    inspectionResult.licensePlate
        ? inspectionResult.licensePlate
        : "";

if (vehicleElement) {
    vehicleElement.textContent =
        inspectionResult.vehicle || "Ajoneuvo";
}

if (vehicleDetails) {
    vehicleDetails.textContent =
        plate
            ? `Rekisterinumero: ${plate}`
            : "";
}

    /*
     * Answers
     */
    const answersContainer =
        modal.querySelector(
            ".summary-answers"
        );

    if (answersContainer) {
        answersContainer.innerHTML = "";

        inspectionResult.answers.forEach(
            (item, index) => {

                const card =
                    document.createElement(
                        "div"
                    );

                card.classList.add("summary-answer");

                /*
                * Question number
                */
                const questionNumber =
                  document.createElement("div");

                questionNumber.classList.add(
                 "summary-question-number");

                questionNumber.textContent =
                 index + 1;

                card.appendChild(
                     questionNumber);


                    /*
                    * Question content
                    */
                const answerContent =
                    document.createElement("div");

                answerContent.classList.add(
                    "summary-answer-content"
                );


                /*
                * Question title
                */
                const title =
                    document.createElement("p");

                title.classList.add(
                    "summary-question"
                );

                title.textContent =
                    item.question || "Tarkastus";

                answerContent.appendChild(
                    title
                );


                /*
                * Description
                */
                if (item.description) {

                    const description =
                        document.createElement("p");

                    description.classList.add(
                        "summary-question-description"
                    );

                    description.textContent =
                        item.description;

                    answerContent.appendChild(
                        description
                    );
                }


                /*
                * Answer
                */
                const answerText =
                    document.createElement("p");

                answerText.classList.add(
                    "summary-value"
                );

                answerText.innerHTML =
                    `<strong>Vastaus:</strong> ${
                        escapeHTML(
                            formatSummaryAnswer(
                                item.answer
                            )
                        )
                    }`;

                answerContent.appendChild(
                    answerText
                );


                /*
                * Add content to card
                */
                card.appendChild(
                    answerContent
                );

                /*
                 * Oil photo
                 */
                if (
                    item.answer?.oilPhoto
                ) {
                    appendSummaryPhoto(
                        card,
                        item.answer.oilPhoto,
                        "Öljymittatikun kuva"
                    );
                }

                /*
                 * Normal photo
                 */
                if (
                    item.answer?.photo
                ) {
                    appendSummaryPhoto(
                        card,
                        item.answer.photo
                    );
                }

                /*
                 * Fault
                 */
                if (
                    item.answer?.error
                ) {
                    const fault =
                        item.answer.error;

                    const faultBox =
                        document.createElement(
                            "div"
                        );

                    faultBox.classList.add(
                        "summary-fault"
                    );

                    const faultTitle =
                        document.createElement(
                            "strong"
                        );

                    faultTitle.textContent =
                        "Vika";

                    faultBox.appendChild(
                        faultTitle
                    );

                    /*
                     * Description
                     */
                    if (
                        fault.description
                    ) {
                        const description =
                            document.createElement(
                                "p"
                            );

                        description.textContent =
                            `Kuvaus: ${
                                fault.description
                            }`;

                        faultBox.appendChild(
                            description
                        );
                    }

                    /*
                     * Priority
                     */
                    if (
                        fault.priority
                    ) {
                        const priority =
                            document.createElement(
                                "p"
                            );

                        priority.textContent =
                            `Prioriteetti: ${
                                getPriorityLabel(
                                    fault.priority
                                )
                            }`;

                        faultBox.appendChild(
                            priority
                        );
                    }

                    card.appendChild(
                        faultBox
                    );

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

                answersContainer.appendChild(
                    card
                );
            }
        );
    }

    /*
     * Confirmation checkbox
     */
    const confirmation =
        modal.querySelector(
            "#summary-confirmation"
        );

    /*
     * Submit button
     */
    const submitButton =
        modal.querySelector(
            "#summary-submit"
        );

    if (confirmation) {
        confirmation.checked = false;

        confirmation.onchange = () => {
            if (submitButton) {
                submitButton.disabled =
                    !confirmation.checked;
            }
        };
    }

    if (submitButton) {
        submitButton.disabled = true;

        submitButton.onclick = () => {
            if (
                !confirmation ||
                !confirmation.checked
            ) {
                return;
            }

            submitInspection(
                inspectionResult
            );
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
        return String(
            answer.answer
        );
    }

    if (
        answer.value !== undefined &&
        answer.value !== null &&
        answer.value !== ""
    ) {
        return String(
            answer.value
        );
    }

    return "Ei vastausta";
}

function appendSummaryPhoto(
    container,
    file,
    title = "Kuva"
) {
    if (!file) {
        return;
    }

    /*
     * File object
     */
    if (!(file instanceof File)) {
        return;
    }

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.classList.add(
        "summary-photo"
    );

    const label =
        document.createElement(
            "p"
        );

    label.textContent = title;

    const image =
        document.createElement(
            "img"
        );

    image.alt = title;

    image.classList.add(
        "summary-photo-image"
    );

    const objectUrl =
        URL.createObjectURL(file);

    image.src = objectUrl;

    image.addEventListener(
        "click",
        () => {
            window.open(
                objectUrl,
                "_blank"
            );
        }
    );

    wrapper.appendChild(label);
    wrapper.appendChild(image);

    container.appendChild(wrapper);
}

function getPriorityLabel(priority) {
    const labels = {
        low: "Matala",
        medium: "Keskitaso",
        high: "Korkea",
        critical: "Kriittinen"
    };

    return (
        labels[priority] ||
        priority ||
        "Ei määritetty"
    );
}

function setupBackButton() {
    const backButton =
        document.querySelector(
            ".back-button"
        );

    if (!backButton) {
        return;
    }

    const params =
        new URLSearchParams(
            window.location.search
        );

    const vehicleId =
        params.get("id");

    backButton.onclick = () => {
        if (vehicleId) {
            window.location.href =
                `index.html?id=${encodeURIComponent(
                    vehicleId
                )}`;
        } else {
            window.history.back();
        }
    };
}

async function submitInspection(
    inspectionResult
) {
    console.log(
        "Submitting inspection:",
        inspectionResult
    );

    /*
     * Later:
     *
     * FormData
     * -> PHP API
     * -> save inspection
     * -> save photos
     * -> save faults
     */

    alert(
        "Tarkastus on vahvistettu!"
    );

    closeSummaryModal();
}
function setupSummaryModal() {

    const closeButton =
        document.getElementById(
            "summary-close"
        );

    if (closeButton) {

        closeButton.onclick =
            closeSummaryModal;
    }
}

function closeSummaryModal() {

    const modal =
        document.getElementById(
            "summaryModal"
        );

    if (modal) {

        modal.classList.remove(
            "show"
        );
    }
}
function renderKilometerInput(container) {
    const wrapper =
        document.createElement("div");

    wrapper.className = "kilometer-input-wrapper";

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
            >
            <span>km</span>
        </div>

        <div class="last-inspection-kilometer">
            <span>
                Edellisen tarkastuksen lukema
            </span>

            <strong>
                ${getPreviousKilometers()} km
            </strong>
        </div>
    `;

    container.appendChild(wrapper);

    const input =
        document.getElementById("kilometerInput");

    input.addEventListener("input", () => {
        answers[currentQuestionIndex].answer =
            input.value
                ? Number(input.value)
                : null;
    });
}

function getPreviousKilometers() {
    if (
        vehicle &&
        vehicle.previousKilometers !== undefined
    ) {
        return vehicle.previousKilometers;
    }

    if (
        vehicle &&
        vehicle.kilometers !== undefined
    ) {
        return vehicle.kilometers;
    }

    return "-";
}

function renderFuelGauge(container) {
    const wrapper =
        document.createElement("div");

    wrapper.className = "fuel-gauge-wrapper";

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
                    50%
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
                    50 %
                </strong>
                <span>100 %</span>
            </div>

            <input
                type="range"
                id="fuelSlider"
                min="0"
                max="100"
                value="50"
                step="1"
            >
        </div>
    `;

    container.appendChild(wrapper);

    updateFuelGauge(50);

    const slider =
        document.getElementById("fuelSlider");

    slider.addEventListener("input", () => {
        const value =
            Number(slider.value);

        updateFuelGauge(value);

        answers[currentQuestionIndex].answer =
            value;
    });

    answers[currentQuestionIndex].answer = 50;
}

function updateFuelGauge(value) {
    const gaugeValue =
        document.getElementById("fuelGaugeValue");

    const sliderValue =
        document.getElementById("fuelSliderValue");

    const gaugeFill =
        document.getElementById("fuelGaugeFill");

    if (!gaugeValue ||
        !sliderValue ||
        !gaugeFill) {
        return;
    }

    gaugeValue.textContent =
        `${value}%`;

    sliderValue.textContent =
        `${value} %`;

    const length =
        gaugeFill.getTotalLength();

    const progress =
        length * (value / 100);

    gaugeFill.style.strokeDasharray =
        `${progress} ${length}`;
}

function showFireworks() {
    const container =
        document.createElement("div");

    container.className =
        "fireworks-container";

    container.style.pointerEvents =
        "none";

    document.body.appendChild(
        container
    );

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
    const burst =
        document.createElement("div");

    burst.className =
        "firework-burst";

    // Keep fireworks around the center of the screen
    const x =
        35 + Math.random() * 30;

    const y =
        25 + Math.random() * 30;

    burst.style.left =
        `${x}vw`;

    burst.style.top =
        `${y}vh`;

    container.appendChild(
        burst
    );

    // Create many particles
    const particleCount = 48;

    for (
        let i = 0;
        i < particleCount;
        i++
    ) {
        const particle =
            document.createElement("span");

        particle.className =
            "firework-particle";

        const angle =
            (360 / particleCount) * i;

        // Large explosion radius
        const distance =
            180 + Math.random() * 220;

        // Large particles
        const size =
            7 + Math.random() * 5;

        particle.style.setProperty(
            "--angle",
            `${angle}deg`
        );

        particle.style.setProperty(
            "--distance",
            `${distance}px`
        );

        particle.style.width =
            `${size}px`;

        particle.style.height =
            `${size}px`;

        burst.appendChild(
            particle
        );
    }

    setTimeout(() => {
        burst.remove();
    }, 2100);
}

function createFirework(container) {
    const firework =
        document.createElement("div");

    firework.className =
        "firework";

    firework.style.left =
        `${20 + Math.random() * 60}%`;

    firework.style.top =
        `${15 + Math.random() * 40}%`;

    container.appendChild(
        firework
    );

    for (let i = 0; i < 24; i++) {
        const particle =
            document.createElement("span");

        particle.className =
            "firework-particle";

        const angle =
            (Math.PI * 2 * i) / 24;

        const distance =
            60 + Math.random() * 80;

        const x =
            Math.cos(angle) * distance;

        const y =
            Math.sin(angle) * distance;

        particle.style.setProperty(
            "--x",
            `${x}px`
        );

        particle.style.setProperty(
            "--y",
            `${y}px`
        );

        firework.appendChild(
            particle
        );
    }

    setTimeout(() => {
        firework.remove();
    }, 1400);
}

function showErrorMessage(message) {
    const container =
        document.getElementById(
            "questionContainer"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const error =
        document.createElement(
            "div"
        );

    error.classList.add(
        "inspection-error"
    );

    error.textContent = message;

    container.appendChild(error);
}