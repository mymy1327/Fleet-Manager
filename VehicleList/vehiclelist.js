// funni css
document.addEventListener('DOMContentLoaded', function() {
    let carlist = document.getElementById("car")

    const xhr = new XMLHttpRequest();

    function getAllVehicles() {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "../api/vehicles", true);
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
                let newDiv = document.createElement("div")
                newDiv.classList.add("card");
                // set id
                newDiv.id = newId;
                
                //set the imagebox
                let picturebox = document.createElement("div")
                picturebox.textContent = "heloeheohloerlherholershol"
                picturebox.classList.add("panel")

                //set the image
                let picture = document.createElement("img")
                picture.src = `/api/files/${(parseInt(intelligeble[x].id_files))}`;
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

    getAllVehicles();
})



