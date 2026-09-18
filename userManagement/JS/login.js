//Password eye
const params = new URLSearchParams(window.location.search)
document.getElementById("passwordEye").addEventListener("change", () => {
  document.getElementById("password").type =  document.getElementById("passwordEye").checked ? "text" : "password"
})

//Login button
const loginButton = document.getElementById("login")
loginButton.addEventListener("click", () => {
  //Create data
  loginButton.disabled = true;
  const data = {};
  data["username"] = document.getElementById("username").value
  data["password"] = document.getElementById("password").value
  if(params.has("next")) {
    data["next"] = params.get("next")
  }

  //Send POST
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "./login.php", true); //add path to requested file
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onload = () => {
    if (xhr.status != 200) {
      alert("Failed to login!");
      loginButton.disabled = false;
      return
    }

    //Redirect
    try {
      window.location.href = JSON.parse(xhr.responseText)["next"]
    } catch (e) {
      alert("Failed to login!")
      console.error(e);
      loginButton.disabled = false;
    }
  };
  xhr.send(JSON.stringify(data)); //data is a list send to requested file
})
