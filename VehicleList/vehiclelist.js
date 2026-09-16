// funni css
document.addEventListener('DOMContentLoaded', function() {
let carlist = document.getElementById("car")

const xhr = new XMLHttpRequest();
const ip = "10.1.17.4:5501"

function getVehicleDetails(vehicleId) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `http://${ip}/api/vehicles`, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = () => {
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
                
                

                //set the image
                let picture = document.createElement("img")
                picture.src = `api/files/${(x)}`; 
                //set the div for everything else
                let vehicledetails = document.createElement("div")
                vehicledetails.classList.add("vehicle-details")
                
                let vehicleheading = document.createElement("div")
                vehicleheading.classList.add("vehicle-heading")
                let vehiclemodel = document.createElement("h2")
                vehiclemodel.classList.add("vehicle-model")
                vehiclemodel.textContent = intelligeble[x].name
                let vehiclestatus = document.createElement("span")
                vehiclestatus.classList.add("vehicle-status")
                vehiclestatus.textContent = intelligeble[x].state

                let vehicletype = document.createElement("p")
                vehicletype.textContent = intelligeble[x].type
                vehicletype.classList.add("vehicle-type")
                //set the type
                let vehicledistance = document.createElement("p")
                vehicledistance.classList.add("vehicle-distance")
                vehicledistance.textContent = "no"

                let vehiclelicense = document.createElement("span")
                vehiclelicense.classList.add("vehicle-license")
                vehiclelicense.textContent = intelligeble[x].license_plate
                
                let vehiclecode = document.createElement("p")
                vehiclecode.classList.add("vehicle-code")
                vehiclecode.textContent = intelligeble[x].code
                
                //append in div
                newArticle.appendChild(picture)
                newArticle.appendChild(vehicledetails)
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


function getAllVehicles() {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `http://${ip}/api/vehicles`, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = () => {
        console.log(getVehicleDetails("q6aus0cdi9r"))
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
            let newDiv = document.createElement("div")
            newDiv.classList.add("card-garage");
            // set id
            newDiv.id = newId;
                
            //set the imagebox
            let picturebox = document.createElement("div")
            picturebox.textContent = "heloeheohloerlherholershol"
            picturebox.classList.add("panel")

            //set the image
            let picture = document.createElement("img")
            picture.src = `http://${ip}/api/files/${(parseInt(intelligeble[x].id_files))}`;
            picture.style.width = "80px"
            picture.style.height = "80px" 
            //set the div for everything else
            let containing = document.createElement("div")
            containing.classList.add("panel")
            let name = document.createElement("p")
            name.textContent = intelligeble[x].name
            name.classList.add("card-value")
            //set the type
            let type = document.createElement("p")
            type.classList.add("card-value")
            type.textContent = intelligeble[x].type

            let licenseplate = document.createElement("p")
            licenseplate.textContent = intelligeble[x].license_plate
                
            let code = document.createElement("p")
            code.textContent = intelligeble[x].code
            
            //append in div
            newDiv.appendChild(picture)
            newDiv.appendChild(containing)
            containing.appendChild(name)
            containing.appendChild(type)
            containing.appendChild(licenseplate)
            containing.appendChild(code)
            placeforit.appendChild(newDiv)
         
             
             // add an extra 1fr for every div created
             neededfr += "1fr "
             
        }
        carlist.style.gridTemplateColumns = neededfr
        console.log(carlist.style.gridTemplateColumns)
        //document.getElementById("demo1").innerHTML = xhr.status + "<br>" + xhr.responseText;
    };
    xhr.send(null);
}

    getVehicleDetails();
})



