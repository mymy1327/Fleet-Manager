let vehicle = null;

let checklists = [];
let allQuestions = [];

let currentQuestionIndex = 0;

// Store answers for every question
let answers = [];


document.addEventListener("DOMContentLoaded", () => {
    initInspection();
});


// ==================================================
// INIT
// ==================================================

async function initInspection() {

    try {

        // ------------------------------------------
        // Get vehicle ID from URL
        // ------------------------------------------

        const params =
            new URLSearchParams(window.location.search);

        const vehicleId =
            Number(params.get("id"));


        if (!vehicleId) {

            throw new Error(
                "Vehicle ID puuttuu."
            );

        }


        // ------------------------------------------
        // Load JSON files
        // ------------------------------------------

        const [
            vehiclesResponse,
            vehicleChecklistsResponse,
            checklistsResponse
        ] = await Promise.all([

            fetch("data/vehicles.json"),

            fetch("data/vehicles_checklists.json"),

            fetch("data/checklists.json")

        ]);


        if (!vehiclesResponse.ok) {

            throw new Error(
                "vehicles.json lataaminen epäonnistui."
            );

        }


        if (!vehicleChecklistsResponse.ok) {

            throw new Error(
                "vehicles_checklists.json lataaminen epäonnistui."
            );

        }


        if (!checklistsResponse.ok) {

            throw new Error(
                "checklists.json lataaminen epäonnistui."
            );

        }


        const vehiclesData =
            await vehiclesResponse.json();

        const vehiclesChecklistsData =
            await vehicleChecklistsResponse.json();

        const checklistsData =
            await checklistsResponse.json();


        // ------------------------------------------
        // Find vehicle
        // ------------------------------------------

        vehicle =
            vehiclesData.vehicles.find(
                item =>
                    item.id_vehicles === vehicleId
            );


        if (!vehicle) {

            throw new Error(
                `Ajoneuvoa ID:llä ${vehicleId} ei löydy.`
            );

        }


        console.log(
            "Vehicle:",
            vehicle
        );


        // ------------------------------------------
        // Find vehicle-checklist relations
        // ------------------------------------------

        const vehicleChecklistRelations =
            vehiclesChecklistsData.vehiclesChecklists
                .filter(
                    item =>
                        item.id_vehicles === vehicleId
                );


        if (
            vehicleChecklistRelations.length === 0
        ) {

            throw new Error(
                "Ajoneuvolle ei löytynyt tarkastuslistoja."
            );

        }


        // ------------------------------------------
        // Get checklist IDs
        // ------------------------------------------

        const checklistIds =
            vehicleChecklistRelations.map(
                item =>
                    item.id_checklists
            );


        // ------------------------------------------
        // Get actual checklists
        // ------------------------------------------

        checklists =
            checklistsData.checklists
                .filter(
                    checklist =>
                        checklistIds.includes(
                            checklist.id
                        )
                );


        if (checklists.length === 0) {

            throw new Error(
                "Tarkastuslistoja ei löytynyt."
            );

        }


        // ------------------------------------------
        // Combine all questions
        // ------------------------------------------

        allQuestions = [];


        checklists.forEach(
            checklist => {

                if (
                    !Array.isArray(
                        checklist.questions
                    )
                ) {

                    return;

                }


                checklist.questions.forEach(
                    question => {

                        allQuestions.push({

                            checklistId:
                                checklist.id,

                            formTitle:
                                checklist.formTitle,

                            version:
                                checklist.version,

                            question:
                                question

                        });

                    }
                );

            }
        );


        if (allQuestions.length === 0) {

            throw new Error(
                "Tarkastuslistoissa ei ole kysymyksiä."
            );

        }


        // ------------------------------------------
        // Create answer array
        // ------------------------------------------

        answers =
            allQuestions.map(() => null);


        // ------------------------------------------
        // Setup UI
        // ------------------------------------------

        renderProgress();

        renderQuestion();

        updateNavigationButtons();

        setupNavigation();

        setupBackButton();


        console.log(
            "Questions:",
            allQuestions
        );


    } catch (error) {

        console.error(
            "Inspection error:",
            error
        );

        showError(
            error.message
        );

    }
}


