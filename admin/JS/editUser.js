const columns = ["username", "email", "role"];

async function main() {
  //Get URL search params + check if id present
  const id = await SendGetOfColumsAndHandleErrors("../../api/users", columns, "id");
  if (id === false) {
    return;
  }
  SetupListenForChanges(columns, ["save"]);
  document.getElementById("changePassword").disabled = false;
  document.querySelector('input[name="role"][value="' + document.getElementById("role").value + '"]').checked = true;

  //Listen for radio changes
  for (const role of document.getElementsByName("role")) {
    role.addEventListener("input", () => {
      document.getElementById("role").value = document.querySelector('input[name="role"]:checked').value;
      document.getElementById("role").dispatchEvent(new Event("input"))
    })
  }

  //Save button
  document.getElementById("save").addEventListener("click", async () => {
    //Confirm save
    if (!confirm("Are you sure you want to save changes?")) {
      return;
    }

    //Send POST or PATCH
    document.getElementById("role").value = document.querySelector('input[name="role"]:checked').value;
    if (id === true) {
      //POST
      const resp = await SendPostOfColumns("../../api/users", columns);
      if (resp === true) {
        window.location.href = "../PHP/admin.php";
      } else {
        alert("Failed to save changes: " + resp);
      }
    } else {
      //PATCH
      const resp =await SendPatchOfColumns("../../api/users", columns,id,true);
      if (resp === true) {
        window.location.href = "../PHP/admin.php";
      } else {
        alert("Failed to save changes: " + resp);
      }
    }
  });
}
main();
