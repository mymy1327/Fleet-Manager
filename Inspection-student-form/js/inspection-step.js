// Global inspection data
let vehicle = null;
let checklists = [];
let allQuestions = [];
let currentQuestionIndex = 0;
let answers = [];

// Initialize the inspection page
document.addEventListener("DOMContentLoaded", () => {
    initInspection();
});

// Initialize inspection data and UI
async function initInspection() {
    try {
        const params = new URLSearchParams(window.location.search);
        const vehicleId = params.get("id");

        if (!vehicleId) {
            throw new Error("Vehicle ID is missing from URL.");
        }

        // Load vehicle information
        const vehicleResponse = await fetch(
            `../../VehicleList/vehicles.php?vehicle=${vehicleId}`
        );

        if (!vehicleResponse.ok) {
            throw new Error(
                `Vehicle API error: ${vehicleResponse.status}`
            );
        }

        const vehicleData = await vehicleResponse.json();
        // Support both object and array responses
        if (Array.isArray(vehicleData)) {
            vehicle = vehicleData[0];
        } else {
            vehicle = vehicleData;
        }

        if (!vehicle) {
            throw new Error("Vehicle data was not found.");
        }

        console.log("Vehicle:", vehicle);

        // Load checklists assigned to this vehicle
        const checklistResponse = await fetch(
            `../../VehicleList/vehicleChecklists.php?vehicle=${vehicleId}`
        );

        if (!checklistResponse.ok) {
            throw new Error(
                `Vehicle checklist API error: ${checklistResponse.status}`
            );
        }

        const checklistData = await checklistResponse.json();

        console.log("Vehicle checklists:", checklistData);

        if (!Array.isArray(checklistData)) {
            throw new Error("Checklist API did not return an array.");
        }

        checklists = checklistData;

        // Convert every checklist item into an inspection question
        allQuestions = checklists.map(checklist => {
            return {
                checklistId: checklist.id_checklists,
                formTitle: checklist.name,
                version: 1,
                question: createQuestionFromChecklist(checklist)
            };
        });

        console.log("Generated questions:", allQuestions);

        if (allQuestions.length === 0) {
            showErrorMessage(
                "Ajoneuvolle ei ole määritetty tarkastuskohtia."
            );
            return;
        }

        // Create empty answers
        answers = allQuestions.map(() => null);

        currentQuestionIndex = 0;

        renderVehicleInformation();
        renderProgress();
        renderQuestion();
        updateNavigationButtons();
        setupNavigation();
        setupBackButton();

    } catch (error) {
        console.error("Inspection initialization failed:", error);

        showErrorMessage(
            "Tarkastuksen tietojen lataaminen epäonnistui."
        );
    }
}

// Create a question automatically from a checklist item
function createQuestionFromChecklist(checklist) {
    const name = String(checklist.name || "").toLowerCase();

    // Default question
    const question = {
        id: checklist.id_checklists,
        title: checklist.name,
        description: checklist.description || "",
        type: "choice",
        required: true,
        options: [
            "Hyvä",
            "Ei kunnossa",
            "En tiedä"
        ],
        allowFault: true,
        photo: null,
        icon: "check_circle"
    };

    // Engine oil
    if (
        name.includes("moottoriöljy") ||
        name.includes("öljy")
    ) {
        question.options = [
            "Hyvä",
            "Lisää öljyä",
            "En tiedä"
        ];

        question.photo = {
            required: true,
            cameraOnly: true,
            description: "Ota kuva öljynmittatikusta"
        };

        question.icon = "oil_barrel";
    }

    // Coolant
    else if (
        name.includes("jäähdytysneste") ||
        name.includes("coolant")
    ) {
        question.options = [
            "Hyvä",
            "Liian alhainen",
            "En tiedä"
        ];

        question.icon = "water_drop";
    }

    // Tires
    else if (
        name.includes("rengas") ||
        name.includes("renkaat") ||
        name.includes("rengastus")
    ) {
        question.options = [
            "Hyvä",
            "Kulunut",
            "Liian alhainen paine",
            "Vaurioitunut",
            "En tiedä"
        ];

        question.icon = "tire_repair";
    }

    // Lights
    else if (
        name.includes("valo") ||
        name.includes("valot")
    ) {
        question.options = [
            "Kaikki valot toimivat",
            "Jokin valo ei toimi",
            "En tiedä"
        ];

        question.icon = "lightbulb";
    }

    // Brakes
    else if (
        name.includes("jarru") ||
        name.includes("jarrut")
    ) {
        question.options = [
            "Hyvä",
            "Ei kunnossa",
            "En tiedä"
        ];

        question.icon = "car_crash";
    }

    // Fuel
    else if (
        name.includes("polttoaine") ||
        name.includes("fuel")
    ) {
        question.type = "percentage";
        question.allowFault = true;
        question.icon = "local_gas_station";
    }

    // Mileage
    else if (
        name.includes("kilometri") ||
        name.includes("kilometrilukema") ||
        name.includes("odometer")
    ) {
        question.type = "number";
        question.unit = "km";
        question.allowFault = false;
        question.icon = "speed";
    }

    // Default icon
    return question;
}

