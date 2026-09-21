// funni css
document.addEventListener('DOMContentLoaded', function() {
let carlist = document.getElementById("vehicle")

const xhr = new XMLHttpRequest();
const ip = ".."

function getVehicleDetails(vehicleId) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `http://${ip}/api/vehicles`, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = () => {
            
            console.log(`/api/vehicles`)
            console.log(xhr.status)
            console.log(1)
            console.log(xhr.responseText)
            intelligeble = JSON.parse(xhr.responseText)
            console.log(intelligeble)
            const placeforit = document.getElementById("car");
            let neededfr = ""
            for (x in intelligeble){
                // create id
                let newId = /item-${i+1}/;

                //create div
                let newArticle = document.createElement("article")
                newArticle.classList.add("card-garage");
                // set id
                newArticle.id = newId;

                let clickableconnection = document.createElement("a")
                clickableconnection.href = `../../../VehicleDetails/index.html?code=${intelligeble[x].code}`

                //set the image
                let picture = document.createElement("img")
                picture.src = `/api/files/${(parseInt(intelligeble[x].id_files))}`;
                picture.classList.add("Vehicle-image")
                //set the div for everything else
                let vehicledetails = document.createElement("div")
                vehicledetails.classList.add("vehicle-details")
                
                let vehicleheading = document.createElement("div")
                vehicleheading.classList.add("vehicle-heading")
                let vehiclemodel = document.createElement("h2")
                vehiclemodel.classList.add("vehicle-model")
                vehiclemodel.textContent = intelligeble[x].name
                let vehiclestatus = document.createElement("span")
                vehiclestatus.classList.add(`vehicle-status`)
                vehiclestatus.classList.add(`${intelligeble[x].state}`)
                vehiclestatus.textContent = intelligeble[x].state
                // to be done 


                let vehicletype = document.createElement("p")
                vehicletype.textContent = intelligeble[x].type
                vehicletype.classList.add("vehicle-type")
                //set the type
                let vehicledistance = document.createElement("p")
                vehicledistance.classList.add("vehicle-distance")
                if (typeof(intelligeble[x].km) === "number"){
                    vehicledistance.textContent = `${intelligeble[x].km} km`
                }else{
                    vehicledistance.textContent = "km ei saatavilla"
                }
                

                let vehiclelicense = document.createElement("span")
                vehiclelicense.classList.add("vehicle-license")
                vehiclelicense.textContent = intelligeble[x].license_plate
                
                let vehiclecode = document.createElement("p")
                vehiclecode.classList.add("vehicle-code")
                vehiclecode.textContent = intelligeble[x].code
                
                //append in div
                newArticle.appendChild(clickableconnection)
                clickableconnection.appendChild(picture)
                clickableconnection.appendChild(vehicledetails)
                vehicledetails.appendChild(vehicleheading)
                vehicleheading.appendChild(vehiclemodel)
                vehicleheading.appendChild(vehiclestatus)
                vehicledetails.appendChild(vehicletype)
                vehicledetails.appendChild(vehicledistance)
                vehicledetails.appendChild(vehiclelicense)
                vehicledetails.appendChild(vehiclecode)
                placeforit.appendChild(newArticle)
                
                
                // add an extra 1fr for every div created
                neededfr += "1fr "
                
            }
            carlist.style.gridTemplateColumns = neededfr/2 
            console.log(carlist.style.gridTemplateColumns)
            carlist.style.gridTemplateRows = neededfr/4
            //document.getElementById("demo1").innerHTML = xhr.status + "<br>" + xhr.responseText;
        };
        xhr.send();
    }




    getVehicleDetails();
})



