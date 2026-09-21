let carlist = document.getElementById("vehicle")
let bob = new URLSearchParams(document.location.search)
let name = bob.get("code")
console.log(name)
function getVehicleDetails(getcode) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `/api/vehicles?code=` + getcode, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = () => {
            console.log(`/api/vehicles`)
            console.log(xhr.status)
            console.log(1)
            console.log(xhr.responseText)
            intelligeble = JSON.parse(xhr.responseText)
            console.log(intelligeble)
            const placeforit = document.getElementById("vehicle");
            let neededfr = ""
            for (x in intelligeble){
                // create id
                let newId = /item-${i+1}/;
                //create div
                
                //Article to be inside of
                let newArticle = document.createElement("article")
                newArticle.classList.add("card-garage");
                newArticle.id = newId;
                //set the imagebox
                let picturebox = document.createElement("div")
                picturebox.textContent = "heloeheohloerlherholershol"
                picturebox.classList.add("panel")

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
            vehicle.style.gridTemplateColumns = neededfr/2 
            console.log(carlist.style.gridTemplateColumns)
            vehicle.style.gridTemplateRows = neededfr/4
            //document.getElementById("demo1").innerHTML = xhr.status + "<br>" + xhr.responseText;
        };
        xhr.send();
    }
getVehicleDetails(bob.get("code"))

const languageSwitch = document.querySelector("[data-language-switch]");


languageSwitch?.addEventListener("click", () => {
    const targetPage = location.pathname.endsWith("Index_fi.html") ? "Index_en.html" : "Index_fi.html";
    window.location.href = `${targetPage}${location.hash}`;
});
