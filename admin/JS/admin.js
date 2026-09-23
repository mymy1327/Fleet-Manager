async function main() {
  //Get users from API
  const usersTable = document.getElementById("usersTable");
  const data = await fetch("../../api/users");
  for (const user of await data.json()) {
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
    btnChangePassword.classList.add("button")
    btnChangePassword.innerText = "Change password";
    btnChangePassword.addEventListener("click", () => {
      const xhr = new XMLHttpRequest();
      xhr.open("PATCH", "../../api/users/" + user.id, true); //add path to requested file
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onload = () => {
        if (xhr.status != 200) {
          alert("Failed saving new password!");
        }
        window.location.reload();
      };
      xhr.send(JSON.stringify({ function: "changePassword", password: prompt("Enter new password: ") })); //data is a list send to requested file
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
    btnDelete.addEventListener("click", () => {
      if (confirm("Are you sure you want to delete: " + user.name)) {
        const xhr = new XMLHttpRequest();
        xhr.open("DELETE", "../../api/users/" + user.id, true); //add path to requested file
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = () => {
          if (xhr.status != 200) {
            alert("Failed deleting: " + user.name);
          }
          window.location.reload();
        };
        xhr.send(JSON.stringify()); //data is a list send to requested file
      }
    });
    actions.appendChild(btnDelete);
  }
}
main();
