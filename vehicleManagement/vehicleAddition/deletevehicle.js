let vehicleId
function deleteVehicle(vehicleCode){
    console.log("blats")
        const xhr = new XMLHttpRequest();
        const xhr2 = new XMLHttpRequest();
        let vehicleId
        xhr.open("GET", `/api/vehicles?code=` + vehicleCode, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = () => {
            vehicle = JSON.parse(xhr.responseText)
            vehicleId = vehicle[0].id_vehicles 
        }

        console.log(vehicleId) 
        xhr2.open("DELETE", restapi + "/api/vehicles/" + vehicleId, true);
        xhr2.onload = () => {
            console.log(restapi + "api/vehicles/" + vehicleId)
            console.log(xhr.status)
        };
        xhr.send();
        xhr2.send();
    }
