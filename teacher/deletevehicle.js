const bob2 = new URLSearchParams(document.location.search);
const name2 = bob.get("code");
var vehicleId;
async function deleteVehicle(vehicleCode) {
  console.log("blats");
  const xhr = new XMLHttpRequest();

  xhr.open("GET", restapi + "/api/vehicles?code=" + vehicleCode, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onload = () => {
    console.log(vehicleCode);
    console.log(xhr.responseText);
    let vehicle = JSON.parse(xhr.responseText);
    console.log(vehicle);
    vehicleId = vehicle[0].id_vehicles;
    deletedeleteVehicle();
  };
  await xhr.send();
  console.log(vehicleId);
}
function deletedeleteVehicle() {
  const xhr2 = new XMLHttpRequest();
  xhr2.open("DELETE", restapi + "/api/vehicles/" + vehicleId, true);
  xhr2.setRequestHeader("Content-Type", "application/json");
  xhr2.onload = () => {
    console.log(restapi + "/api/vehicles/" + vehicleId);
    console.log(xhr2.status);
    if (xhr2.status == 204) {
      window.location = "./#fleet";
    } else {
      alert("problem with delete");
    }
  };

  xhr2.send();
}
