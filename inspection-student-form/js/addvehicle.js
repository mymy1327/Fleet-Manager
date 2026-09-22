const addVehicleModal = document.getElementById("addVehicleModal");
const closeVehicleModal = document.getElementById("closeVehicleModal");
const cancelVehicleButton = document.getElementById("cancelVehicleButton");
const addVehicleForm = document.getElementById("addVehicleForm");

let restapi = "https://developmenterasmus.kolojar.cz";
document.getElementById("addVehicleButton").addEventListener("click", openAddVehicleModal);
// Open modal
function openAddVehicleModal() {
    addVehicleModal.style.display = "flex";
}
// Close modal
function closeAddVehicleModal() {
    addVehicleModal.style.display = "none";
}
// Close button
closeVehicleModal.addEventListener("click", () => {
    closeAddVehicleModal();
});
// Cancel button
cancelVehicleButton.addEventListener("click", () => {
    closeAddVehicleModal();
});
// Click outside modal
addVehicleModal.addEventListener("click", (event) => {

    if (event.target === addVehicleModal) {
        closeAddVehicleModal();
    }

});
// ESC key
document.addEventListener("keydown", (event) => {

    if (
        event.key === "Escape" &&
        addVehicleModal.style.display === "flex"
    ) {
        closeAddVehicleModal();
    }

});
//Show image preview
function imagePreview (file) {
    
}
//Create functions
function createFile(fileElement) {

    return new Promise((resolve, reject) => {

        const file = fileElement.files[0];

        if (!file) {
            resolve(null);
            return;
        }

        const formData = new FormData();

        formData.append("file", file);

        const xhr = new XMLHttpRequest();

        xhr.open("POST", restapi + "/api/files", true);

        xhr.onload = () => {

            if (xhr.status >= 200 && xhr.status < 300) {

                try {

                    const response = JSON.parse(xhr.responseText);

                    console.log("File response:", response);

                    // API returns new_id
                    resolve(response.new_id);

                } catch (error) {

                    reject(
                        new Error("Invalid response from file API.")
                    );

                }

            } else {

                reject(
                    new Error(
                        "File upload failed. Status: " + xhr.status
                    )
                );

            }
        };

        xhr.onerror = () => {
            reject(new Error("Network error while uploading file."));
        };

        xhr.send(formData);
    });
}
function createVehicle(
    name,
    type,
    license_plate,
    code,
    last_maintenance,
    last_maintenance_km,
    next_maintenance,
    maintenance_interval_km,
    id_files,
    state,
    new_id
) {
    return new Promise((resolve, reject) => {

        let data = {};

        data.name = name;
        data.type = type;
        data.license_plate = license_plate;
        data.code = code;
        data.last_maintenance = last_maintenance;
        data.id_files = id_files;
        data.state = state;
        data.last_maintenance_km = last_maintenance_km;
        data.next_maintenance = next_maintenance;
        data.maintenance_interval_km = maintenance_interval_km;

        // NEW
        data.new_id = new_id;

        console.log("Vehicle payload:", data);

        const xhr = new XMLHttpRequest();

        xhr.open("POST", restapi + "/api/vehicles", true);

        xhr.setRequestHeader(
            "Content-Type",
            "application/json"
        );

        xhr.onload = () => {

            console.log(
                "Vehicle response:",
                xhr.status,
                xhr.responseText
            );

            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.responseText);
            } else {
                reject(
                    new Error(
                        "Vehicle creation failed. Status: " +
                        xhr.status +
                        "\n" +
                        xhr.responseText
                    )
                );
            }
        };

        xhr.onerror = () => {
            reject(
                new Error(
                    "Network error while creating vehicle."
                )
            );
        };

        xhr.send(JSON.stringify(data));
    });
}


// Form submit
addVehicleForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    try {

        // Get form values
        const name =
            document.getElementById("vehicleName").value.trim();

        const type =
            document.getElementById("vehicleType").value.trim();

        const licensePlate =
            document.getElementById("licensePlate").value.trim();

        const code =
            document.getElementById("vehicleCode").value.trim();

        const lastMaintenance =
            document.getElementById("lastMaintenance").value;

        const lastMaintenanceKm =
            document.getElementById("lastMaintenanceKm").value;

        const nextMaintenance =
            document.getElementById("nextMaintenance").value;

        const maintenanceIntervalKm =
            document.getElementById("maintenanceIntervalKm").value;

        const state =
            document.getElementById("vehicleState").value;

        const vehicleFile =
            document.getElementById("vehicleFile");


        let id_files = null;

        if (vehicleFile.files.length > 0) {

            id_files = await createFile(vehicleFile);

            console.log("Uploaded file ID:", id_files);

        }

        const result = await createVehicle(
            name,
            type,
            licensePlate,
            code,
            lastMaintenance,
            lastMaintenanceKm,
            nextMaintenance,
            maintenanceIntervalKm,
            id_files,
            state
        );

        console.log("Vehicle created:", result);

        alert("Vehicle added successfully!");

        addVehicleForm.reset();

        closeAddVehicleModal();


    } catch (error) {

        console.error("Error:", error);

        alert(
            "Failed to add vehicle.\n\n" +
            error.message
        );

    }

});