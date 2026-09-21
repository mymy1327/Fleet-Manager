async function main() {
  //Get URL search params + check if id present
  const params = new URLSearchParams(window.location.search);
  if (params.has("id")) {
    //Get current edit user info
    const userData = await fetch("../../api/users/"+params.get("id"));
    if (userData.status != 200) {
      alert("Invalid user ID.");
      window.location.href = "../PHP/admin.php";
      return;
    }

    //Parse JSON
    const data = await userData.json();
    document.getElementById("name").value = data.username;
    document.getElementById("email").value = data.email;
    document.querySelector('input[name="role"][value="' + data.role + '"]').checked = true;
    document.getElementById("submit").removeAttribute("disabled");
    document.getElementById("changePassword").removeAttribute("disabled");
  }

  //Save button
  document.getElementById("save").addEventListener("click", () => {
    //Confirm save
    if (!confirm("Are you sure you want to save changes?")) {
      return;
    }

    //Send POST or PATCH
    if (params.has("id")) {
      //PATCH - Create name data
    } else {
      //POST - Create data
      const data = {};
      data.name = document.getElementById("name").value;
      data.email = document.getElementById("email").value;
      data.role = document.querySelector('input[name="role"]:checked').value;

      //Send POST
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "./api.php", true); //add path to requested file
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onload = () => {
        if (xhr.status == 200) {
          alert("Failed to save changes!");
        }
        window.location.href = "../PHP/admin.php";
      };
      xhr.send(JSON.stringify(data)); //data is a list send to requested file
    }
  });
}
main();