// Render vehicle information
function renderVehicleInformation() {
    const vehicleName = document.querySelector(".vehicle-name");
    const vehiclePlate = document.querySelector(".vehicle-license");
    const vehicleKilometers = document.querySelector(".vehicle-kilometer");

    if (vehicleName) {
        vehicleName.textContent = vehicle.name || "-";
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
    const container =
        document.getElementById("question-container");

    if (!container) {
        console.error(
            "Question container was not found."
        );
        return;
    }

    container.innerHTML = "";

    const item = allQuestions[currentQuestionIndex];

    if (!item || !item.question) {
        console.error("Question data is missing.");
        return;
    }

    const question = item.question;
    const currentAnswer = answers[currentQuestionIndex];

    // Question header
    const header = document.createElement("div");
    header.classList.add("question-header");

    // Question icon
    const icon = document.createElement("span");
    icon.classList.add(
        "material-symbols-outlined",
        "question-icon"
    );
    icon.textContent =
        question.icon || "check_circle";

    header.appendChild(icon);

    // Question title
    const title = document.createElement("h2");
    title.textContent = question.title;

    header.appendChild(title);

    container.appendChild(header);

    // Description
    if (question.description) {
        const description = document.createElement("p");
        description.classList.add("question-description");
        description.textContent = question.description;

        container.appendChild(description);
    }

    // Required label
    if (question.required) {
        const required = document.createElement("span");
        required.classList.add("required-label");
        required.textContent = "Pakollinen";

        container.appendChild(required);
    }

    // Render question type
    switch (question.type) {
        case "number":
            renderNumberQuestion(
                container,
                question,
                currentAnswer
            );
            break;

        case "choice":
            renderChoiceQuestion(
                container,
                question,
                currentAnswer
            );
            break;

        case "photo":
            renderPhotoQuestion(
                container,
                question,
                currentAnswer
            );
            break;

        case "percentage":
            renderPercentageQuestion(
                container,
                question,
                currentAnswer
            );
            break;

        case "checkbox":
            renderCheckboxQuestion(
                container,
                question,
                currentAnswer
            );
            break;

        default:
            console.warn(
                "Unknown question type:",
                question.type
            );

            renderChoiceQuestion(
                container,
                question,
                currentAnswer
            );
    }
}

// Render a number question
function renderNumberQuestion(
    container,
    question,
    currentAnswer
) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("number-question");

    const input = document.createElement("input");

    input.type = "number";
    input.inputMode = "numeric";
    input.classList.add("question-number-input");

    input.value = currentAnswer?.value ?? "";

    if (question.unit) {
        input.placeholder = question.unit;
    }

    input.addEventListener("input", () => {
        saveCurrentAnswer({
            value: input.value,
            unit: question.unit || null
        });
    });

    wrapper.appendChild(input);

    if (question.unit) {
        const unit = document.createElement("span");
        unit.classList.add("input-unit");
        unit.textContent = question.unit;

        wrapper.appendChild(unit);
    }

    container.appendChild(wrapper);

    // Number questions can also report faults
    if (question.allowFault) {
        renderFaultSection(
            container,
            question
        );
    }
}

