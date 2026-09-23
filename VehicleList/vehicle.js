// funni css
document.addEventListener('DOMContentLoaded', function() {


const xhr = new XMLHttpRequest();
const ip = "10.1.17.107:5503"


function getVehicleDetails(vehicleId) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `http://${ip}/api/vehicles`, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = () => {

            
        };
        xhr.send();
    }




    getVehicleDetails();
})
