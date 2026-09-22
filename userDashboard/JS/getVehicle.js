const restapi = "https://developmenterasmus.kolojar.cz";
document.getElementById("submit").addEventListener("click", () => {
  for (const button of document.getElementsByClassName("button")) {
    button.disabled = true;
  }
  const xhr = new XMLHttpRequest();
  xhr.open("GET", restapi + "/api/vehicles?code=" + document.getElementById("vehicle").value.toLowerCase(), true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onload = () => {
      if (xhr.status == 200 || xhr.status == 201) {
        window.location.href = "../../inspection-student-form/index.html?id=" + JSON.parse(xhr.responseText)[0]["id_vehicles"];
      } else {
        alert("Failed to find vehicle: " + xhr.responseText);
      }
      for (const button of document.getElementsByClassName("button")) {
        button.disabled =false;
      }
  };
  xhr.send();
})
