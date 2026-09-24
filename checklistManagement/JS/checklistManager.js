async function main() {
  //Load library from API
  const libraryResponce = await fetch("/api/checklists")
  if (!libraryResponce.ok) {
    window.location.href = ("/assets/PHP/handleError.php?code=503&message=" + encodeURIComponent(await libraryResponce.text()) + "&from="+encodeURIComponent(window.location.href));
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
      window.location.href = "../PHP/checklistItem.php?checklist=" + checklistItem.id_checklists
    })
    editButton.innerText = "Edit";
    editButton.classList.add("button")
    actions.appendChild(editButton);

    //Delete button
      console.log(checklistItem)
    const deleteButton = document.createElement("button")
    deleteButton.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to delete this checklist item?")) {
        return
      }

      //Send request
      const xhr = new XMLHttpRequest();
      xhr.open("DELETE", "../../api/checklists", true); //add path to requested file
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onload = () => {
        //Handle request data
        if (xhr.status == 200 || xhr.status == 201 || xhr.status == 204) {
          window.location.reload();
        } else {
          alert("Failed to delete: " + xhr.status + ": " + xhr.responceText);
        }
      };
      xhr.send(JSON.stringify({id_checklists: checklistItem.id_checklists}))
    })
    deleteButton.innerText = "Delete"
    deleteButton.classList.add("button")
    actions.appendChild(deleteButton)
  }

  //Enable add button
  document.getElementById("addItemButton").disabled = false;
}
main()
