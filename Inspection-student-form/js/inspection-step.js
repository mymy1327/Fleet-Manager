let vehicle = null;

let checklists = [];
let allQuestions = [];

let currentQuestionIndex = 0;

let answers = [];

document.addEventListener("DOMContentLoaded", () => {
    initInspection();
});


async function initInspection() {

    try {

        // Get vehicle ID from URL

        const params =
            new URLSearchParams(window.location.search);

        const vehicleId =
            Number(params.get("id"));


        if (!vehicleId) {
            throw new Error("Vehicle ID puuttuu.");
        }


        // Load JSON files

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
                "vehicles-checklists.json lataaminen epäonnistui."
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


        // Find vehicle

        vehicle =
            vehiclesData.vehicles.find(
                item => item.id_vehicles === vehicleId
            );


        if (!vehicle) {

            throw new Error(
                `Ajoneuvoa ID:llä ${vehicleId} ei löydy.`
            );

        }

        // Find checklists belonging to this vehicle

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


        // Get checklist IDs

        const checklistIds =
            vehicleChecklistRelations.map(
                item => item.id_checklists
            );


        // --------------------------------
        // Get actual checklists
        // --------------------------------

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


        // --------------------------------
        // Create one question list
        // from all checklists
        // --------------------------------

        allQuestions = [];


        checklists.forEach(checklist => {

            checklist.questions.forEach(
                question => {

                    allQuestions.push({

                        checklistId:
                            checklist.id,

                        formTitle:
                            checklist.formTitle,

                        version:
                            checklist.version,

                        question: question

                    });

                }
            );

        });


        if (allQuestions.length === 0) {

            throw new Error(
                "Tarkastuslistoissa ei ole kysymyksiä."
            );

        }


        // --------------------------------
        // Create answer array
        // --------------------------------

        answers =
            allQuestions.map(() => null);


        // --------------------------------
        // Render first question
        // --------------------------------

        renderQuestion();

        renderProgress();

        updateNavigationButtons();


        // --------------------------------
        // Setup buttons
        // --------------------------------

        setupNavigation();

        setupBackButton();


    } catch (error) {

        console.error(
            "Inspection error:",
            error
        );

        showError(error.message);

    }
}


// ========================================
// RENDER QUESTION
// ========================================

function renderQuestion() {

    const container =
        document.querySelector("#questionContainer");

    container.innerHTML = "";

    const currentItem =
        allQuestions[currentQuestionIndex];

    const question =
        currentItem.question;


    // --------------------------------
    // Question icon
    // --------------------------------

    const icon =
        document.createElement("span");

    icon.classList.add(
        "material-symbols-outlined"
    );

    icon.textContent =
        question.icon || "check_circle";


    container.appendChild(icon);


    // --------------------------------
    // Question title
    // --------------------------------

    const title =
        document.createElement("h2");

    title.classList.add(
        "question-title"
    );

    title.textContent =
        question.title;

    container.appendChild(title);


    // --------------------------------
    // Question content
    // --------------------------------

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

            break;
    }


    container.appendChild(content);
}


// ========================================
// NUMBER QUESTION
// ========================================

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


    if (previousAnswer !== null) {

        input.value =
            previousAnswer;

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


    input.addEventListener(
        "input",
        () => {

            answers[currentQuestionIndex] =
                input.value;

        }
    );


    container.appendChild(
        wrapper
    );
}


// ========================================
// CHOICE QUESTION
// ========================================

