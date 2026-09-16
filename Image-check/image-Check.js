const video = document.querySelector("#camera");
const canvas = document.querySelector("#canvas");
const button = document.querySelector("#takePicture");
const status = document.querySelector("#cameraStatus");
const cameraList = document.querySelector("#cameraList");
let activeStream = null;
let cameraCount = 0;

const cameraText = (message) => `Found ${cameraCount} camera${cameraCount === 1 ? "" : "s"}. ${message}`;

function stopCamera() {
    activeStream?.getTracks().forEach((track) => track.stop());
    activeStream = null;
    video.srcObject = null;
}

function waitForVideo() {
    return video.readyState >= 2 && video.videoWidth > 0
        ? Promise.resolve()
        : new Promise((resolve) => video.addEventListener("loadeddata", resolve, { once: true }));
}

async function startCamera() {
    if (!window.isSecureContext) {
        throw new Error("On a phone, camera access requires HTTPS. XAMPP HTTP works only on localhost.");
    }

    if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("A live camera is not supported here. Use HTTPS or localhost with a modern browser.");
    }

    try {
        activeStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } }
        });
    } catch (error) {
        if (error.name !== "OverconstrainedError") {
            throw error;
        }
        activeStream = await navigator.mediaDevices.getUserMedia({ video: true });
    }

    video.srcObject = activeStream;
    const devices = navigator.mediaDevices.enumerateDevices
        ? await navigator.mediaDevices.enumerateDevices()
        : [];
    const cameras = devices.filter((device) => device.kind === "videoinput");

    cameraCount = cameras.length || 1;
    (cameras.length ? cameras : [{ label: "Camera" }]).forEach((camera, index) => {
        const item = document.createElement("li");
        item.textContent = camera.label || `Camera ${index + 1}`;
        cameraList.append(item);
    });

    await video.play();
    await waitForVideo();
    status.textContent = cameraText("Press the button to take a picture.");
}

function takePicture() {
    if (!video.videoWidth || !video.videoHeight) {
        throw new Error("The camera is still starting. Wait a moment and try again.");
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((picture) => {
        if (!picture) {
            status.textContent = "The picture could not be created. Try again.";
            return;
        }
        console.log(picture);
        status.textContent = cameraText("Picture taken.");
    }, "image/jpeg");
}

button.onclick = async () => {
    button.disabled = true;

    try {
        if (!activeStream || activeStream.getVideoTracks()[0]?.readyState !== "live") {
            cameraList.replaceChildren();
            status.textContent = "Requesting camera permission...";
            await startCamera();
        } else {
            await takePicture();
        }
    } catch (error) {
        stopCamera();
        status.textContent = error.message || "Live camera access failed. Allow camera permission and try again.";
        console.error("Camera check failed:", error);
    } finally {
        button.disabled = false;
    }
};
