let cameraStream = null;
let cameraModal = null;
let cameraVideo = null;
let photoCanvas = null;
let cameraStatus = null;
let takePictureButton = null;
let cameraCallback = null;

function createCameraInterface() {
    if (cameraModal) return;

    cameraModal = document.createElement("div");
    cameraModal.id = "cameraModal";
    cameraModal.className = "camera-modal";
    cameraModal.innerHTML = `
        <div class="camera-panel">
            <div class="camera-header">
                <h2>Ota kuva</h2>
                <button type="button" id="closeCamera" class="camera-close">×</button>
            </div>
            <div class="camera-preview-wrapper">
                <video id="camera" autoplay playsinline></video>
                <canvas id="canvas" hidden></canvas>
            </div>
            <p id="cameraStatus" class="camera-status">Käynnistetään kamera...</p>
            <div id="cameraResult" class="camera-result hidden"></div>
            <div class="camera-controls">
                <button type="button" id="takePicture" class="camera-take-button">
                    <span class="material-symbols-outlined">photo_camera</span>
                    Ota kuva
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(cameraModal);

    cameraVideo = document.getElementById("camera");
    photoCanvas = document.getElementById("canvas");
    cameraStatus = document.getElementById("cameraStatus");
    takePictureButton = document.getElementById("takePicture");

    document.getElementById("closeCamera").onclick = closeCamera;
    takePictureButton.onclick = takePicture;
}

async function openCamera(purpose, callback) {
    console.log("openCamera called:", purpose);

    createCameraInterface();

    cameraCallback = callback;
    cameraStatus.textContent = "Pyydetään kameran käyttöoikeutta...";
    takePictureButton.disabled = true;

    try {
        await startCamera();
        cameraStatus.textContent = "Kamera valmis. Ota kuva.";
        takePictureButton.disabled = false;
    } catch (error) {
        console.error("Camera error:", error);
        cameraStatus.textContent = error.message || "Kameran käynnistys epäonnistui.";
    }
}

async function startCamera() {
    console.log("Starting camera...");

    if (!window.isSecureContext) {
        throw new Error("Kamera vaatii HTTPS-yhteyden tai localhostin.");
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Kameraa ei tueta tässä selaimessa.");
    }

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } }
        });
    } catch (error) {
        if (error.name !== "OverconstrainedError") {
            throw error;
        }

        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: true
        });
    }

    cameraVideo.srcObject = cameraStream;
    await cameraVideo.play();

    console.log("Camera started");
}

function takePicture() {
    console.log("Taking picture...");

    if (!cameraVideo || !cameraVideo.videoWidth) {
        cameraStatus.textContent = "Kamera ei ole vielä valmis.";
        return;
    }

    photoCanvas.width = cameraVideo.videoWidth;
    photoCanvas.height = cameraVideo.videoHeight;

    const context = photoCanvas.getContext("2d");
    context.drawImage(cameraVideo, 0, 0, photoCanvas.width, photoCanvas.height);

    photoCanvas.toBlob((picture) => {
        if (!picture) {
            cameraStatus.textContent = "Kuvan luominen epäonnistui.";
            return;
        }

        console.log("Picture created:", picture);
        showCapturedPhoto(picture);
    }, "image/jpeg", 0.9);
}

function showCapturedPhoto(picture) {
    const result = document.getElementById("cameraResult");
    const imageUrl = URL.createObjectURL(picture);

    result.classList.remove("hidden");

    result.innerHTML = `
        <img src="${imageUrl}" alt="Otettu kuva" class="camera-result-image">
        <div class="camera-result-buttons">
            <button type="button" id="retakePhoto">Ota uudelleen</button>
            <button type="button" id="usePhoto">Käytä kuvaa</button>
        </div>
    `;

    document.getElementById("retakePhoto").onclick = () => {
        result.classList.add("hidden");
        result.innerHTML = "";
        cameraStatus.textContent = "Ota uusi kuva.";
    };

    document.getElementById("usePhoto").onclick = () => {
        console.log("Using picture:", picture);

        if (typeof cameraCallback === "function") {
            cameraCallback(picture);
        }

        closeCamera();
    };
}

function closeCamera() {
    console.log("Closing camera");

    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }

    if (cameraVideo) {
        cameraVideo.srcObject = null;
    }

    if (cameraModal) {
        cameraModal.remove();
        cameraModal = null;
    }

    cameraVideo = null;
    photoCanvas = null;
    cameraStatus = null;
    takePictureButton = null;
    cameraCallback = null;
}