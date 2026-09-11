async function main() {
  //Load library from API
  const libraryResponce = await fetch("./api.php")
  if (!libraryResponce.ok) {
    alert("Failed to load checklist library!")
    return
  }

  //Parse library
  const library = JSON.parse(libraryResponce)
  const checklistLibrary = document.getElementById("checklistLibrary")
  for (const checklistItem of library) {
    //Create row for each item
    const row = document.createElement("tr")
    checklistLibrary.appendChild(row)

    //Add name cell
    
  }
}

main()
