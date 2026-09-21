const params = new URLSearchParams(window.location.search);
async function main() {
  //Check if need to load
  if (!params.has("checklist")) {
    window.location.href = ("../../errorPages/PHP/handleError.php?code=400&message=" + encodeURIComponent("Missing checklist argument.") + "&from="+encodeURIComponent(window.location.href));
    return
  }

  //Load item from API
  const itemResponce = await fetch("../../api/checklists/" + encodeURIComponent(params.get("checklist")));
  if (!itemResponce.ok) {
    window.location.href = ("../../errorPages/PHP/handleError.php?code=" + itemResponce.status + "&message=" + encodeURIComponent(await itemResponce.text()) + "&from="+encodeURIComponent(window.location.href));
    return
  }

  //Parse item
  const item = JSON.parse(await itemResponce.text());
  document.getElementById("name").value = item.name;
  document.getElementById("description").value = item.description;
  document.getElementById("name").disabled = false;
  document.getElementById("description").disabled = false;
  document.getElementById("btnSubmit").disabled = false;
}

//Submit button
document.getElementById("btnSubmit").addEventListener("click", () => {
  if (!confirm("Are you sure you want to save changes?")) {
    return;
  }

  //Check what type
  if (params.has("checklist")) {
    //Create PATCH name JSON
    const data = {};
    data.name = document.getElementById("name").value;
    //data.description = document.getElementById("description").value;
    data.id_checklists = params.get("checklist");
    data.column = "name";

    //Send request
    const xhr = new XMLHttpRequest();
    xhr.open("PATCH", "../../api/checklists", true); //add path to requested file
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = () => {
      //Handle request data
      if (xhr.status == 200 || xhr.status == 201) {
        //Create PATCH description JSON
        const data = {};
        data.description = document.getElementById("description").value;
        data.id_checklists = params.get("checklist");
        data.column = "description";

        //Send request
        const xhr = new XMLHttpRequest();
        xhr.open("PATCH", "../../api/checklists", true); //add path to requested file
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = () => {
          //Handle request data
          if (xhr.status == 200 || xhr.status == 201) {
            window.location.href = "../PHP/checklistManager.php";
          } else {
            alert("Failed to save data: " + xhr.responceText);
          }
        };
        xhr.send(JSON.stringify(data));
      } else {
        alert("Failed to save data: " + xhr.responceText);
      }
    };
    xhr.send(JSON.stringify(data));
  } else {
    //Create POST JSON
    const data = {};
    data.name = document.getElementById("name").value;
    data.description = document.getElementById("description").value;
    if (params.has("checklist")) {
      data.id_checklists = params.get("checklist");
    }

    //Send request
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "../../api/checklists", true); //add path to requested file
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = () => {
      //Handle request data
      if (xhr.status == 200 || xhr.status == 201) {
        window.location.href = "../PHP/checklistManager.php";
      } else {
        alert("Failed to save data: " + xhr.responceText);
      }
    };
    xhr.send(JSON.stringify(data));
  }
});

main();
