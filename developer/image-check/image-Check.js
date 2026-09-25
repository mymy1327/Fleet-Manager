// find the video element that displays the live camera feed
const cameraVideo = document.querySelector("#camera");

// find the canvas used to store the captured image
const photoCanvas = document.querySelector("#canvas");

// find the button that starts the camera or takes a picture
const takePictureButton = document.querySelector("#takePicture");

// find the element that displays camera status messages
const cameraStatus = document.querySelector("#cameraStatus");

// find the list where available cameras are displayed
const cameraList = document.querySelector("#cameraList");

// store the currently active camera stream
let cameraStream = null;

// store the number of cameras found
let cameraCount = 0;

function createCameraStatus(message) {
    // use the singular word when exactly one camera is available
    const cameraWord = cameraCount === 1 ? "camera" : "cameras";

    // return a status message containing the camera count and supplied text
    return `Found ${cameraCount} ${cameraWord}. ${message}`;
}

function stopCamera() {
    // stop every track in the active camera stream
    cameraStream?.getTracks().forEach((track) => track.stop());

    // remove the stored stream reference
    cameraStream = null;

    // detach the stream from the video element
    cameraVideo.srcObject = null;
}

function waitForCameraVideo() {
    // Continue immediately when video data is already available
    return cameraVideo.readyState >= 2 && cameraVideo.videoWidth > 0
        ? Promise.resolve()

        // Otherwise wait until the video has loaded data once
        : new Promise((resolve) => cameraVideo.addEventListener("loadeddata", resolve, { once: true }));
}

async function requestCameraStream() {
    // Prevent camera access from insecure pages on phones
    if (!window.isSecureContext) {
        throw new Error("On a phone, camera access requires HTTPS. XAMPP HTTP works only on localhost.");
    }

    // Stop when the browser does not provide camera access
    if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("A live camera is not supported here. Use HTTPS or localhost with a modern browser.");
    }

    try {
        // Request the rear-facing camera when the browser supports that preference
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } }
        });
    } catch (error) {
        // re-throw errors other than an unsupported camera constraint
        if (error.name !== "OverconstrainedError") {
            throw error;
        }
        // retry with any available camera when the preferred constraint fails
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    }

    // connect the camera stream to the video element
    cameraVideo.srcObject = cameraStream;
}

async function showAvailableCameras() {
    // get all media devices when device enumeration is supported
    const devices = navigator.mediaDevices.enumerateDevices
        ? await navigator.mediaDevices.enumerateDevices()
        : [];

    // keep only devices that provide video input
    const cameras = devices.filter((device) => device.kind === "videoinput");

    // use one fallback camera when the browser hides the device list
    cameraCount = cameras.length || 1;

    // add each camera name to the visible camera list
    (cameras.length ? cameras : [{ label: "Camera" }]).forEach((camera, index) => {

        // create a list item for the camera
        const cameraItem = document.createElement("li");

        // show the device label or a numbered fallback name
        cameraItem.textContent = camera.label || `Camera ${index + 1}`;

        // add the camera item to the page
        cameraList.append(cameraItem);
    });
}

async function startCamera() {

    // request access to a camera
    await requestCameraStream();

    // display the cameras found on the device
    await showAvailableCameras();

    // start playing the live camera feed
    await cameraVideo.play();

    // wait until the video has usable dimensions
    await waitForCameraVideo();

    // tell the user that the camera is ready
    cameraStatus.textContent = createCameraStatus("Press the button to take a picture.");
}

function takePicture() {

    // refuse to capture before the camera has produced video dimensions
    if (!cameraVideo.videoWidth || !cameraVideo.videoHeight) {
        throw new Error("The camera is still starting. Wait a moment and try again.");
    }

    // match the canvas size to the live video resolution
    photoCanvas.width = cameraVideo.videoWidth;
    photoCanvas.height = cameraVideo.videoHeight;

    // copy the current video frame onto the canvas
    photoCanvas
        .getContext("2d")
        .drawImage(cameraVideo, 0, 0, photoCanvas.width, photoCanvas.height);

    // convert the canvas image into a JPEG blob
    photoCanvas.toBlob((picture) => {
        if (!picture) {

            // show an error when the image blob could not be created
            cameraStatus.textContent = "The picture could not be created. Try again.";
            return;
        }

        // log the captured image data for inspection or later upload
        console.log(picture);

        // tell the user that the picture was captured
        cameraStatus.textContent = createCameraStatus("Picture taken.");
    }, "image/jpeg");
}

// handle clicks on the camera button
takePictureButton.onclick = async () => {

    // prevent duplicate clicks while camera work is in progress
    takePictureButton.disabled = true;

    try {
        // check whether there is a live video track already running
        const cameraIsNotRunning = !cameraStream
            || cameraStream.getVideoTracks()[0]?.readyState !== "live";

        if (cameraIsNotRunning) {
            // clear old camera names before starting a new camera session
            cameraList.replaceChildren();

            // tell the user that the browser is requesting permission
            cameraStatus.textContent = "Requesting camera permission...";

            // start the camera and wait until it is ready
            await startCamera();

        } else {
            // capture a picture from the already-running camera
            takePicture();
        }
    } catch (error) {
        // stop the camera after an error
        stopCamera();

        // display the error message to the user
        cameraStatus.textContent = error.message || "Live camera access failed. Allow camera permission and try again.";

        // log the error for debugging
        console.error("Camera check failed:", error);
    } finally {
        
        // allow the button to be clicked again
        takePictureButton.disabled = false;
    }
};

