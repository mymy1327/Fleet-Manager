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
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

async function getVehicle(code, onComplete = null) {
  //Load vehicle from API
  const [ok, vehicles] = await SendGetAPIAndHandleErrors(restapi + "/api/vehicles?code=" + encodeURIComponent(code));
  if (!ok) {
    return;
  }

  //Validate vehicle info
  if (!Array.isArray(vehicles) || !vehicles.length) {
    console.error("Vehicle not found.");
    return;
  }

  //Get vehicle
  const vehicle = vehicle[0];
  if (!vehicle.id_vehicles) {
    console.error("Vehicle ID not found.");
    return;
  }
  vehicleId = vehicle.id_vehicles;
  console.log("Vehicle ID:", vehicleId);
  await getVehicleById(vehicleId, onComplete);
}
async function getVehicleById(id, onComplete = null) {
  //Load vehicle from API
  const [ok, vehicle] = await SendGetAPIAndHandleErrors(restapi + "/api/vehicles/" + encodeURIComponent(id));
  if (!ok) {
    if (onComplete) onComplete();
    return;
  }

  //Process vehicle
  vehicleId = vehicle.id_vehicles;
  checklists = Array.isArray(vehicle.checklist) ? vehicle.checklist : [];
  previousKilometers = vehicle.km ?? null;
  console.log("Checklists:", checklists);
  if (onComplete) onComplete();
}

//Get Inspection history base on the vehicleId to get the type of last Inspection
async function getInspections(vehicleId, onComplete = null) {
  //Load latest inspection from API
  const [ok, inspections] = await SendGetAPIAndHandleErrors(restapi + "/api/inspections?id_vehicles=" + encodeURIComponent(vehicleId) + "&order_by=date&order_way=DESC&limit=1")
  if (!ok) {
    inspections = [];
    if (onComplete) onComplete();
    return;
  }

  //Process inspections
      const latest = inspections[0];
      if (latest && latest.type === "departure") {
        previousInspection = latest;
        await renderPreviousInspection(latest);
      } else {
        previousInspection = null;
      }
      if (onComplete) onComplete();
}

async function formatInspectionDate(date) {
  //Format empty date
  if (!date) return "-";

  //Check for valid value
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) {
    return date;
  }

  //Render date
  return value.toLocaleString(await window.GetTranslationData().GetRegionLanguage(), {
    dateStyle: "short",
    timeStyle: "short",
  });
}

// Render the lastInspection info on the left
async function renderPreviousInspection(inspection) {
  const container = document.getElementById("previousInspection");
  if (!container) return;
  container.style.display = "block";
  const date = await formatInspectionDate(inspection.date);
  container.innerHTML = `
        <div class="previous-inspection-card">
            <h3 data-i18n='previousCardHeader'>Edellinen tarkastus</h3>
            <span class="previous-inspection-status status-label ${Number(inspection.passed) === 1 ? "passed" : "failed"} data-i18n='${Number(inspection.passed) === 1 ? "passed" : "failed"}'">${Number(inspection.passed) === 1 ? "Hyväksytty" : "Hylätty"}</span>
            <p><strong data-i18n='note'>Huomio:</strong> ${inspection.note || "-"}</p>
            <p><strong data-i18n='date'>Päivä:</strong> ${date}</p>
            <p><strong data-i18n='kilometer'>Kilometrit:</strong> ${inspection.km ?? "-"} km</p>
            <p><strong data-i18n='fuel'>Polttoaine:</strong> ${inspection.fuel ?? 0}%</p>
        </div>
    `;
}