// Render choice question
function renderChoiceQuestion(
    container,
    question,
    currentAnswer
) {
    const optionsContainer = document.createElement("div");
    optionsContainer.classList.add("question-options");

    if (!Array.isArray(question.options)) {
        console.warn(
            "Question has no options:",
            question
        );

        return;
    }

    question.options.forEach(optionText => {
        const button = document.createElement("button");

        button.type = "button";
        button.classList.add("question-option");
        button.textContent = optionText;

        if (
            currentAnswer &&
            currentAnswer.value === optionText
        ) {
            button.classList.add("selected");
        }

        button.addEventListener("click", () => {
            const previousAnswer =
                answers[currentQuestionIndex] || {};

            saveCurrentAnswer({
                ...previousAnswer,
                value: optionText
            });

            optionsContainer
                .querySelectorAll(
                    ".question-option"
                )
                .forEach(optionButton => {
                    optionButton.classList.remove(
                        "selected"
                    );
                });

            button.classList.add("selected");
        });

        optionsContainer.appendChild(button);
    });

    container.appendChild(optionsContainer);

    // Render required photo
    if (question.photo) {
        renderPhotoInput(
            container,
            question.photo
        );
    }

    // Render fault section
    if (question.allowFault) {
        renderFaultSection(
            container,
            question
        );
    }
}

// Render photo question
function renderPhotoQuestion(
    container,
    question,
    currentAnswer
) {
    renderPhotoInput(
        container,
        question.photo || {
            required: question.required,
            cameraOnly: false
        }
    );
}

// Render photo input
function renderPhotoInput(
    container,
    photoSettings
) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("photo-input-wrapper");

    const label = document.createElement("label");
    label.classList.add("photo-input-label");

    const icon = document.createElement("span");
    icon.classList.add(
        "material-symbols-outlined"
    );
    icon.textContent = "photo_camera";

    const text = document.createElement("span");
    text.textContent =
        photoSettings.description ||
        "Ota kuva";

    label.appendChild(icon);
    label.appendChild(text);

    const input = document.createElement("input");

    input.type = "file";
    input.accept = "image/*";

    // Request camera instead of gallery
    if (photoSettings.cameraOnly) {
        input.setAttribute(
            "capture",
            "environment"
        );
    }

    input.classList.add("photo-input");

    const photoStatus = document.createElement("p");
    photoStatus.classList.add(
        "photo-status"
    );

    const currentAnswer =
        answers[currentQuestionIndex];

    if (currentAnswer?.photo) {
        photoStatus.textContent =
            "Kuva otettu";
        photoStatus.classList.add(
            "photo-selected"
        );
    }

    if (photoSettings.required) {
        const requiredText =
            document.createElement("small");

        requiredText.textContent =
            photoSettings.cameraOnly
                ? "Vain kamerakuva"
                : "Pakollinen kuva";

        requiredText.classList.add(
            "photo-required"
        );

        wrapper.appendChild(requiredText);
    }

    input.addEventListener("change", () => {
        if (
            input.files &&
            input.files.length > 0
        ) {
            const current =
                answers[currentQuestionIndex] ||
                {};

            saveCurrentAnswer({
                ...current,
                photo: input.files[0]
            });

            photoStatus.textContent =
                "Kuva otettu";

            photoStatus.classList.add(
                "photo-selected"
            );
        }
    });

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    wrapper.appendChild(photoStatus);

    container.appendChild(wrapper);
}