// ==================================================
// RENDER QUESTION
// ==================================================

function renderQuestion() {

    const container =
        document.querySelector(
            "#questionContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const currentItem =
        allQuestions[currentQuestionIndex];


    if (!currentItem) {
        return;
    }


    const question =
        currentItem.question;


    // ------------------------------------------
    // Question header
    // ------------------------------------------

    const questionHeader =
        document.createElement("div");

    questionHeader.classList.add(
        "question-header"
    );


    // Icon

    const icon =
        document.createElement("span");

    icon.classList.add(
        "material-symbols-outlined",
        "question-icon"
    );

    icon.textContent =
        question.icon || "check_circle";


    // Title

    const title =
        document.createElement("h2");

    title.classList.add(
        "question-title"
    );

    title.textContent =
        question.title;


    questionHeader.appendChild(
        icon
    );

    questionHeader.appendChild(
        title
    );


    container.appendChild(
        questionHeader
    );


    // ------------------------------------------
    // Required label
    // ------------------------------------------

    if (question.required) {

        const required =
            document.createElement("p");

        required.classList.add(
            "required-label"
        );

        required.textContent =
            "Pakollinen";

        container.appendChild(
            required
        );

    }


    // ------------------------------------------
    // Question content
    // ------------------------------------------

    const content =
        document.createElement("div");

    content.classList.add(
        "question-content"
    );


    switch (question.type) {

        case "number":

            renderNumberQuestion(
                content,
                question
            );

            break;


        case "choice":

            renderChoiceQuestion(
                content,
                question
            );

            break;


        case "photo":

            renderPhotoQuestion(
                content,
                question
            );

            break;


        case "percentage":

            renderPercentageQuestion(
                content,
                question
            );

            break;


        case "checkbox":

            renderCheckboxQuestion(
                content,
                question
            );

            break;


        default:

            console.warn(
                `Unknown question type: ${question.type}`
            );

            content.innerHTML = `
                <p>Tuntematon kysymystyyppi.</p>
            `;

            break;
    }


    container.appendChild(
        content
    );


    // Update progress

    renderProgress();

    updateNavigationButtons();
}


// ==================================================
// NUMBER QUESTION
// ==================================================

function renderNumberQuestion(
    container,
    question
) {

    const wrapper =
        document.createElement("div");

    wrapper.classList.add(
        "number-input-wrapper"
    );


    const input =
        document.createElement("input");

    input.type = "number";

    input.classList.add(
        "question-number-input"
    );

    input.placeholder =
        "Syötä kilometrilukema";


    // Restore answer

    const previousAnswer =
        answers[currentQuestionIndex];


    if (
        previousAnswer &&
        previousAnswer.value !== undefined
    ) {

        input.value =
            previousAnswer.value;

    }


    // Unit

    if (question.unit) {

        const unit =
            document.createElement("span");

        unit.classList.add(
            "question-unit"
        );

        unit.textContent =
            question.unit;


        wrapper.appendChild(
            input
        );

        wrapper.appendChild(
            unit
        );

    } else {

        wrapper.appendChild(
            input
        );

    }


    // Save answer

    input.addEventListener(
        "input",
        () => {

            answers[currentQuestionIndex] = {

                value:
                    input.value

            };

        }
    );


    container.appendChild(
        wrapper
    );
}


// ==================================================
// CHOICE QUESTION
// ==================================================

function renderChoiceQuestion(
    container,
    question
) {

    const optionsContainer =
        document.createElement("div");

    optionsContainer.classList.add(
        "question-options"
    );


    if (!Array.isArray(question.options)) {

        console.warn(
            "Question has no options:",
            question
        );

        return;
    }


    const previousAnswer =
        answers[currentQuestionIndex];


    question.options.forEach(
        option => {

            const button =
                document.createElement("button");

            button.type =
                "button";

            button.classList.add(
                "question-option"
            );


            button.textContent =
                option;


            // Restore previous answer

            if (
                previousAnswer &&
                previousAnswer.value === option
            ) {

                button.classList.add(
                    "selected"
                );

            }


            // Select option

            button.addEventListener(
                "click",
                () => {

                    // Keep existing photo
                    const currentAnswer =
                        answers[currentQuestionIndex];


                    answers[currentQuestionIndex] = {

                        value:
                            option,

                        photo:
                            currentAnswer?.photo || null

                    };


                    // Remove selected state

                    optionsContainer
                        .querySelectorAll(
                            ".question-option"
                        )
                        .forEach(
                            item => {

                                item.classList.remove(
                                    "selected"
                                );

                            }
                        );


                    // Add selected state

                    button.classList.add(
                        "selected"
                    );

                }
            );


            optionsContainer.appendChild(
                button
            );

        }
    );


    container.appendChild(
        optionsContainer
    );


    // ------------------------------------------
    // Photo
    // ------------------------------------------

    if (question.photo) {

        renderPhotoInput(
            container,
            question.photo
        );

    }
}


// ==================================================
// PHOTO QUESTION
// ==================================================

function renderPhotoQuestion(
    container,
    question
) {

    renderPhotoInput(
        container,
        question
    );
}


// ==================================================
// PHOTO INPUT
// ==================================================

function renderPhotoInput(
    container,
    photoSettings
) {

    const wrapper =
        document.createElement("div");

    wrapper.classList.add(
        "photo-input-wrapper"
    );


    // ------------------------------------------
    // Description
    // ------------------------------------------

    if (photoSettings.description) {

        const description =
            document.createElement("p");

        description.classList.add(
            "photo-description"
        );

        description.textContent =
            photoSettings.description;


        wrapper.appendChild(
            description
        );

    }


    // ------------------------------------------
    // Camera button
    // ------------------------------------------

    const label =
        document.createElement("label");

    label.classList.add(
        "photo-camera-button"
    );


    const icon =
        document.createElement("span");

    icon.classList.add(
        "material-symbols-outlined"
    );

    icon.textContent =
        "photo_camera";


    const text =
        document.createElement("span");

    text.textContent =
        "Ota kuva";


    label.appendChild(
        icon
    );

    label.appendChild(
        text
    );


    // ------------------------------------------
    // Input
    // ------------------------------------------

    const input =
        document.createElement("input");

    input.type = "file";

    input.accept = "image/*";

    input.classList.add(
        "question-photo-input"
    );


    if (
        photoSettings.cameraOnly
    ) {

        input.setAttribute(
            "capture",
            "environment"
        );

    }


    // ------------------------------------------
    // Restore photo
    // ------------------------------------------

    const previousAnswer =
        answers[currentQuestionIndex];


    if (
        previousAnswer &&
        previousAnswer.photo
    ) {

        text.textContent =
            "Kuva otettu";

        label.classList.add(
            "photo-selected"
        );

    }


    // ------------------------------------------
    // Change photo
    // ------------------------------------------

    input.addEventListener(
        "change",
        () => {

            if (
                input.files &&
                input.files.length > 0
            ) {

                const file =
                    input.files[0];


                const currentAnswer =
                    answers[currentQuestionIndex];


                answers[currentQuestionIndex] = {

                    value:
                        currentAnswer?.value || null,

                    photo:
                        file

                };


                text.textContent =
                    "Kuva otettu";


                label.classList.add(
                    "photo-selected"
                );


                console.log(
                    "Photo:",
                    file
                );

            }

        }
    );


    label.appendChild(
        input
    );


    wrapper.appendChild(
        label
    );


    // Required photo label

    if (
        photoSettings.required
    ) {

        const requiredText =
            document.createElement("p");

        requiredText.classList.add(
            "photo-required"
        );

        requiredText.textContent =
            "Vain kamerakuva";

        wrapper.appendChild(
            requiredText
        );

    }


    container.appendChild(
        wrapper
    );
}


// ==================================================
// PERCENTAGE QUESTION
// ==================================================

function renderPercentageQuestion(
    container,
    question
) {

    const wrapper =
        document.createElement("div");

    wrapper.classList.add(
        "percentage-input-wrapper"
    );


    // ------------------------------------------
    // Previous value
    // ------------------------------------------

    if (
        question.previousValue !== undefined
    ) {

        const previous =
            document.createElement("p");

        previous.classList.add(
            "previous-value"
        );

        previous.textContent =
            `Edellinen taso: ${question.previousValue}${question.unit || "%"}`;


        wrapper.appendChild(
            previous
        );

    }


    // ------------------------------------------
    // Slider
    // ------------------------------------------

    const input =
        document.createElement("input");

    input.type =
        "range";

    input.min =
        "0";

    input.max =
        "100";

    input.classList.add(
        "percentage-slider"
    );


    // Restore value

    const previousAnswer =
        answers[currentQuestionIndex];


    if (
        previousAnswer &&
        previousAnswer.value !== undefined
    ) {

        input.value =
            previousAnswer.value;

    } else {

        input.value =
            question.previousValue ??
            0;

    }


    // ------------------------------------------
    // Value display
    // ------------------------------------------

    const value =
        document.createElement("span");

    value.classList.add(
        "percentage-value"
    );


    value.textContent =
        `${input.value}${question.unit || "%"}`;


    // ------------------------------------------
    // Save
    // ------------------------------------------

    input.addEventListener(
        "input",
        () => {

            answers[currentQuestionIndex] = {

                value:
                    Number(input.value)

            };


            value.textContent =
                `${input.value}${question.unit || "%"}`;

        }
    );


    wrapper.appendChild(
        input
    );

    wrapper.appendChild(
        value
    );


    container.appendChild(
        wrapper
    );
}


// ==================================================
// CHECKBOX QUESTION
// ==================================================

function renderCheckboxQuestion(
    container,
    question
) {

    const label =
        document.createElement("label");

    label.classList.add(
        "question-checkbox"
    );


    const input =
        document.createElement("input");

    input.type =
        "checkbox";


    // Restore

    input.checked =
        answers[currentQuestionIndex]?.value === true;


    // Save

    input.addEventListener(
        "change",
        () => {

            answers[currentQuestionIndex] = {

                value:
                    input.checked

            };

        }
    );


    const text =
        document.createElement("span");

    text.textContent =
        question.label ||
        question.title;


    label.appendChild(
        input
    );

    label.appendChild(
        text
    );


    container.appendChild(
        label
    );
}


// ==================================================
// PROGRESS
// ==================================================

function renderProgress() {

    const progressSegments =
        document.querySelector(
            "#progressSegments"
        );

    const questionNumber =
        document.querySelector(
            "#questionNumber"
        );

    const progressPercent =
        document.querySelector(
            "#progressPercent"
        );


    if (!progressSegments) {
        return;
    }


    const total =
        allQuestions.length;


    if (total === 0) {
        return;
    }


    // ------------------------------------------
    // Clear old segments
    // ------------------------------------------

    progressSegments.innerHTML = "";


    // ------------------------------------------
    // Create segments
    // ------------------------------------------

    allQuestions.forEach(
        (_, index) => {

            const segment =
                document.createElement("div");


            segment.classList.add(
                "progress-segment"
            );


            if (
                index < currentQuestionIndex
            ) {

                segment.classList.add(
                    "completed"
                );

            }

            else if (
                index === currentQuestionIndex
            ) {

                segment.classList.add(
                    "current"
                );

            }


            progressSegments.appendChild(
                segment
            );

        }
    );


    // ------------------------------------------
    // Question number
    // ------------------------------------------

    questionNumber.textContent =
        `${currentQuestionIndex + 1} / ${total}`;


    // ------------------------------------------
    // Percentage
    // ------------------------------------------

    const percent =
        Math.round(
            (
                (currentQuestionIndex + 1) /
                total
            ) * 100
        );


    progressPercent.textContent =
        `${percent}%`;
}


// ==================================================
// NAVIGATION
// ==================================================

function setupNavigation() {

    const previousButton =
        document.querySelector(
            "#previousButton"
        );

    const nextButton =
        document.querySelector(
            "#nextButton"
        );


    // ------------------------------------------
    // Previous
    // ------------------------------------------

    previousButton.addEventListener(
        "click",
        () => {

            if (
                currentQuestionIndex > 0
            ) {

                currentQuestionIndex--;

                renderQuestion();

            }

        }
    );


    // ------------------------------------------
    // Next
    // ------------------------------------------

    nextButton.addEventListener(
        "click",
        () => {

            // Validate

            if (
                !validateCurrentQuestion()
            ) {

                return;

            }


            // Next question

            if (
                currentQuestionIndex <
                allQuestions.length - 1
            ) {

                currentQuestionIndex++;

                renderQuestion();

            }

            // Last question

            else {

                finishInspection();

            }

        }
    );
}


// ==================================================
// NAVIGATION BUTTONS
// ==================================================

function updateNavigationButtons() {

    const previousButton =
        document.querySelector(
            "#previousButton"
        );

    const nextButton =
        document.querySelector(
            "#nextButton"
        );


    if (!previousButton || !nextButton) {
        return;
    }


    // ------------------------------------------
    // Previous
    // ------------------------------------------

    previousButton.disabled =
        currentQuestionIndex === 0;


    // ------------------------------------------
    // Next text
    // ------------------------------------------

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


// ==================================================
// VALIDATE CURRENT QUESTION
// ==================================================

function validateCurrentQuestion() {

    const currentItem =
        allQuestions[currentQuestionIndex];


    if (!currentItem) {
        return false;
    }


    const question =
        currentItem.question;


    const answer =
        answers[currentQuestionIndex];


    // ------------------------------------------
    // Required question
    // ------------------------------------------

    if (question.required) {

        if (!answer) {

            alert(
                "Täytä tämä kohta ennen jatkamista."
            );

            return false;

        }


        // Required value

        if (
            answer.value === undefined ||
            answer.value === null ||
            answer.value === ""
        ) {

            alert(
                "Täytä tämä kohta ennen jatkamista."
            );

            return false;

        }

    }


    // ------------------------------------------
    // Required photo
    // ------------------------------------------

    if (
        question.photo &&
        question.photo.required
    ) {

        if (
            !answer ||
            !answer.photo
        ) {

            alert(
                "Ota tarvittava kuva ennen jatkamista."
            );

            return false;

        }

    }


    // ------------------------------------------
    // Photo question
    // ------------------------------------------

    if (
        question.type === "photo" &&
        question.required
    ) {

        if (
            !answer ||
            !answer.photo
        ) {

            alert(
                "Ota kuva ennen jatkamista."
            );

            return false;

        }

    }


    return true;
}


// ==================================================
// FINISH
// ==================================================

function finishInspection() {

    console.log(
        "Inspection completed"
    );


    const inspectionResult = {

        vehicleId:
            vehicle.id_vehicles,

        vehicle:
            vehicle.name,

        vehicleType:
            vehicle.type,

        checklists:
            checklists.map(
                checklist => ({

                    checklistId:
                        checklist.id,

                    formTitle:
                        checklist.formTitle,

                    version:
                        checklist.version

                })
            ),

        answers:
            allQuestions.map(
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

//==================================================
// SUMMARY MODAL
//==================================================

function showSummaryModal(
    inspectionResult
) {

    // ------------------------------------------
    // Overlay
    // ------------------------------------------

    const overlay =
        document.createElement("div");

    overlay.classList.add(
        "summary-overlay"
    );


    // ------------------------------------------
    // Modal
    // ------------------------------------------

    const modal =
        document.createElement("div");

    modal.classList.add(
        "summary-modal"
    );


    // ------------------------------------------
    // Header
    // ------------------------------------------

    const header =
        document.createElement("div");

    header.classList.add(
        "summary-header"
    );


    const title =
        document.createElement("h2");

    title.textContent =
        "Tarkastuksen yhteenveto";


    const closeButton =
        document.createElement("button");

    closeButton.type =
        "button";

    closeButton.classList.add(
        "summary-close"
    );

    closeButton.innerHTML =
        `<span class="material-symbols-outlined">
            close
        </span>`;


    closeButton.addEventListener(
        "click",
        () => {

            overlay.remove();

        }
    );


    header.appendChild(
        title
    );

    header.appendChild(
        closeButton
    );


    modal.appendChild(
        header
    );


    // ------------------------------------------
    // Vehicle information
    // ------------------------------------------

    const vehicleInfo =
        document.createElement("div");

    vehicleInfo.classList.add(
        "summary-vehicle"
    );


    vehicleInfo.innerHTML = `
        <div>
            <span class="material-symbols-outlined">
                local_shipping
            </span>
        </div>

        <div>
            <strong>${escapeHtml(
                inspectionResult.vehicle
            )}</strong>

            <p>${escapeHtml(
                inspectionResult.vehicleType
            )}</p>
        </div>
    `;


    modal.appendChild(
        vehicleInfo
    );


    // ------------------------------------------
    // Answers
    // ------------------------------------------

    const answersContainer =
        document.createElement("div");

    answersContainer.classList.add(
        "summary-answers"
    );


    inspectionResult.answers.forEach(
        (item, index) => {

            const answerCard =
                document.createElement("div");

            answerCard.classList.add(
                "summary-answer"
            );


            const questionNumber =
                document.createElement("span");

            questionNumber.classList.add(
                "summary-question-number"
            );

            questionNumber.textContent =
                index + 1;


            const content =
                document.createElement("div");

            content.classList.add(
                "summary-answer-content"
            );


            const question =
                document.createElement("p");

            question.classList.add(
                "summary-question"
            );

            question.textContent =
                item.question;


            const answer =
                document.createElement("p");

            answer.classList.add(
                "summary-value"
            );

            answer.innerHTML =
                formatSummaryAnswer(
                    item.answer
                );

            const photoImage =
            answer.querySelector(
                ".summary-photo-image"
            );


            if (photoImage) {

            photoImage.addEventListener(
                "click",
            () => {

            showImagePreview(
                photoImage.src
            );

        }
    );

}


            content.appendChild(
                question
            );

            content.appendChild(
                answer
            );


            answerCard.appendChild(
                questionNumber
            );

            answerCard.appendChild(
                content
            );


            answersContainer.appendChild(
                answerCard
            );

        }
    );


    modal.appendChild(
        answersContainer
    );


    // ------------------------------------------
    // Confirmation
    // ------------------------------------------

    const confirmation =
        document.createElement("label");

    confirmation.classList.add(
        "summary-confirmation"
    );


    const checkbox =
        document.createElement("input");

    checkbox.type =
        "checkbox";


    const confirmationText =
        document.createElement("span");

    confirmationText.textContent =
        "Olen lukenut ja vahvistan, että vastaukseni ovat oikein.";


    confirmation.appendChild(
        checkbox
    );

    confirmation.appendChild(
        confirmationText
    );


    modal.appendChild(
        confirmation
    );


    // ------------------------------------------
    // Final button
    // ------------------------------------------

    const submitButton =
        document.createElement("button");

    submitButton.type =
        "button";

    submitButton.classList.add(
        "summary-submit"
    );

    submitButton.textContent =
        "Vahvista tarkastus";


    submitButton.disabled =
        true;


    // Enable only after checkbox

    checkbox.addEventListener(
        "change",
        () => {

            submitButton.disabled =
                !checkbox.checked;

        }
    );


    submitButton.addEventListener(
        "click",
        () => {

            if (!checkbox.checked) {
                return;
            }


            submitInspection(
                inspectionResult
            );

        }
    );


    modal.appendChild(
        submitButton
    );


    // ------------------------------------------
    // Add to page
    // ------------------------------------------

    overlay.appendChild(
        modal
    );

    document.body.appendChild(overlay);

    setTimeout(() => {
        launchFireworks();
    }, 250);
}

//===================================================
// IMAGE REVIEW WHEN CLICK IN PHOTO
//===================================================
function showImagePreview(
    imageUrl
) {

    const overlay =
        document.createElement("div");

    overlay.classList.add(
        "image-preview-overlay"
    );


    const image =
        document.createElement("img");

    image.src =
        imageUrl;

    image.classList.add(
        "image-preview"
    );


    overlay.appendChild(
        image
    );


    overlay.addEventListener(
        "click",
        () => {

            overlay.remove();

        }
    );


    document.body.appendChild(
        overlay
    );
}

//===================================================
// SUMMARY ANSWER FORMAT
//===================================================
function formatSummaryAnswer(answer) {

    if (!answer) {

        return `
            <span class="summary-empty">
                Ei vastausta
            </span>
        `;
    }


    // ==========================================
    // PHOTO
    // ==========================================

    if (answer.photo) {

        const photoName =
            answer.photo.name ||
            "Kuva";


        // Create temporary URL for File
        const imageUrl =
            URL.createObjectURL(
                answer.photo
            );


        let html = `
            <div class="summary-photo-container">

                <img
                    src="${imageUrl}"
                    class="summary-photo-image"
                    alt="Tarkastuskuva"
                >

                <span class="summary-photo-name">
                    ${escapeHtml(photoName)}
                </span>

            </div>
        `;


        // If question also has a normal value
        if (
            answer.value !== undefined &&
            answer.value !== null &&
            answer.value !== ""
        ) {

            html =
                `<div class="summary-answer-value">
                    ${escapeHtml(
                        String(answer.value)
                    )}
                </div>` +
                html;
        }


        return html;
    }


    // ==========================================
    // NORMAL VALUE
    // ==========================================

    if (
        answer.value !== undefined &&
        answer.value !== null
    ) {

        return escapeHtml(
            String(answer.value)
        );
    }


    return `
        <span class="summary-empty">
            Ei vastausta
        </span>
    `;
}

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

//===================================================
// SUBMIT
//===================================================
function submitInspection(
    inspectionResult
) {

    console.log(
        "Submitting inspection:",
        inspectionResult
    );


    alert(
        "Tarkastus on vahvistettu!"
    );

}


// ==================================================
// BACK BUTTON
// ==================================================

function setupBackButton() {

    const backButton =
        document.querySelector(".back-button");


    if (!backButton) {
        return;
    }


    backButton.addEventListener(
        "click",
        () => {

            const params =
                new URLSearchParams(
                    window.location.search
                );

            const vehicleId =
                params.get("id");


            if (!vehicleId) {

                console.error(
                    "Vehicle ID puuttuu."
                );

                return;
            }


            window.location.href =
                `inspection-step.html?id=${vehicleId}`;

        }
    );
}


// ==================================================
// ERROR
// ==================================================

function showError(message) {

    const container =
        document.querySelector(
            "#questionContainer"
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

    error.textContent =
        `Virhe: ${message}`;


    container.appendChild(
        error
    );
}

//==========================================
// CONFETTI
//==========================================
function launchFireworks() {
    const container = document.createElement("div");
    container.classList.add("fireworks-container");

    const bursts = 3;

    for (let b = 0; b < bursts; b++) {
        setTimeout(() => {
            createFireworkBurst(container);
        }, b * 450);
    }

    document.body.appendChild(container);

    setTimeout(() => {
        container.remove();
    }, 3500);
}


function createFireworkBurst(container) {

    const burst = document.createElement("div");
    burst.classList.add("firework-burst");

    
    const centerX = 50 + (Math.random() * 10 - 5);
    const centerY = 50 + (Math.random() * 10 - 5);

    burst.style.left = `${centerX}%`;
    burst.style.top = `${centerY}%`;

    
    const particleCount = 70;

    for (let i = 0; i < particleCount; i++) {

        const particle = document.createElement("span");
        particle.classList.add("firework-particle");

        const angle = (360 / particleCount) * i;

        
        const distance = 180 + Math.random() * 280;

        particle.style.setProperty(
            "--angle",
            `${angle}deg`
        );

        particle.style.setProperty(
            "--distance",
            `${distance}px`
        );

       
        const size = 7 + Math.random() * 7;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        particle.style.animationDelay =
            `${Math.random() * 0.08}s`;

        burst.appendChild(particle);
    }

    container.appendChild(burst);

    setTimeout(() => {
        burst.remove();
    }, 2200);
}