// funni css
document.addEventListener('DOMContentLoaded', function() {


const xhr = new XMLHttpRequest();
const ip = "10.1.17.107:5503"
function getInspections(editedvar){
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `http://${ip}/api/inspections`, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    let total = 0
    xhr.onload = () => {
        let intelligeble = JSON.parse(xhr.responseText)
        for (x in intelligeble){
            total += 1
        }
        editedvar.textContent = total
    };
    xhr.send();
        
}
function getFaults(editedvarr){
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `http://${ip}/api/problems`, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    let total = 0
    xhr.onload = () => {
        console.log(editedvarr)
        let intelligeble = JSON.parse(xhr.responseText)
        console.log(intelligeble)
        for (x in intelligeble){
            console.log("b")
            if (intelligeble[x].state == "open"){
                console.log(total)
                total += 1
            }
        }
        editedvarr.textContent = total
    };
    xhr.send();
        
}
function getVehicleDetails(vehicleId) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `http://${ip}/api/vehicles`, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = () => {
            let intelligeble = JSON.parse(xhr.responseText)
            console.log(intelligeble)
            let totalvehicles = document.getElementById("totalvehicles");
            totalvehicles.textContent = intelligeble.length

            let totalavailable = document.getElementById("totalavailable");
            let temp = 0
            for (x in intelligeble){
                if (intelligeble[x].state == "available"){ 
                    console.log("blob")
                    temp += 1
                } 
                totalavailable.textContent = temp
            } 

            let totalinspections = document.getElementById("totalinspections");
            getInspections(totalinspections)
            let totalfaults = document.getElementById("totalfaults");
            getFaults(totalfaults)

            
        };
        xhr.send();
    }




    getVehicleDetails();
})