// Render fault section
function renderFaultSection(
    container,
    question
) {
    const currentAnswer =
        answers[currentQuestionIndex];

    const faultWrapper =
        document.createElement("div");

    faultWrapper.classList.add(
        "fault-section"
    );

    // Fault checkbox
    const faultLabel =
        document.createElement("label");

    faultLabel.classList.add(
        "fault-toggle"
    );

    const checkbox =
        document.createElement("input");

    checkbox.type = "checkbox";

    checkbox.checked =
        currentAnswer?.fault?.enabled === true;

    const checkboxText =
        document.createElement("span");

    checkboxText.textContent =
        "Tässä kohdassa on vika";

    faultLabel.appendChild(checkbox);
    faultLabel.appendChild(checkboxText);

    faultWrapper.appendChild(faultLabel);

    // Fault details
    const details =
        document.createElement("div");

    details.classList.add(
        "fault-details"
    );

    details.style.display =
        checkbox.checked
            ? "block"
            : "none";

    // Fault description
    const descriptionLabel =
        document.createElement("label");

    descriptionLabel.textContent =
        "Vian kuvaus";

    const description =
        document.createElement("textarea");

    description.classList.add(
        "fault-description"
    );

    description.placeholder =
        "Kuvaile vika...";

    description.value =
        currentAnswer?.fault?.description ||
        "";

    descriptionLabel.appendChild(
        description
    );

    details.appendChild(
        descriptionLabel
    );

    // Fault priority
    const priorityLabel =
        document.createElement("label");

    priorityLabel.textContent =
        "Prioriteetti";

    const priority =
        document.createElement("select");

    priority.classList.add(
        "fault-priority"
    );

    const priorities = [
        {
            value: "low",
            text: "Matala"
        },
        {
            value: "medium",
            text: "Keskitaso"
        },
        {
            value: "high",
            text: "Korkea"
        },
        {
            value: "critical",
            text: "Kriittinen"
        }
    ];

    priorities.forEach(priorityItem => {
        const option =
            document.createElement("option");

        option.value =
            priorityItem.value;

        option.textContent =
            priorityItem.text;

        priority.appendChild(option);
    });

    priority.value =
        currentAnswer?.fault?.priority ||
        "medium";

    priorityLabel.appendChild(
        priority
    );

    details.appendChild(
        priorityLabel
    );

    // Fault photo
    const photoTitle =
        document.createElement("p");

    photoTitle.textContent =
        "Kuva viasta";

    details.appendChild(
        photoTitle
    );

    const photoInput =
        document.createElement("input");

    photoInput.type = "file";
    photoInput.accept = "image/*";
    photoInput.setAttribute(
        "capture",
        "environment"
    );

    photoInput.classList.add(
        "fault-photo-input"
    );

    details.appendChild(
        photoInput
    );

    // Previous fault photo
    if (currentAnswer?.fault?.photo) {
        const photoStatus =
            document.createElement("p");

        photoStatus.textContent =
            "Kuva otettu";

        photoStatus.classList.add(
            "photo-selected"
        );

        details.appendChild(
            photoStatus
        );
    }

    // Save fault information
    function saveFault() {
        const current =
            answers[currentQuestionIndex] ||
            {};

        saveCurrentAnswer({
            ...current,
            fault: {
                enabled: checkbox.checked,
                description:
                    description.value,
                priority:
                    priority.value,
                photo:
                    current.fault?.photo ||
                    null
            }
        });
    }

    // Show or hide fault details
    checkbox.addEventListener(
        "change",
        () => {
            details.style.display =
                checkbox.checked
                    ? "block"
                    : "none";

            saveFault();
        }
    );

    // Save description
    description.addEventListener(
        "input",
        saveFault
    );

    // Save priority
    priority.addEventListener(
        "change",
        saveFault
    );

    // Save fault photo
    photoInput.addEventListener(
        "change",
        () => {
            if (
                photoInput.files &&
                photoInput.files.length > 0
            ) {
                const current =
                    answers[
                        currentQuestionIndex
                    ] || {};

                saveCurrentAnswer({
                    ...current,
                    fault: {
                        ...current.fault,
                        enabled: true,
                        description:
                            description.value,
                        priority:
                            priority.value,
                        photo:
                            photoInput.files[0]
                    }
                });
            }
        }
    );

    faultWrapper.appendChild(
        details
    );

    container.appendChild(
        faultWrapper
    );
}

// Render percentage question
function renderPercentageQuestion(
    container,
    question,
    currentAnswer
) {
    const wrapper =
        document.createElement("div");

    wrapper.classList.add(
        "percentage-question"
    );

    const valueDisplay =
        document.createElement("div");

    valueDisplay.classList.add(
        "percentage-value"
    );

    const value =
        currentAnswer?.value ?? 50;

    valueDisplay.textContent =
        `${value}%`;

    const slider =
        document.createElement("input");

    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.step = "1";

    slider.value = value;

    slider.classList.add(
        "percentage-slider"
    );

    slider.addEventListener(
        "input",
        () => {
            valueDisplay.textContent =
                `${slider.value}%`;

            saveCurrentAnswer({
                value:
                    Number(slider.value)
            });
        }
    );

    wrapper.appendChild(
        valueDisplay
    );

    wrapper.appendChild(
        slider
    );

    container.appendChild(
        wrapper
    );

    // Fuel percentage can also report faults
    if (question.allowFault) {
        renderFaultSection(
            container,
            question
        );
    }
}

// Render checkbox question
function renderCheckboxQuestion(
    container,
    question,
    currentAnswer
) {
    const wrapper =
        document.createElement("label");

    wrapper.classList.add(
        "checkbox-question"
    );

    const checkbox =
        document.createElement("input");

    checkbox.type = "checkbox";

    checkbox.checked =
        currentAnswer?.value === true;

    checkbox.addEventListener(
        "change",
        () => {
            saveCurrentAnswer({
                value: checkbox.checked
            });
        }
    );

    const text =
        document.createElement("span");

    text.textContent =
        question.title;

    wrapper.appendChild(
        checkbox
    );

    wrapper.appendChild(
        text
    );

    container.appendChild(
        wrapper
    );
}

