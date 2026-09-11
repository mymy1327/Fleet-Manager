//Get URL search params + check if id present
const params = new URLSearchParams(window.location.search)
if (!params.has("id")) {
  alert("Missing user ID.")
  window.location.href = "./admin.html";
}

//Set new user value
const isNew = params.get("newUser") == "true"
document.getElementById("isNew").value = isNew ? "1" : "0"
document.getElementById(isNew ? "editUserTitle" : "addUserTitle").style.display = "hidden"

//Get current edit user info
$.get("./api.php?" + $.param({ function: "getUser", id: params.get("id") })).always(function (data) {
  if (data.status != "ok") {
    alert("Invalid user ID.")
    window.location.href = "./admin.html";
  }
  document.getElementById("name").value = data.name;
  document.getElementById("email").value = data.name;
  $('input[name="role"][value="' + data.role + '"]').prop('checked', true)
  document.getElementById("submit").removeAttribute("disabled");
})


//Save button
document.getElementById("save").addEventListener("click", () => {
  //Confirm save
  if (!confirm("Are you sure you want to save changes?")) {
    return
  }

  //Create data
  const data = {}
  data.function = "user";
  data.name = document.getElementById("name").value
  data.email = document.getElementById("email").value
  data.role = $('input[name="role"]:checked').val();
  if (!isNew) {
    data.id = params.get("id")
  }

  //Send AJAX
  $.ajax({ url: "./api.php", method: isNew ? "POST" : "PATCH", data: JSON.stringify(data) }).always(function (data) {
    if (data != "ok") {
      alert("Failed to save changes!")
    } else {
      alert("Changes changed!")
    }
    window.location.reload()
  })
})
