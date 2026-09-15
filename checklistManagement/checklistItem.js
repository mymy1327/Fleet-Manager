const params = new URLSearchParams(window.location.search);
async function main() {
  //Check if need to load
  if (!params.has("checklist")) {
    return
  }

  //Load item from API
  const itemResponce = await fetch("../databaseAPI/checklists.php?checklist=" + encodeURIComponent(params.get("checklist")))
  if (!itemResponce.ok) {
    alert("Failed to load checklist item!")
    return
  }

  //Parse item
  const item = JSON.parse(await itemResponce.text())
  console.log(item)
  document.getElementById("name").value = item.name;
  document.getElementById("description").value = item.description;
}

//Submit button
document.getElementById("btnSubmit").addEventListener("click", () => {
  if (!confirm("Are you sure you want to save changes?")) {
    return
  }

  //Create JSON
  const data = {};
  data.name = document.getElementById("name").value;
  data.description = document.getElementById("description").value;
  if (params.has("checklist")) {
    data.checklist = params.get("checklist")
  }

  //Send request
  const xhr = new XMLHttpRequest()
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onload = (event) => {
    //Handle request data
    if (this.readyState == 4) {
      if (this.status == 200) {
        alert("Data saved!");
        window.location.href = "./checklistManager.html";
      } else {
        alert("Failed to save data: " + event.responceText);
      }
    }
  }
  xhr.open(params.has("checklist") ? "PATCH" : "POST", "./api.php",true)
  xhr.send(JSON.stringify(data))
})

main()