// Save the current answer
function saveCurrentAnswer(answer) {
    answers[currentQuestionIndex] = answer;
}

// Validate the current question
function validateCurrentQuestion() {
    const item =
        allQuestions[currentQuestionIndex];

    if (!item || !item.question) {
        return false;
    }

    const question =
        item.question;

    const answer =
        answers[currentQuestionIndex];

    // Check required answer
    if (question.required) {
        if (
            !answer ||
            answer.value === undefined ||
            answer.value === null ||
            answer.value === ""
        ) {
            alert(
                "Valitse vastaus ennen jatkamista."
            );

            return false;
        }
    }

    // Check required photo
    if (question.photo?.required) {
        if (
            !answer ||
            !answer.photo
        ) {
            alert(
                "Ota vaadittu kuva ennen jatkamista."
            );

            return false;
        }
    }

    // Check fault information
    if (answer?.fault?.enabled) {
        if (
            !answer.fault.description ||
            answer.fault.description.trim() === ""
        ) {
            alert(
                "Kuvaile vika ennen jatkamista."
            );

            return false;
        }

        if (!answer.fault.priority) {
            alert(
                "Valitse vian prioriteetti."
            );

            return false;
        }

        if (!answer.fault.photo) {
            alert(
                "Ota kuva viasta ennen jatkamista."
            );

            return false;
        }
    }

    return true;
}

// Render progress bar
function renderProgress() {
    const progressContainer =
        document.querySelector(
            ".inspection-progress"
        );

    if (!progressContainer) {
        return;
    }

    progressContainer.innerHTML = "";

    const total =
        allQuestions.length;

    if (total === 0) {
        return;
    }

    const progressPercentage =
        Math.round(
            ((currentQuestionIndex + 1) /
                total) *
                100
        );

    // Progress segments
    const segments =
        document.createElement("div");

    segments.classList.add(
        "progress-segments"
    );

    for (let i = 0; i < total; i++) {
        const segment =
            document.createElement("div");

        segment.classList.add(
            "progress-segment"
        );

        if (i <= currentQuestionIndex) {
            segment.classList.add(
                "active"
            );
        }

        segments.appendChild(
            segment
        );
    }

    // Progress information
    const info =
        document.createElement("div");

    info.classList.add(
        "progress-info"
    );

    const questionCount =
        document.createElement("span");

    questionCount.textContent =
        `${currentQuestionIndex + 1} / ${total}`;

    const percentage =
        document.createElement("span");

    percentage.textContent =
        `${progressPercentage}%`;

    info.appendChild(
        questionCount
    );

    info.appendChild(
        percentage
    );

    progressContainer.appendChild(
        info
    );

    progressContainer.appendChild(
        segments
    );
}

// Update navigation buttons
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
            allQuestions.length - 1
        ) {
            nextButton.textContent =
                "Valmis";
        } else {
            nextButton.textContent =
                "Seuraava";
        }
    }
}

