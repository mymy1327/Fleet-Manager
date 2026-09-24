const columns = ["username", "email", "role", "password"];

async function main() {
  //Get URL search params + check if id present
  const id = await SendGetOfColumsAndHandleErrors("../../api/users", columns, "id");
  if (id === false) {
    return;
  }
  SetupListenForChanges(columns, ["save"]);
  const changePasswordButton = document.getElementById("changePassword");
  if (changePasswordButton != null) {
    changePasswordButton.disabled = false;
    document.querySelector('input[name="role"][value="' + document.getElementById("role").value + '"]').checked = true;
  }

  //Listen for radio changes
  for (const role of document.getElementsByName("role")) {
    role.addEventListener("input", () => {
      document.getElementById("role").value = document.querySelector('input[name="role"]:checked').value;
      document.getElementById("role").dispatchEvent(new Event("input"));
    });
  }

  //Save button
  const btnSave = document.getElementById("save");
  btnSave.addEventListener("click", async () => {
    //Confirm save
    if (!confirm("Are you sure you want to save changes?")) {
      return;
    }
    btnSave.disabled = true;

    //Send POST or PATCH
    document.getElementById("role").value = document.querySelector('input[name="role"]:checked').value;
    if (id === true) {
      //POST - generate hash
      const [ok, resp2] = await SendPostAPIAndHandleErrors("/assets/PHP/generatePasswordHash.php", { password: document.getElementById("username").value });
      if (!ok) {
        return;
      }
      document.getElementById("password").value = resp2["hash"];

      //Send POST
      const resp = await SendPostOfColumns("../../api/users", columns);
      if (resp === true) {
        alert("Password for user is: " + document.getElementById("username").value)
        window.location.href = "../PHP/admin.php";
      } else {
        alert("Failed to save changes: " + resp);
        btnSave.disabled = false;
      }
    } else {
      //PATCH
      const resp = await SendPatchOfColumns("../../api/users", columns, id, true);
      if (resp === true) {
        window.location.href = "../PHP/admin.php";
      } else {
        alert("Failed to save changes: " + resp);
        btnSave.disabled = false;
      }
    }
  });

  //Change password button
  changePasswordButton.addEventListener("click", async () => {
    //Get new password
    changePasswordButton.disabled = true;
    const password = prompt("Enter new password:");
    if (password == null) {
      changePasswordButton.disabled = false;
      return;
    }

    //Get password hash
    const [ok, resp2] = await SendPostAPIAndHandleErrors("/assets/PHP/generatePasswordHash.php", { password: password });
    if (!ok) {
      return;
    }

    //Change password
    const data = {};
    data["password"] = resp2["hash"];
    const [ok2, _] = await SendPatchAPIAndHandleErrors("/api/users/" + id, data);
    if (!ok2) {
      return;
    }
    alert("Password changed!");
    window.location.reload();
  });
}
main();
