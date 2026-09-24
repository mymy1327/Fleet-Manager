let carlist = document.getElementById("vehicle")
const bob = new URLSearchParams(document.location.search)

const restapi = "developmenterasmus.kolojar.cz"
function getVehicleDetails(getcode) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `/api/vehicles?code=` + getcode, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = () => {

        // debug
        console.log(xhr.status)
        console.log(xhr.responseText)
        intelligeble = JSON.parse(xhr.responseText)
        console.log(intelligeble)
        //debug
            
        // the id location where the card element is placed
        const placeforit = document.getElementById("vehicle");
            
        // defining a variable to set the amount of cards in one column (and rows)
        let neededfr = ""
            
        // create unique id to be safe
        for (x in intelligeble){
            let newId = /item-${i+1}/;
            //create div
            
            //Entire card element
            let newArticle = document.createElement("article")
            newArticle.classList.add("card-garage");
            newArticle.id = newId;

            let picture = document.createElement("img")
            picture.src = `/api/files/${(parseInt(intelligeble[x].id_files))}`;
            picture.classList.add("Vehicle-image")
            
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

            let visualisedvehiclecode = document.createElement("p")
            vehiclecode.classList.add("vehicle-code")
            
            visualizeqr(`https://${restapi}/vehicle/${intelligeble[x].code}`, visualisedvehiclecode, 12)
            //End of Card element

            //Appending
            newArticle.appendChild(picture)
            newArticle.appendChild(vehicledetails)
            vehicledetails.appendChild(vehicleheading)
            vehicleheading.appendChild(vehiclemodel)
            vehicleheading.appendChild(vehiclestatus)
            vehicledetails.appendChild(vehicletype)
            vehicledetails.appendChild(vehicledistance)
            vehicledetails.appendChild(vehiclelicense)
            vehicledetails.appendChild(vehiclecode)
            vehicledetails.appendChild(visualisedvehiclecode)
          //clickablevisualisedvehiclecode.appendChild(visualisedvehiclecode)
            // "placeforit" being the id that it is placed upon
            placeforit.appendChild(newArticle)
            //Appending
            
            
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

function popupcall(){
    let popupitself = document.getElementById("popupitself")
    console.log("ob")
    if (popupitself.style.display == "none"){
        popupitself.style.display == "block"
    }else{
        popupitself.style.display == "none"
    }
}




// QR CODE 

/*
 * QR Code generator output demo (TypeScript)
 *
 * Copyright (c) Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/qr-code-generator-library
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */

function visualizeqr(code, changing,size) {
        const text = code; // User-supplied Unicode text
        const errCorLvl = qrcodegen.QrCode.Ecc.LOW; // Error correction level
        const qr = qrcodegen.QrCode.encodeText(text, errCorLvl); // Make the QR Code symbol
        drawCanvas(qr, 1, size, "#FFFFFF", "#000000", appendCanvas("", changing)); // Draw it on screen
    }
    // Creates a variety of QR Codes that exercise different features of the library, and appends each one to the document.
    
   
    function appendCanvas(caption, theonetochange) {
        let result = document.createElement("canvas");
        theonetochange.appendChild(result);
        return result;
    }
    // Draws the given QR Code, with the given module scale and border modules, onto the given HTML
    // canvas element. The canvas's width and height is resized to (qr.size + border * 2) * scale.
    // The drawn image is purely dark and light, and fully opaque.
    // The scale must be a positive integer and the border must be a non-negative integer.
    function drawCanvas(qr, scale, border, lightColor, darkColor, canvas) {
        if (scale <= 0 || border < 0)
            throw new RangeError("Value out of range");
        const width = (qr.size + border * 2) * scale;
        canvas.width = width;
        canvas.height = width;
        let ctx = canvas.getContext("2d");
        for (let y = -border; y < qr.size + border; y++) {
            for (let x = -border; x < qr.size + border; x++) {
                ctx.fillStyle = qr.getModule(x, y) ? darkColor : lightColor;
                ctx.fillRect((x + border) * scale, (y + border) * scale, scale, scale);
            }
        }
    }
    function toUtf8ByteArray(str) {
        str = encodeURI(str);
        let result = [];
        for (let i = 0; i < str.length; i++) {
            if (str.charAt(i) != "%")
                result.push(str.charCodeAt(i));
            else {
                result.push(parseInt(str.substring(i + 1, i + 3), 16));
                i += 2;
            }
        }
        return result;
    }

// insert the langauge switch here
