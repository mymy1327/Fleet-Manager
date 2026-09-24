const columns = ["username", "email", "role", "password"];
const API = "https://developmenterasmus.kolojar.cz/api"

async function main() {
  //Get URL search params + check if id present
  const id = await SendGetOfColumsAndHandleErrors(API + "/users", columns, "id");
  if (id === false) {
    return;
  }
  SetupListenForChanges(columns, ["save"]);

const role = document.getElementById("role");
role.originalValue = role.value;

role.addEventListener("change", () => {
    role.dispatchEvent(new Event("input"));

});
    console.log(role.value);
console.log(role.originalValue);
  const changePasswordButton = document.getElementById("changePassword");
  if (changePasswordButton != null) {
    changePasswordButton.disabled = false;
  }

  //Listen for radio changes (there's no radio anymore :D )

  //Save button
  const btnSave = document.getElementById("save");
  btnSave.addEventListener("click", async () => {
    //Confirm save
    if (!confirm("Are you sure you want to save changes?")) {
      return;
    }
    btnSave.disabled = true;

    //Send POST or PATCH
    if (id === true) {
      const [ok, resp2] = await SendPostAPIAndHandleErrors(
        "/assets/generatePasswordHash.php",
        { password: document.getElementById("username").value }
      );

      if (!ok) {
        btnSave.disabled = false;
        return;
      }
      document.getElementById("password").value = resp2["hash"];

      //Send POST
      const resp = await SendPostOfColumns(API + "/users", columns);
      if (resp === true) {
        alert("Password for user is: " + document.getElementById("username").value);
        window.location.href = "./admin.php";
      } else {
        alert("Failed to save changes: " + resp);
        btnSave.disabled = false;
      }
    } else {
      //PATCH
      const resp = await SendPatchOfColumns(API + "/users", columns, id, true);
      if (resp === true) {
        window.location.href = "./admin.php";
      } else {
        alert("Failed to save changes: " + resp);
        btnSave.disabled = false;
      }
    }
  });

  //Change password button
  if (changePasswordButton != null) {
  changePasswordButton.addEventListener("click", async () => {
    //Get new password
    changePasswordButton.disabled = true;
    const password = prompt("Enter new password:");
    if (password == null) {
      changePasswordButton.disabled = false;
      return;
    }

    //Get password hash
    const [ok, resp2] = await SendPostAPIAndHandleErrors("/assets/generatePasswordHash.php", { password: password });
    if (!ok) {
      changePasswordButton.disabled = false;
      return;
    }

    //Change password
    const data = {};
    data["password"] = resp2["hash"];
    const [ok2, _] = await SendPatchAPIAndHandleErrors(API + "/users/" + id, data);
    if (!ok2) {
      changePasswordButton.disabled = false;
      return;
    }
    alert("Password changed!");
    window.location.reload();
  });
}
}
main();
