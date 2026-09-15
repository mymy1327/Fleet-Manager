async function main() {
  //Load library from API
  const libraryResponce = await fetch("../databaseAPI/checklists.php")
  if (!libraryResponce.ok) {
    alert("Failed to load checklist library!")
    return
  }

  //Parse library
  const library = JSON.parse(await libraryResponce.text())
  const checklistLibrary = document.getElementById("checklistLibrary")
  for (const checklistItem of library) {
    //Create row for each item
    const row = document.createElement("tr")
    checklistLibrary.appendChild(row)

    //Add name cell
    const name = document.createElement("td")
    name.innerText = checklistItem.name;
    row.appendChild(name)

    //Add description cell
    const description = document.createElement("td")
    description.innerText = checklistItem.description;
    row.appendChild(description)

    //Add actions cell
    const actions = document.createElement("td");
    row.appendChild(actions)

    //Edit button
    const editButton = document.createElement("button")
    editButton.addEventListener("click", () => {
      window.location.href = "./checklistItem.php?checklist=" + checklistItem.id_checklists
    })
    editButton.innerText = "Edit";
    actions.appendChild(editButton);

    //Delete button
    const deleteButton = document.createElement("button")
    deleteButton.addEventListener("click", async () => {
      const xhr = new XMLHttpRequest()
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onload = (event) => {
        //Handle request data
        if (this.readyState == 4) {
          if (this.status == 200) {
            window.location.reload();
          } else {
            alert("Failed to delete: " + event.responceText);
          }
        }
      }
      xhr.open("DELETE", "./api.php")
      xhr.send(JSON.stringify({checklist: checklistItem.id_checklists}))
    })
    deleteButton.innerText = "Delete"
    actions.appendChild(deleteButton)
  }
}
main()