function renderChoiceQuestion(
    container,
    question
) {

    const optionsContainer =
        document.createElement("div");

    optionsContainer.classList.add(
        "question-options"
    );


    question.options.forEach(
        option => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.classList.add(
                "question-option"
            );


            button.textContent =
                option;


            // Restore answer

            if (
                answers[currentQuestionIndex] ===
                option
            ) {

                button.classList.add(
                    "selected"
                );

            }


            // Select option

            button.addEventListener(
                "click",
                () => {

                    answers[currentQuestionIndex] =
                        option;


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


    // --------------------------------
    // Optional photo
    // --------------------------------

    if (question.photo) {

        renderPhotoInput(
            container,
            question.photo
        );

    }
}


// ========================================
// PHOTO QUESTION
// ========================================

function renderPhotoQuestion(
    container,
    question
) {

    renderPhotoInput(
        container,
        question
    );
}


// ========================================
// PHOTO INPUT
// ========================================

function renderPhotoInput(
    container,
    photoSettings
) {

    const wrapper =
        document.createElement("div");

    wrapper.classList.add(
        "photo-input-wrapper"
    );


    // Description

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


    // Camera input

    const input =
        document.createElement("input");

    input.type = "file";

    input.accept = "image/*";


    if (photoSettings.cameraOnly) {

        input.capture = "environment";

    }


    input.classList.add(
        "question-photo-input"
    );


    input.addEventListener(
        "change",
        () => {

            if (input.files.length > 0) {

                answers[currentQuestionIndex] = {
                    photo: input.files[0]
                };

            }

        }
    );


    wrapper.appendChild(
        input
    );


    container.appendChild(
        wrapper
    );
}


// ========================================
// PERCENTAGE QUESTION
// ========================================

function renderPercentageQuestion(
    container,
    question
) {

    const wrapper =
        document.createElement("div");

    wrapper.classList.add(
        "percentage-input-wrapper"
    );


    // Previous value

    if (
        question.previousValue !== undefined
    ) {

        const previous =
            document.createElement("p");

        previous.classList.add(
            "previous-value"
        );

        previous.textContent =
            `Edellinen arvo: ${question.previousValue}${question.unit || ""}`;


        wrapper.appendChild(
            previous
        );

    }


    // Slider

    const input =
        document.createElement("input");

    input.type = "range";

    input.min = "0";

    input.max = "100";

    input.value =
        answers[currentQuestionIndex] ??
        question.previousValue ??
        0;


    input.classList.add(
        "percentage-slider"
    );


    // Value display

    const value =
        document.createElement("span");

    value.classList.add(
        "percentage-value"
    );


    value.textContent =
        `${input.value}${question.unit || ""}`;


    input.addEventListener(
        "input",
        () => {

            answers[currentQuestionIndex] =
                Number(input.value);


            value.textContent =
                `${input.value}${question.unit || ""}`;

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


// ========================================
// CHECKBOX QUESTION
// ========================================

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

    input.type = "checkbox";


    // Restore answer

    input.checked =
        answers[currentQuestionIndex] === true;


    input.addEventListener(
        "change",
        () => {

            answers[currentQuestionIndex] =
                input.checked;

        }
    );


    const text =
        document.createElement("span");

    text.textContent =
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


// ========================================
// PROGRESS
// ========================================

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


    progressSegments.innerHTML = "";


    // --------------------------------
    // Create segments
    // --------------------------------

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


    // --------------------------------
    // Question number
    // --------------------------------

    questionNumber.textContent =
        `${currentQuestionIndex + 1} / ${allQuestions.length}`;


    // --------------------------------
    // Percentage
    // --------------------------------

    const percent =
        Math.round(
            (
                (currentQuestionIndex + 1) /
                allQuestions.length
            ) * 100
        );


    progressPercent.textContent =
        `${percent}%`;
}


// ========================================
// NAVIGATION
// ========================================

function setupNavigation() {

    const previousButton =
        document.querySelector(
            "#previousButton"
        );

    const nextButton =
        document.querySelector(
            "#nextButton"
        );


    // --------------------------------
    // Previous
    // --------------------------------

    previousButton.addEventListener(
        "click",
        () => {

            if (
                currentQuestionIndex > 0
            ) {

                currentQuestionIndex--;

                renderQuestion();

                renderProgress();

                updateNavigationButtons();

            }

        }
    );


    // --------------------------------
    // Next
    // --------------------------------

    nextButton.addEventListener(
        "click",
        () => {

            if (
                !validateCurrentQuestion()
            ) {

                return;

            }


            if (
                currentQuestionIndex <
                allQuestions.length - 1
            ) {

                currentQuestionIndex++;

                renderQuestion();

                renderProgress();

                updateNavigationButtons();

            }

            else {

                finishInspection();

            }

        }
    );
}


// ========================================
// NAVIGATION BUTTON TEXT
// ========================================

function updateNavigationButtons() {

    const previousButton =
        document.querySelector(
            "#previousButton"
        );

    const nextButton =
        document.querySelector(
            "#nextButton"
        );


    // Previous

    previousButton.disabled =
        currentQuestionIndex === 0;


    // Next

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


// ========================================
// VALIDATE QUESTION
// ========================================

function validateCurrentQuestion() {

    const currentItem =
        allQuestions[currentQuestionIndex];

    const question =
        currentItem.question;

    const answer =
        answers[currentQuestionIndex];


    // --------------------------------
    // Required
    // --------------------------------

    if (
        question.required &&
        (
            answer === null ||
            answer === undefined ||
            answer === "" ||
            answer === false
        )
    ) {

        alert(
            "Täytä tämä kohta ennen jatkamista."
        );

        return false;

    }


    // --------------------------------
    // Required photo
    // --------------------------------

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


    // --------------------------------
    // Photo question
    // --------------------------------

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


// ========================================
// FINISH INSPECTION
// ========================================

function finishInspection() {

    console.log(
        "Inspection completed."
    );


    // --------------------------------
    // Create result
    // --------------------------------

    const inspectionResult = {

        vehicleId:
            vehicle.id,

        vehicleName:
            vehicle.name,

        vehicleType:
            vehicle.type,

        vehiclePlate:
            vehicle.plate,

        kilometers:
            vehicle.kilometers,

        date:
            new Date().toISOString(),

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


    // --------------------------------
    // Show result
    // --------------------------------

    console.log(
        inspectionResult
    );


    alert(
        "Tarkastus on valmis!"
    );


    /*
        Later:

        Send inspectionResult
        to database.
    */
}


// ========================================
// BACK BUTTON
// ========================================

function setupBackButton() {

    const backButton =
        document.querySelector(
            ".back-button"
        );


    if (!backButton) {
        return;
    }


    backButton.addEventListener(
        "click",
        () => {

            window.history.back();

        }
    );
}


// ========================================
// ERROR
// ========================================

function showError(message) {

    const container =
        document.querySelector(
            "#questionContainer"
        );


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