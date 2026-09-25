const API = "https://developmenterasmus.kolojar.cz";
document.addEventListener("DOMContentLoaded", async function () {
  //Get user ID
  const id = await GetLoggedInUserID();
  if (id === null) {
    return;
  }

  //Get vehicles in use
  const [ok2, vehicles] = await SendGetAPIAndHandleErrors(`${API}/api/vehicles?state=in_use`);
  if (!ok2) {
    return;
  }
  console.log("vehic", vehicles);

  //Join vehicles and inspections
  const vehiclesInUseByCurrentUser = [];
  for (const vehicle of vehicles) {
    //Get inspections per user per vehicle
    const [ok, inspections] = await SendGetAPIAndHandleErrors(
      `${API}/api/inspections?id_users=${id}&id_vehicles=${vehicle.id_vehicles}&order_by=date&limit=1&order_way=DESC`,
    );
    if (!ok) {
      return;
    }
    console.log("insp", inspections);

    //Check first inspection
    if (inspections.length == 0) {
      continue;
    }
    if (inspections[0].type == "return") {
      continue;
    }
    vehiclesInUseByCurrentUser.push(vehicle);
  }
  console.log("used", vehiclesInUseByCurrentUser);

  //Update HTML
  if (vehiclesInUseByCurrentUser.length == 0) {
    document.getElementById("loading").hidden = true;
    document.getElementById("noUsedByYou").hidden = false;
  } else {
    //Create cards
    let i = 0;
    for (const vehicle of vehiclesInUseByCurrentUser) {
      //Create div
      let newArticle = document.createElement("article");
      newArticle.classList.add("card-garage");
      newArticle.setAttribute("id", vehicle["code"]);
      newArticle.id = "item-" + i;

      //Create link
      let clickableconnection = document.createElement("a");
      clickableconnection.href = `/student/student-form.php?code=${vehicle.code}`;

      //Set the image
      let picture = document.createElement("img");
      picture.src = `/api/files/${parseInt(vehicle.id_files)}`;
      picture.classList.add("Vehicle-image");

      //Set the div for everything else
      let vehicledetails = document.createElement("div");
      vehicledetails.classList.add("vehicle-details");

      //Vehicle model
      let vehicleheading = document.createElement("div");
      vehicleheading.classList.add("vehicle-heading");
      let vehiclemodel = document.createElement("h2");
      vehiclemodel.classList.add("vehicle-model");
      vehiclemodel.textContent = vehicle.name;

      //Vehicle type
      let vehicletype = document.createElement("p");
      vehicletype.textContent = vehicle.type;
      vehicletype.classList.add("vehicle-type");

      //Vehicle license plate
      let vehiclelicense = document.createElement("span");
      vehiclelicense.classList.add("vehicle-license");
      vehiclelicense.textContent = vehicle.license_plate;

      //Vehicle code
      let vehiclecode = document.createElement("p");
      vehiclecode.classList.add("vehicle-code");
      vehiclecode.textContent = vehicle.code;

      //Append in div
      newArticle.appendChild(clickableconnection);
      clickableconnection.appendChild(picture);
      clickableconnection.appendChild(vehicledetails);
      vehicledetails.appendChild(vehicleheading);
      vehicleheading.appendChild(vehiclemodel);
      vehicledetails.appendChild(vehicletype);
      vehicledetails.appendChild(vehiclelicense);
      vehicledetails.appendChild(vehiclecode);
      document.getElementById("car").appendChild(newArticle);

      //Increase ID
      i++;
    }

    //Finish loading
    document.getElementById("loading").hidden = true;
    document.getElementById("carsCardsPanel").hidden = false;
  }
});