// Initialize the inspection page
document.addEventListener("DOMContentLoaded", async () => {
  //Validate code
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code) {
    showErrorMessage(await GetTranslationData().Translate("noCode", "Ajoneuvon tunnistetta ei löytynyt."));
    return;
  }
  vehicleCode = code;

  //Get vehicle info
  getVehicle(code, async () => {
    //Check if valid checklist
    if (!vehicle || !checklists.length) {
      showErrorMessage(await GetTranslationData().Translate("noChecklist", "Ajoneuvon tietoja ei löytynyt."));
      return;
    }

    //Create answer list
    currentQuestionIndex = 0;
    answers = checklists.map(() => ({
      answer: null,
      kilometer: null,
      fuel: null,
      oilPhoto: null,
      oilPhotoConfirmed: false,
      error: null,
    }));

    //Render everything
    renderVehicleInformation();
    renderProgress();
    await renderQuestion();
    await updateNavigationButtons();
    setupNavigation();
    setupBackButton();
    setupSummaryModal();
    setupInspectionNote();

    //Get inspections
    await getInspections(vehicle.id_vehicles);
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
async function renderQuestion() {
  //Get container
  const container = document.getElementById("questionContainer");
  if (!container) {
    console.error("#questionContainer not found");
    return;
  }

  //Get checklist for question
  const checklist = checklists[currentQuestionIndex];
  if (!checklist) {
    console.error("Checklist not found:", currentQuestionIndex);
    return;
  }

  //Get information from checklist
  const questionName = checklist.name || await GetTranslationData().Translate("inspection");
  const description = checklist.description || "";
  const normalizedQuestionName = questionName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const isOilQuestion = normalizedQuestionName.includes("oljy") || normalizedQuestionName.includes("oil");
  const currentAnswer = answers[currentQuestionIndex]?.answer;
  const hasFault = currentAnswer === "Report Faults";

  //Put to HTML
  container.innerHTML = `
        <div class="question-layout ${hasFault ? "has-fault" : ""}">
            <div class="question-header">
                <span class="material-symbols-outlined question-icon">${getQuestionIcon(questionName)}</span>
                <h2 class="question-title">${escapeHTML(questionName)}</h2>
                <span class="required-label" data-i18n='required'>Pakollinen</span>
            </div>
            ${description ? `<p class="question-description">${escapeHTML(description)}</p>` : ""}
            <div class="question-content">
                ${isOilQuestion && !hasFault ? await renderOilPhoto() : ""}
                <div id="answerOptions" class="question-options"></div>
            </div>
            <div id="faultContainer" class="fault-container" style="${hasFault ? "" : "display:none;"}"></div>
        </div>
    `;
  await renderAnswerOptions(checklist);

  // Fault photo/UI
  if (hasFault) {
    await renderFaultForm();
  }

  //Update progress
  await restoreCurrentAnswer();
  renderProgress();
  await updateNavigationButtons();
  updateInspectionNoteVisibility();

  // Oil photo is only active when NOT reporting a fault
  if (isOilQuestion && !hasFault) {
    setupOilCamera();
  }
}

async function restoreCurrentAnswer() {
  //Get current answer
  const current = answers[currentQuestionIndex];
  if (!current) {
    return;
  }

  //Check if valid
  if (current.answer && current.answer !== "Report Faults") {
    const selected = document.querySelector(`.question-option[data-value="${CSS.escape(String(current.answer))}"]`);
    if (selected) {
      selected.classList.add("selected");
    }
  }

  //Show kilometer input
  if (current.answer === "Report Faults" && current.kilometer != null) {
    const kilometerInput = document.querySelector("#kilometerInput");
    if (kilometerInput) {
      kilometerInput.value = current.kilometer;
    }
  }

  //Show oil photo button
  if (current.oilPhoto) {
    const oilButton = document.getElementById("oilPhotoButton");
    if (oilButton) {
      oilButton.classList.add("photo-selected");
      oilButton.innerHTML = `
                <span class="material-symbols-outlined">
                    check_circle
                </span>

                ` + await GetTranslationData().Translate("photoTaken","Kuva otettu");
    }

    /*
     * IMPORTANT:
     * Restore actual image preview
     */
    await showQuestionPhotoPreview("oilPhotoPreview", current.oilPhoto);
  }

  //Render faults
  if (current.answer === "Report Faults") {
    const layout = document.querySelector(".question-layout");
    if (layout) {
      layout.classList.add("has-fault");
    }
    await renderFaultForm();

    /*Restore description*/
    const description = document.getElementById("faultDescription");
    if (description && current.error) {
      description.value = current.error.description || "";
    }

    /*Restore priority*/
    const priority = current.error?.priority;
    if (priority) {
      const priorityButton = document.querySelector(`[data-priority="${CSS.escape(priority)}"]`);
      if (priorityButton) {
        priorityButton.classList.add("selected");
      }
    }

    /*Restore fault photo*/
    if (current.error?.photo) {
      const faultButton = document.getElementById("faultPhotoButton");
      if (faultButton) {
        faultButton.classList.add("photo-selected");
        faultButton.innerHTML = `
                    <span class="material-symbols-outlined">
                        check_circle
                    </span>

                    ` + await GetTranslationData().Translate("imageSelected","Kuva valittu");
      }
      await showQuestionPhotoPreview("faultPhotoPreview", current.error.photo);
    }
  }
}


/*IMPOTTANT ERROR: WILL NOT WORK BECAUSE OF FINNISH NAMES*/
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

async function renderAnswerOptions(checklist) {
  //Check for container
  const container = document.getElementById("answerOptions");
  if (!container) return;
  container.innerHTML = "";
  const questionName = (checklist.name || "").toLowerCase();

  // Kilometer
  if (questionName === "kilometrilukema") {
    await renderKilometerInput(container);
    return;
  }

  // Fuel
  if (questionName === "polttoaineen määrä") {
    await renderFuelGauge(container);
    return;
  }

  //Create good button
  const goodButton = document.createElement("button");
  goodButton.type = "button";
  goodButton.className = "question-option";
  goodButton.dataset.value = await GetTranslationData().Translate("good","Hyvä");
  goodButton.textContent = await GetTranslationData().Translate("good","Hyvä");

  //Add event listener
  goodButton.addEventListener("click", async () => {
    await selectAnswer(await GetTranslationData().Translate("good","Hyvä"));
  });
  container.appendChild(goodButton);

  // Report fault
  const faultButton = document.createElement("button");
  const current = answers[currentQuestionIndex];
  faultButton.type = "button";
  faultButton.className = `question-option report-fault ${current.answer === "Report Faults" ? "selected" : ""}`;
  faultButton.dataset.value = "Report Faults";

  //Set text
  faultButton.innerHTML = `
        <span class="material-symbols-outlined">
            report_problem
        </span>
        ` + await GetTranslationData().Translate("reportProblem","Ilmoita vika");

  //Add event listener
  faultButton.addEventListener("click", async () => {
    await selectFault();
  });
  container.appendChild(faultButton);
}

async function selectAnswer(value) {
  //Set current answer
  const current = answers[currentQuestionIndex];
  current.answer = value;
  current.error = null;

  //Get checklist item
  const checklist = checklists[currentQuestionIndex];
  const questionName = checklist?.name || "";

  //Normalize name
  const normalizedName = questionName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  //Oil question
  const isOilQuestion = normalizedName.includes("oljy") || normalizedName.includes("oil");
  if (isOilQuestion && value !== "Report Faults") {
    current.oilPhotoConfirmed = false;
  }
  await renderQuestion();
}

async function selectFault() {
  //Get current info
  const current = answers[currentQuestionIndex];
  const checklist = checklists[currentQuestionIndex];
  const isOilQuestion = (checklist?.name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .includes("oljy");

  // If in report fault, click again => cancel
  if (current.answer === "Report Faults") {
    current.answer = current.previousAnswer ?? null;
    current.error = null;
    if (isOilQuestion) {
      current.oilPhoto = null;
      current.oilPhotoConfirmed = false;
    }
    await renderQuestion();
    return;
  }

  // If turn back to normal, will ask to take picture of the oil stick
  current.previousAnswer = current.answer;
  current.answer = "Report Faults";
  if (!current.error) {
    current.error = {
      photo: null,
      description: "",
      priority: null,
    };
  }
  if (isOilQuestion) {
    current.oilPhoto = null;
    current.oilPhotoConfirmed = false;
  }

  //Render
  await renderQuestion();
  await updateNavigationButtons();
}

async function renderFaultForm() {
  //Get container
  const container = document.getElementById("faultContainer");
  if (!container) return;
  container.style.display = "block";

  //Insert HTML
  container.innerHTML = `
        <h3 class="fault-title">Report</h3>
        <div class="photo-input-wrapper">
            <p class="photo-description" data-i18n='photoDescription'>Ota kuva viasta.</p>
            <button type="button" class="photo-camera-button" id="faultPhotoButton">
                <span class="material-symbols-outlined">photo_camera</span>
                ` + await GetTranslationData().Translate("photoDescription","Ota kuva viasta.") + `
            </button>
            <div id="faultPhotoPreview" class="question-photo-preview"></div>
        </div>
        <textarea id="faultDescription" class="fault-description" placeholder="Kuvaile vika..."></textarea>
        <div class="fault-priority">
            <p class="fault-label">Vian prioriteetti</p>
            <button type="button" class="question-option" data-i18n='low' data-priority="low">Matala</button>
            <button type="button" class="question-option" data-i18n='medium' data-priority="medium">Keskitaso</button>
            <button type="button" class="question-option" data-i18n='high' data-priority="high">Korkea</button>
            <button type="button" class="question-option" data-i18n='critical' data-priority="critical">Kriittinen</button>
        </div>
    `;

  //Render
  await setupFaultForm();
  await setupFaultCamera();
}

async function setupFaultCamera() {
  //Get button
  const button = document.getElementById("faultPhotoButton");
  if (!button) {
    console.error("#faultPhotoButton not found");
    return;
  }

  //Add event listener
  button.onclick = () => {
    //Open camera
    openCamera("fault", async (picture) => {
      //Create error
      if (!answers[currentQuestionIndex].error) {
        answers[currentQuestionIndex].error = {};
      }
      answers[currentQuestionIndex].error.photo = picture;
      answers[currentQuestionIndex].error.photoConfirmed = true;

      //Show photo
      await showQuestionPhotoPreview("faultPhotoPreview", picture);
      button.classList.add("photo-selected");
      button.innerHTML = `
                <span class="material-symbols-outlined">check_circle</span>
                ` + await GetTranslationData().Translate("imageSelected","Kuva valittu");

      //Render
      await updateNavigationButtons();
    });
  };
}

async function setupFaultForm() {
  //Get description
  const description = document.getElementById("faultDescription");
  if (description) {
    //Add event listener
    description.addEventListener("input", async () => {
      //Set value
      if (!answers[currentQuestionIndex].error) {
        answers[currentQuestionIndex].error = {};
      }
      answers[currentQuestionIndex].error.description = description.value;

      //Render
      await updateNavigationButtons();
    });
  }

  //Get all elements
  document.querySelectorAll("[data-priority]").forEach((button) => {
    //Add event listener
    button.addEventListener("click", async () => {
      //Clear selected from all others
      document.querySelectorAll("[data-priority]").forEach((item) => {
        item.classList.remove("selected");
      });

      //Select current
      button.classList.add("selected");

      //Set priority
      if (!answers[currentQuestionIndex].error) {
        answers[currentQuestionIndex].error = {};
      }
      answers[currentQuestionIndex].error.priority = button.dataset.priority;

      //Render
      await updateNavigationButtons();
    });
  });
}

async function renderOilPhoto() {
  return `
        <div class="photo-input-wrapper">
            <p class="photo-description">Ota kuva moottoriöljyn mittatikusta. Kuva on pakollinen.</p>
            <button type="button" class="photo-camera-button" id="oilPhotoButton">
                <span class="material-symbols-outlined">photo_camera</span>
                Ota kuva mittatikusta
            </button>
            <div id="oilPhotoPreview" class="question-photo-preview"></div>
            <p class="photo-required">* ` + await GetTranslationData().Translate("requiredImage","Pakollinen kuva")`</p>
        </div>
    `;
}

function setupOilCamera() {
  //Get button
  const button = document.getElementById("oilPhotoButton");
  if (!button) return;

  //Add event listener
  button.onclick = () => {
    //Open camera
    openCamera("oil", async (picture) => {
      //Save picture
      answers[currentQuestionIndex].oilPhoto = picture;
      answers[currentQuestionIndex].oilPhotoConfirmed = true;

      //Render
      await showQuestionPhotoPreview("oilPhotoPreview", picture);
    });
  };
}

async function showQuestionPhotoPreview(elementId, picture) {
  //Get container
  const container = document.getElementById(elementId);
  if (!container || !picture) {
    return;
  }

  //Get photo URL
  const imageUrl = getPhotoURL(picture);

  //Render image
  container.innerHTML = `
        <div class="question-photo-preview-content">

            <img
                src="${escapeHTML(imageUrl)}"
                alt="` + await GetTranslationData().Translate("capturedImage","Otettu kuva")`"
            >

            <span class="photo-success">
                ` + await GetTranslationData().Translate("imageSelected","Kuva valittu")`
            </span>

        </div>
    `;
}

async function setupOilPhoto() {
  //Get elements
  const input = document.getElementById("oilPhotoInput");
  const button = document.getElementById("oilPhotoButton");
  if (!input || !button) return;

  //Add event listener
  input.addEventListener("change", async () => {
    //Get file
    const file = input.files[0];
    if (!file) return;

    //Store photo
    answers[currentQuestionIndex].oilPhoto = file;
    button.classList.add("photo-selected");

    //Update HTML
    button.innerHTML = `
            <span class="material-symbols-outlined">
                check_circle
            </span>
            ` + await GetTranslationData().Translate("photoTaken","Kuva otettu") + `
        `;

    //Render
    await updateNavigationButtons();
  });
}

function renderProgress() {
  //Get elements
  const questionNumber = document.getElementById("questionNumber");
  const progressPercent = document.getElementById("progressPercent");
  const progressSegments = document.getElementById("progressSegments");
  if (!questionNumber || !progressPercent || !progressSegments) {
    console.error("Progress elements not found.");
    return;
  }

  //Get total
  const total = checklists.length;
  if (total === 0) {
    questionNumber.textContent = "0 / 0";
    progressPercent.textContent = "0%";
    progressSegments.innerHTML = "";
    return;
  }

  //Calculate percentage
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

async function updateNavigationButtons() {
  //Get elements
  const previousButton = document.getElementById("previousButton");
  const nextButton = document.getElementById("nextButton");

  //Disable button on 0
  if (previousButton) {
    previousButton.disabled = currentQuestionIndex === 0;
  }

  //Change text based on page
  if (nextButton) {
    if (currentQuestionIndex === checklists.length - 1) {
      nextButton.textContent = await GetTranslationData().Translate("done","Valmis");
    } else {
      nextButton.textContent = await GetTranslationData().Translate("next", "Seuraava");
    }
  }
}

function setupNavigation() {
  //Get elements
  const previousButton = document.getElementById("previousButton");
  const nextButton = document.getElementById("nextButton");

  //Add event listeners
  if (previousButton) {
    previousButton.onclick = previousQuestion;
  }
  if (nextButton) {
    nextButton.onclick = nextQuestion;
  }
}

async function previousQuestion() {
  //Check if can go back
  if (currentQuestionIndex <= 0) {
    return;
  }
  currentQuestionIndex--;

  //Render
  await renderQuestion();
  renderProgress();
  await updateNavigationButtons();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function nextQuestion() {
  //Chekc if valid
  if (!await validateCurrentQuestion()) {
    return;
  }

  //Check if can continue
  if (currentQuestionIndex < checklists.length - 1) {
    currentQuestionIndex++;

    //Render
    await renderQuestion();
    renderProgress();
    await updateNavigationButtons();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  // Last question
  await finishInspection();
}

async function validateCurrentQuestion() {
  //Get items
  const checklist = checklists[currentQuestionIndex];
  const current = answers[currentQuestionIndex];
  if (!checklist || !current) return false;
  const name = (checklist.name || "").toLowerCase();

  // Kilometer validation
  if (name === "kilometrilukema") {
    //Check if entered kilometers
    const km = current.kilometer;
    if (km === null || km === undefined || km === "") {
      alert(await GetTranslationData().Translate("enterMileage", "Syötä kilometrilukema."));
      return false;
    }

    //Check if not too small
    if (Number(km) < Number(previousKilometers)) {
      alert(await GetTranslationData().Translate("tooLowKilometres","Kilometrilukema ei voi olla pienempi kuin edellinen lukema") + ` (${previousKilometers} km).`);
      return false;
    }
    if (current.answer === "Report Faults") return await validateFault(current);
    return true;
  }

  // Fuel validation
  if (name === "polttoaineen määrä") {
    if (current.fuel === null || current.fuel === undefined) {
      alert(await GetTranslationData().Translate("setFuel","Valitse polttoaineen määrä."));
      return false;
    }
    if (current.answer === "Report Faults") return await validateFault(current);
    return true;
  }

  // General answer validation
  if (!current.answer) {
    alert( await GetTranslationData().Translate("setAnswer","Valitse vastaus ennen jatkamista."));
    return false;
  }

  // Oil photo is required only in normal Oil mode.
  if (name.includes("öljy") && current.answer !== "Report Faults" && !current.oilPhoto) {
    alert(await GetTranslationData().Translate("setOilPhoto","Ota kuva moottoriöljyn mittatikusta."));
    return false;
  }

  // Fault validation
  if (current.answer === "Report Faults") {
    return await validateFault(current);
  }
  return true;
}

async function validateFault(current) {
  //Check photo error
  if (!current.error?.photo) {
    alert(await GetTranslationData().Translate("takePhoto","Ota kuva viasta ennen jatkamista."));
    return false;
  }

  //Check description error
  if (!current.error.description?.trim()) {
    alert(await GetTranslationData().Translate("describeFault","Kuvaile vika ennen jatkamista."));
    return false;
  }

  //Check priority error
  if (!current.error.priority) {
    alert(await GetTranslationData().Translate("selectPriority", "Valitse vian prioriteetti."));
    return false;
  }
  return true;
}

async function finishInspection() {
  //Validate
  if (!await validateCurrentQuestion()) {
    return;
  }

  //Create result
  const inspectionResult = {
    vehicleId: vehicle?.id_vehicles || null,
    vehicle: vehicle?.name || document.querySelector(".vehicle-name")?.textContent || "",
    vehicleType: vehicle?.type || "",
    licensePlate: vehicle?.license_plate || vehicle?.plate || "",
    checklists: checklists.map((checklist) => ({
      checklistId: checklist.id_checklists,
      vehicleId: checklist.id_vehicles,
      name: checklist.name,
      description: checklist.description || "",
    })),

    answers: checklists.map((checklist, index) => ({
      checklistId: checklist.id_checklists,
      question: checklist.name,
      description: checklist.description || "",
      answer: answers[index] || null,
    })),
  };

  /*
   * Show fireworks when inspection reaches 100%
   */
  showFireworks();

  /*
   * Small delay so fireworks can appear
   * before summary opens
   */
  setTimeout(async () => {
    await showSummaryModal(inspectionResult);
  }, 500);
}

async function showSummaryModal(inspectionResult) {
  //Get modal
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
  const plate = inspectionResult.licensePlate ? inspectionResult.licensePlate : "";

  //Show vehicle info
  if (vehicleElement) {
    vehicleElement.textContent = inspectionResult.vehicle || await GetTranslationData().Translate("vehicleName","Ajoneuvo");
  }
  if (vehicleDetails) {
    vehicleDetails.textContent = plate ? `Rekisterinumero: ${plate}` : "";
  }

  /*
   * Answers
   */
  const answersContainer = modal.querySelector(".summary-answers");
  if (answersContainer) {
    //Put to HTML
    answersContainer.innerHTML = "";
    inspectionResult.answers.forEach(async (item, index) => {
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
      title.textContent = item.question || await GetTranslationData().Translate("inspection", "Tarkastus");
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
      answerText.innerHTML = `<strong>Vastaus:</strong> ${escapeHTML(await formatSummaryAnswer(item.answer))}`;
      answerContent.appendChild(answerText);

      /*
       * Add content to card
       */
      card.appendChild(answerContent);

      /*
       * Oil photo
       */
      if (item.answer?.oilPhoto) {
        await appendSummaryPhoto(card, item.answer.oilPhoto, await GetTranslationData().Translate("oilstickPicture", "Öljymittatikun kuva"));
      }

      /*
       * Normal photo
       */
      if (item.answer?.photo) {
        await appendSummaryPhoto(card, item.answer.photo);
      }

      /*
       * Fault
       */
      if (item.answer?.error) {
        const fault = item.answer.error;
        const faultBox = document.createElement("div");
        faultBox.classList.add("summary-fault");
        const faultTitle = document.createElement("strong");
        faultTitle.textContent = await GetTranslationData().Translate("fault","Vika");
        faultBox.appendChild(faultTitle);

        /*
         * Description
         */
        if (fault.description) {
          const description = document.createElement("p");
          description.textContent = await GetTranslationData().Translate("description","Kuvaus") + `: ${fault.description}`;
          faultBox.appendChild(description);
        }

        /*
         * Priority
         */
        if (fault.priority) {
          const priority = document.createElement("p");
          priority.textContent = await GetTranslationData().Translate("priority","Prioriteetti") `: ${await getPriorityLabel(fault.priority)}`;
          faultBox.appendChild(priority);
        }
        card.appendChild(faultBox);

        /*
         * Fault photo
         */
        if (fault.photo) {
          await appendSummaryPhoto(card, fault.photo, await GetTranslationData().Translate("imageOfFault", "Kuva viasta"));
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

  //If confirmation available do change
  if (confirmation) {
    confirmation.checked = false;
    confirmation.onchange = () => {
      if (submitButton) {
        submitButton.disabled = !confirmation.checked;
      }
    };
  }

  //If submit button then check for confirmation
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

async function formatSummaryAnswer(answer) {
  //Check for no answer
  if (!answer) {
    return await GetTranslationData().Translate("noAnswer", "Ei vastausta");
  }

  //Convert to string if not empty
  if (answer.answer !== undefined && answer.answer !== null && answer.answer !== "") {
    return String(answer.answer);
  }
  if (answer.value !== undefined && answer.value !== null && answer.value !== "") {
    return String(answer.value);
  }
  return await GetTranslationData().Translate("noAnswer", "Ei vastausta");
}
async function appendSummaryPhoto(container, photo, label = "Kuva") {
  //Return on no photo
  if (!photo) return;

  //Translate
  if (label === "Kuva") {
    label = await GetTranslationData().Translate("picture","Kuva")
  }

  //Get container
  const photoContainer = document.createElement("div");
  photoContainer.className = "summary-photo-container";

  //Create new image
  const image = document.createElement("img");
  image.className = "summary-photo-image";
  image.src = getPhotoURL(photo);
  image.alt = label;
  image.title = await GetTranslationData().Translate("clickToViewLargeImage", "Klikkaa nähdäksesi kuvan suurempana");

  //Add event listener
  image.onclick = () => {
    openPhotoViewer(photo);
  };

  //Create name element
  const name = document.createElement("span");
  name.className = "summary-photo-name";
  name.textContent = label;

  //Put to HTML
  photoContainer.appendChild(image);
  photoContainer.appendChild(name);
  container.appendChild(photoContainer);
}

async function getPriorityLabel(priority) {
  const labels = {
    low: await GetTranslationData().Translate("low", "Matala"),
    medium: await GetTranslationData().Translate("medium", "Keskitaso"),
    high: await GetTranslationData().Translate("high","Korkea"),
    critical: await GetTranslationData().Translate("critical","Kriittinen"),
  };
  return labels[priority] || priority || await GetTranslationData().Translate("notSpecified", "Ei määritetty");
}

function setupBackButton() {
  //Get back button
  const backButton = document.querySelector(".back-button");
  if (!backButton) return;

  //Get code
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  //Add event listener
  backButton.onclick = () => {
    if (code) {
      window.location.href = `studentForm.html?code=${encodeURIComponent(code)}`;
    } else {
       window.history.back();
    }
  }
}

function setupSummaryModal() {
  //Get close button
  const closeButton = document.getElementById("summary-close");
  if (closeButton) {
    closeButton.onclick = closeSummaryModal;
  }
}

function closeSummaryModal() {
  //Get modal
  const modal = document.getElementById("summaryModal");
  if (modal) {
    modal.classList.remove("show");
  }
}

async function renderKilometerInput(container) {
  //Create kilometer wrapper
  const wrapper = document.createElement("div");
  wrapper.className = "kilometer-input-wrapper";

  //Get current info
  const current = answers[currentQuestionIndex];
  const currentKm = current?.kilometer ?? "";
  const previousKm = getPreviousKilometers();

  //Put to HTML
  wrapper.innerHTML = `
        <label for="kilometerInput" data-i18n='kilometerInput'>
            Nykyinen kilometrilukema
        </label>

        <div class="kilometer-input-row">
            <input
                type="number"
                id="kilometerInput"
                min="0"
                step="1"
                placeholder="`+ await GetTranslationData().Translate("kilometerInputRow","Syötä km")`"
                value="${escapeHTML(currentKm)}"
            >

            <span>km</span>
        </div>

        <div class="last-inspection-kilometer">
            <span data-i18n='lastKilometer'>
                Edellisen tarkastuksen lukema
            </span>

            <strong>
                ${previousKm !== null && previousKm !== undefined ? `${previousKm} km` : "-"}
            </strong>
        </div>

        <div
            id="kilometerComparison"
            class="kilometer-comparison"
        ></div>

        <div class="kilometer-fault-section">

            <p class="kilometer-fault-question" data-i18n='kilometerProblem'>
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

                ` + await GetTranslationData().Translate("reportProblem","Ilmoita vika")`
            </button>

        </div>

            <div
        id="faultContainer"
        class="fault-container"
        style="display:none;"
    ></div>
    `;
  container.appendChild(wrapper);

  //Get input
  const input = document.getElementById("kilometerInput");
  if (!input) return;

  /*
   * Restore comparison
   */
  await updateKilometerComparison();

  /*
   * Save kilometer
   */
  input.addEventListener("input",async () => {
    const value = input.value.trim();
    current.kilometer = value === "" ? null : Number(value);

    /*
     * answer remains the kilometer
     * unless fault is selected
     */
    if (current.answer !== "Report Faults") {
      current.answer = current.kilometer;
    }
    await updateKilometerComparison();
    await updateNavigationButtons();
  });

  /*
   * Fault button
   */
  const faultButton = document.getElementById("kilometerFaultButton");
  if (faultButton) {
    faultButton.addEventListener("click", async () => {
      await selectFault();
    });
  }

  /*
   * Restore existing fault
   */
  if (current.answer === "Report Faults") {
    await renderFaultForm();
  }
}

async function updateKilometerComparison() {
  //Get elements
  const input = document.getElementById("kilometerInput");
  const comparison = document.getElementById("kilometerComparison");

  //Check elements
  if (!input || !comparison) {
    return;
  }

  //Trim value
  const value = input.value.trim();
  if (value === "") {
    comparison.innerHTML = "";
    return;
  }

  //Parse value
  const currentKm = Number(value);
  const previousKm = Number(previousKilometers);

  /*
   * No previous kilometer available
   */
  if (previousKilometers === null || previousKilometers === undefined || Number.isNaN(previousKm)) {
    comparison.innerHTML = `
            <div class="km-info" data-i18n='noKilometers'>
                Kilometrilukema tallennetaan.
            </div>
        `;

    return;
  }

  /*
   * Current km is smaller than old km
   */
  const difference = currentKm - previousKm;
  if (difference < 0) {
    comparison.innerHTML = `
            <div class="km-warning">
                <span class="material-symbols-outlined">
                    warning
                </span>

                `+ await GetTranslationData().Translate("lowKilometers","Kilometrilukema ei voi olla pienempi kuin") + `
                ${previousKm.toLocaleString(await GetTranslationData().GetRegionLanguage())} km.
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

            +${difference.toLocaleString(await GetTranslationData().GetRegionLanguage())} km
            `+ await GetTranslationData().Translate("sinceInspection","edellisestä tarkastuksesta")`
        </div>
    `;
}
function getPreviousKilometers() {
  return previousKilometers ?? "-";
}

async function renderFuelGauge(container) {
  //Create wrapper
  const wrapper = document.createElement("div");
  wrapper.className = "fuel-gauge-wrapper";

  //Get current
  const current = answers[currentQuestionIndex];
  /*
   * Restore previous value
   *
   * If no previous value exists,
   * default to 50.
   */
  const savedValue = current?.fuel !== null && current?.fuel !== undefined ? Number(current.fuel) : 50;

  //Put to HTML
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
            <p class="fuel-fault-question" data-i18n='problemFuelSystem'>
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
                `+ await GetTranslationData().Translate("reportProblem","Ilmoita vika") +`
            </button>
        </div>
    `;
  container.appendChild(wrapper);

  //Check if fuel is null
  if (current.fuel === null || current.fuel === undefined) {
    current.fuel = savedValue;
    current.answer = savedValue;
  }
  updateFuelGauge(savedValue);

  //Get slider
  const slider = document.getElementById("fuelSlider");
  if (slider) {
    //Add event listener
    slider.addEventListener("input", async () => {
      const value = Number(slider.value);
      current.fuel = value;
      current.answer = value;
      updateFuelGauge(value);
      await updateNavigationButtons();
    });
  }

  //Get fault button
  const fuelFaultButton = document.getElementById("fuelFaultButton");
  if (fuelFaultButton) {
    fuelFaultButton.addEventListener("click", async () => {
      await selectFault();
    });
  }

  //Render
  if (current.answer === "Report Faults") {
    renderFaultForm();
  }
}

function updateFuelGauge(value) {
  //Get elements
  const gaugeValue = document.getElementById("fuelGaugeValue");
  const sliderValue = document.getElementById("fuelSliderValue");
  const gaugeFill = document.getElementById("fuelGaugeFill");

  //Check values
  if (!gaugeValue || !sliderValue || !gaugeFill) {
    return;
  }

  //Set values
  gaugeValue.textContent = `${value}%`;
  sliderValue.textContent = `${value} %`;

  //Calculate progress
  const length = gaugeFill.getTotalLength();
  const progress = length * (value / 100);
  gaugeFill.style.strokeDasharray = `${progress} ${length}`;
}

function showFireworks() {
  //Get container
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
  //Create burst
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
  //Create firework
  const firework = document.createElement("div");
  firework.className = "firework";
  firework.style.left = `${20 + Math.random() * 60}%`;
  firework.style.top = `${15 + Math.random() * 40}%`;
  container.appendChild(firework);

  //Create more
  for (let i = 0; i < 24; i++) {
    //Create particle
    const particle = document.createElement("span");
    particle.className = "firework-particle";

    //Calculate distance
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
  //Get container
  const container = document.getElementById("questionContainer");
  if (!container) {
    return;
  }
  container.innerHTML = "";

  //Create error
  const error = document.createElement("div");
  error.classList.add("inspection-error");
  error.textContent = message;
  container.appendChild(error);
}
function getPhotoURL(photo) {
  //Check if photo exists
  if (!photo) {
    return "";
  }

  //Check if photo is Blob
  if (photo instanceof Blob || photo instanceof File) {
    return URL.createObjectURL(photo);
  }
  return String(photo);
}

function openPhotoViewer(photo) {
   //Check if photo exists
  if (!photo) return;

  //Get viewer
  const viewer = document.getElementById("photoViewer");
  const image = document.getElementById("photoViewerImage");
  const closeButton = document.getElementById("photoViewerClose");
  if (!viewer || !image) return;

  //Set image
  image.src = getPhotoURL(photo);
  viewer.classList.add("show");

  //Add event listener
  closeButton.onclick = () => {
    viewer.classList.remove("show");
    image.src = "";
  };

  //Add event listener
  viewer.onclick = (event) => {
    if (event.target === viewer) {
      viewer.classList.remove("show");
      image.src = "";
    }
  };
}

// SUBMIT PART //
function createFile(blob) {
  return new Promise((resolve, reject) => {
    //Create form data
    const formData = new FormData();
    formData.append("file", blob, "inspection.jpg");

    //Send XHR
    const xhr = new XMLHttpRequest();
    xhr.open("POST", restapi + "/api/files", true);
    xhr.onload = () => {
      //Handle error
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error("File upload failed: " + xhr.status));
        return;
      }

      //Try to parse responce
      try {
        const data = JSON.parse(xhr.responseText);
        resolve(data.new_id);
      } catch (error) {
        reject(new Error("Invalid file response."));
      }
    };

    //Error on error
    xhr.onerror = () => reject(new Error("File upload connection failed."));
    xhr.send(formData);
  });
}

function createInspection(id_vehicles, passed, note, id_users, km, fuel, type, oil_picture, link) {
  //Create new inspection
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
      link,
    };

    //Create new request
    const xhr = new XMLHttpRequest();
    xhr.open("POST", restapi + "/api/inspections", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = () => {
      //Handle errors
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error("Inspection creation failed: " + xhr.status));
        return;
      }

      //Try to parse
      try {
        const data = JSON.parse(xhr.responseText);
        resolve(data.new_id);
      } catch (error) {
        reject(new Error("Invalid inspection response."));
      }
    };

    //Fail on error
    xhr.onerror = () => reject(new Error("Inspection connection failed."));
    xhr.send(JSON.stringify(data));
  });
}

function createProblem(inspectionId, checklistId, note, fileId, priority) {
  //Create new problem
  return new Promise((resolve, reject) => {
    const data = {
      id_inspections: inspectionId,
      id_checklists: checklistId,
      note,
      id_files: fileId,
      priority,
    };

    //Send request
    const xhr = new XMLHttpRequest();
    xhr.open("POST", restapi + "/api/problems", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = () => {
      //Handle error
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error("Problem creation failed: " + xhr.status));
        return;
      }
      resolve(JSON.parse(xhr.responseText));
    };

    //Fail on error
    xhr.onerror = () => reject(new Error("Problem connection failed."));
    xhr.send(JSON.stringify(data));
  });
}
function getInspectionPassed() {
  return answers.some((answer) => answer?.answer === "Report Faults") ? 0 : 1;
}
function updateInspectionNoteVisibility() {
  //Update visibility
  const container = document.getElementById("inspectionNoteContainer");
  if (!container) return;
  const isLastQuestion = currentQuestionIndex === checklists.length - 1;
  container.style.display = isLastQuestion ? "block" : "none";
}
function setupInspectionNote() {
  //Update inspection
  const noteInput = document.getElementById("inspectionNote");
  if (!noteInput) return;
  noteInput.value = inspectionNote;
  noteInput.addEventListener("input", () => {
    inspectionNote = noteInput.value;
  });
}
async function validateInspectionAnswers() {
  for (let i = 0; i < checklists.length; i++) {
    if (!answers[i]?.answer) {
      //Validate
      currentQuestionIndex = i;
      await renderQuestion();
      await updateNavigationButtons();
      alert("Vastaa kaikkiin tarkastuskysymyksiin.");
      return false;
    }
  }
  return true;
}
function getAnswerByChecklistName(name) {
  //Get checklist item
  const index = checklists.findIndex((item) => item.name === name);
  if (index === -1) return null;

  //Get current answer
  const current = answers[index];
  if (!current) return null;

  //Select by name
  if (name === "Kilometrilukema") {
    return current.kilometer;
  }
  if (name === "Polttoaineen määrä") {
    return current.fuel;
  }
  return current.answer;
}
function inspectionSubmitDate() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}
function getInspectionType() {
  //Get last inspection state
  const previousInspection = document.getElementById("previousInspection");
  if (previousInspection && previousInspection.innerHTML.trim() !== "") {
    return "return";
  }
  return "departure";
}
async function submitInspection(inspectionResult) {
  //Validate
  if (!await validateInspectionAnswers()) return;

  //Get submit button
  const submitButton = document.getElementById("summary-submit");
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = await GetTranslationData().Translate("sending", "Lähetetään...");
  }

  //Get current user
  const userId = await GetLoggedInUserID();
  if (userId == null) {
    alert(await GetTranslationData().Translate("noUser", "Käyttäjää ei löytynyt. Kirjaudu uudelleen."));
    return;
  }

  //Get vehicle ID
  const vehicleId = vehicle?.id_vehicles;
  try {
    //Get inspection type
    const type = getInspectionType();
    let link = null;

    //Sort type
    if (type === "return") {
      const departure = inspections.filter((item) => item.type === "departure").sort((a, b) => new Date(b.date) - new Date(a.date))[0];

      //No departure found
      if (!departure) {
        alert(await GetTranslationData().Translate("noPreviousInspection", "Aikaisempaa lähtötarkastusta ei löytynyt."));
        return;
      }
      link = departure.id_inspections;
    }

    //Get answers
    const km = getAnswerByChecklistName("Kilometrilukema") ?? vehicle.km;
    const fuel = getAnswerByChecklistName("Polttoaineen määrä") ?? 0;
    const note = inspectionNote.trim() || null;
    const passed = getInspectionPassed();

    //Get oil
    let oilPictureId = 0;
    const oilIndex = checklists.findIndex((checklist) => checklist.name === "Moottoriöljyn taso");
    if (oilIndex !== -1) {
      //Get last answer
      const oilAnswer = answers[oilIndex];
      const oilPhoto = oilAnswer?.answer === "Report Faults" ? oilAnswer?.error?.photo : oilAnswer?.oilPhoto;
      if (oilPhoto) {
        oilPictureId = await createFile(oilPhoto);
      }
    }

    //Create inspection
    const inspectionId = await createInspection(vehicleId, passed, note, userId, km, fuel, type, oilPictureId, link);
    for (let i = 0; i < checklists.length; i++) {
      //Put all checklist items
      const checklist = checklists[i];
      const answer = answers[i];
      if (!answer?.error) continue;
      if (!answer.error.photo) {
        throw new Error(`Kuvavika puuttuu: ${checklist.name}`);
      }

      //Get file ID
      let fileId;
      const isOilChecklist = (checklist.name || "").toLowerCase().includes("öljy");
      if (isOilChecklist && answer.answer === "Report Faults") {
        fileId = oilPictureId;
      } else {
        fileId = await createFile(answer.error.photo);
      }
      await createProblem(inspectionId, checklist.id_checklists, answer.error.description || answer.answer, fileId, answer.error.priority || "medium");
    }

    //Finish
    alert(await GetTranslationData().Translate("submitOk", "Tarkastus lähetetty onnistuneesti."));
    window.location.href = `studentForm.html?code=${encodeURIComponent(vehicleCode)}`;
  } catch (error) {
    //Error
    console.error("Inspection submission error:", error);
    alert(await GetTranslationData().Translate("submitNotOk", "Tarkastuksen lähettäminen epäonnistui."));
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = await GetTranslationData().Translate("submitReview", "Lähetä tarkastus");
    }
  }
}
