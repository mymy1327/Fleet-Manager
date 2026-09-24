const API = "https://developmenterasmus.kolojar.cz/api";
async function main() {
  //Get users from API
  const usersTable = document.getElementById("usersTable");
  const [ok, users] = await SendGetAPIAndHandleErrors(API + "/users")
  if (!ok) {
    return;
  }

  //List users
  for (const user of users) {
    //Create table row for each user
    const row = document.createElement("tr");
    usersTable.appendChild(row);

    //Add username cell
    const username = document.createElement("td");
    username.innerText = user.username;
    row.appendChild(username);

    //Add email cell
    const email = document.createElement("td");
    email.innerText = user.email;
    row.appendChild(email);

    //Add role cell
    const role = document.createElement("td");
    role.innerText = user.role;
    row.appendChild(role);

    //Add action buttons
    const actions = document.createElement("td");
    row.appendChild(actions);

    //Change password button
    const btnChangePassword = document.createElement("button");
    btnChangePassword.classList.add("button");
    btnChangePassword.innerText = "Change password";
    btnChangePassword.addEventListener("click", async () => {
      //Get new password
      btnChangePassword.disabled = true;
      const password = prompt("Enter new password:");
      if (password == null) {
        btnChangePassword.disabled = false;
        return;
      }

      //Get password hash
      const [ok, resp2] = await SendPostAPIAndHandleErrors("/assets/generatePasswordHash.php", { password: password });
      if (!ok) {
        return;
      }

      //Change password
      const data = {};
      data["password"] = resp2["hash"];
      const [ok2, _] = await SendPatchAPIAndHandleErrors(API + "/users/" + user.id_users, data);
      if (!ok2) {
        return;
      }
      alert("Password changed!");
      window.location.reload();
    });
    actions.appendChild(btnChangePassword);

    //Edit user button
    const btnEdit = document.createElement("button");
    btnEdit.classList.add("button");
    btnEdit.innerText = "Edit";
    btnEdit.addEventListener("click", () => {
      window.location.href = "./user.php?id=" + encodeURIComponent(user.id_users);
    });
    actions.appendChild(btnEdit);

    //Delete user button
    const btnDelete = document.createElement("button");
    btnDelete.classList.add("button");
    btnDelete.innerText = "Delete";
    btnDelete.addEventListener("click", async () => {
      if (confirm("Are you sure you want to delete: " + user.username)) {
        const [ok, _] = await SendDeleteAPIAndHandleErrors(API + "/users/" + user.id_users);
        if (ok) {
          window.location.reload();
        } else {
          //alert("Failed deleting: " + user.username);
        }
      }
    });
    actions.appendChild(btnDelete);
  }
}
main();
