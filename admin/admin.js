//Get users from API
const usersTable = document.getElementById("usersTable")
$.get("./api.php?function=getUsers").done(function (data) {
  for (const user of JSON.parse(data)) {
    //Create table row for each user
    const row = document.createElement("tr");
    usersTable.appendChild(row)

    //Add username cell
    const username = document.createElement("td");
    username.innerText = user.name;
    row.appendChild(username);

    //Add email cell
    const email = document.createElement("td");
    email.innerText = user.email;
    row.appendChild(email);

    //Add role cell
    const role = document.createElement("td");
    role.innerText = user.role;
    row.appendChild(role)

    //Add action buttons
    const actions = document.createElement("td")
    row.appendChild(actions)

    //Change password button
    const btnChangePassword = document.createElement("button")
    btnChangePassword.innerText = "Change password";
    btnChangePassword.addEventListener("click", () => {
      $.ajax({ url: "./api.php", data: JSON.stringify({ function: "changePassword", id: user.id, password: prompt("Enter new password: ") }), method: "PATCH", contentType: "application/json" }).always(function (data2) {
        if (data2 != "ok") {
          alert("Failed saving new password!")
        }
        window.location.reload()
      })
    });
    actions.appendChild(btnChangePassword)

    //Edit user button
    const btnEdit = document.createElement("button")
    btnEdit.innerText = "Edit"
    btnEdit.addEventListener("click", () => {
      window.location.href = "./editUser.html?id=" + encodeURIComponent(user.id);
    })
    actions.appendChild(btnEdit)

    //Delete user button
    const btnDelete = document.createElement("button")
    btnDelete.innerText = "Delete";
    btnDelete.addEventListener("click", () => {
      if (confirm("Are you sure you want to delete: " + user.name)) {
        $.ajax({ url: "./api.php?" + $.param({ function: "deleteUser", id: user.id }), method: "DELETE"}).always(function (data2) {
          if (data2 != "ok") {
            alert("Failed deleting: " + user.name)
          }
          window.location.reload()
        })
      }
    });
    actions.appendChild(btnDelete)
  }
})