// Setup navigation
function setupNavigation() {
    const previousButton =
        document.getElementById(
            "previous-question"
        );

    const nextButton =
        document.getElementById(
            "next-question"
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

// Go to previous question
function previousQuestion() {
    if (currentQuestionIndex <= 0) {
        return;
    }

    currentQuestionIndex--;

    renderProgress();
    renderQuestion();
    updateNavigationButtons();
}

// Go to next question
function nextQuestion() {
    if (!validateCurrentQuestion()) {
        return;
    }

    if (
        currentQuestionIndex <
        allQuestions.length - 1
    ) {
        currentQuestionIndex++;

        renderProgress();
        renderQuestion();
        updateNavigationButtons();

        return;
    }

    // Last question
    finishInspection();
}

// Finish inspection
function finishInspection() {
    if (!validateCurrentQuestion()) {
        return;
    }

    const inspectionResult = {
        vehicleId: vehicle.id_vehicles,
        vehicle: vehicle.name,
        vehicleType: vehicle.type,

        checklists: checklists.map(
            checklist => ({
                checklistId:
                    checklist.id_checklists,
                formTitle:
                    checklist.name,
                description:
                    checklist.description ||
                    "",
                version: 1
            })
        ),

        answers: allQuestions.map(
            (item, index) => ({
                checklistId:
                    item.checklistId,

                questionId:
                    item.question.id,

                question:
                    item.question.title,

                type:
                    item.question.type,

                answer:
                    answers[index]
            })
        )
    };

    console.log(
        "Inspection result:",
        inspectionResult
    );

    showSummaryModal(
        inspectionResult
    );
}

// Show summary modal
function showSummaryModal(
    inspectionResult
) {
    const modal =
        document.getElementById(
            "summary-modal"
        );

    if (!modal) {
        console.error(
            "Summary modal was not found."
        );

        return;
    }

    const vehicleElement =
        modal.querySelector(
            ".summary-vehicle"
        );

    if (vehicleElement) {
        vehicleElement.textContent =
            `${inspectionResult.vehicle} ${
                vehicle.license_plate ||
                vehicle.plate ||
                ""
            }`;
    }

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

                card.classList.add(
                    "summary-answer"
                );

                const title =
                    document.createElement(
                        "h3"
                    );

                title.textContent =
                    `${index + 1}. ${
                        item.question
                    }`;

                card.appendChild(title);

                const answerText =
                    document.createElement(
                        "p"
                    );

                answerText.innerHTML =
                    formatSummaryAnswer(
                        item.answer
                    );

                card.appendChild(
                    answerText
                );

                // Show normal photo
                if (
                    item.answer?.photo
                ) {
                    appendSummaryPhoto(
                        card,
                        item.answer.photo
                    );
                }

                // Show fault information
                if (
                    item.answer?.fault
                        ?.enabled
                ) {
                    const fault =
                        item.answer.fault;

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

                    const faultDescription =
                        document.createElement(
                            "p"
                        );

                    faultDescription.textContent =
                        `Kuvaus: ${
                            fault.description
                        }`;

                    faultBox.appendChild(
                        faultDescription
                    );

                    const faultPriority =
                        document.createElement(
                            "p"
                        );

                    faultPriority.textContent =
                        `Prioriteetti: ${
                            getPriorityLabel(
                                fault.priority
                            )
                        }`;

                    faultBox.appendChild(
                        faultPriority
                    );

                    card.appendChild(
                        faultBox
                    );

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

    // Reset confirmation
    const confirmation =
        modal.querySelector(
            "#summary-confirmation"
        );

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
            if (!confirmation?.checked) {
                return;
            }

            submitInspection(
                inspectionResult
            );
        };
    }

    // Show modal
    modal.classList.add("show");
}

// Format summary answer
function formatSummaryAnswer(
    answer
) {
    if (!answer) {
        return "Ei vastausta";
    }

    if (
        answer.value !== undefined &&
        answer.value !== null &&
        answer.value !== ""
    ) {
        if (answer.unit) {
            return `${answer.value} ${answer.unit}`;
        }

        return String(answer.value);
    }

    return "Ei vastausta";
}

// Add photo to summary
function appendSummaryPhoto(
    container,
    file,
    title = "Kuva"
) {
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
        document.createElement("p");

    label.textContent = title;

    const image =
        document.createElement("img");

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

// Get Finnish priority label
function getPriorityLabel(
    priority
) {
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

// Submit inspection
async function submitInspection(
    inspectionResult
) {
    console.log(
        "Submitting inspection:",
        inspectionResult
    );

    // This will later send the inspection
    // data and photos to the PHP API.

    alert(
        "Tarkastus on vahvistettu!"
    );

    closeSummaryModal();
}

// Close summary modal
function closeSummaryModal() {
    const modal =
        document.getElementById(
            "summary-modal"
        );

    if (modal) {
        modal.classList.remove(
            "show"
        );
    }
}

// Setup back button
function setupBackButton() {
    const backButton =
        document.getElementById(
            "back-button"
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
                `inspection-step.html?id=${vehicleId}`;
        } else {
            window.history.back();
        }
    };
}

// Show error message
function showErrorMessage(
    message
) {
    const container =
        document.getElementById(
            "question-container"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const error =
        document.createElement("div");

    error.classList.add(
        "inspection-error"
    );

    error.textContent = message;

    container.appendChild(
        error
    );
}

// Fireworks effect
function showFireworks() {
    const container =
        document.createElement(
            "div"
        );

    container.classList.add(
        "fireworks"
    );

    document.body.appendChild(
        container
    );

    setTimeout(() => {
        container.remove();
    }, 3000);
}