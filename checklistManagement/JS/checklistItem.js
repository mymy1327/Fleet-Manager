const params = new URLSearchParams(window.location.search);
const columns = ["name", "description"];
const targets = ["btnSubmit"];
async function main() {
  const id = await SendGetOfColumsAndHandleErrors("../../api/checklists", columns, "checklist")
  if (id === false) {
    return
  }
  SetupListenForChanges(columns, targets)

  //Submit button
  document.getElementById("btnSubmit").addEventListener("click", async () => {
    //Confirm
    if (!confirm("Are you sure you want to save changes?")) {
      return;
    }

    //Check what type
    if (id !== true) {
      //Send PATCH
      const responce = await SendPatchOfColumns("../../api/checklists", columns, "id_checklists", id, true)
      if (responce === true) {
        window.location.href = "../PHP/checklistManager.php";
      } else {
        alert("Failed to save data: " + responce);
      }
    } else {
      //Send POST
      const responce = SendPostOfColumns("../../api/checklists", columns)
      if (responce === true) {
        window.location.href = "../PHP/checklistManager.php";
      } else {
        alert("Failed to save data: " + responce);
      }
    }
  });
}

main();
