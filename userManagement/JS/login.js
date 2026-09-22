//Password eye
const params = new URLSearchParams(window.location.search)
document.getElementById("passwordEye").addEventListener("change", () => {
  document.getElementById("password").type =  document.getElementById("passwordEye").checked ? "text" : "password"
})
sessionStorage.clear("login");

//Login button
const loginButton = document.getElementById("login")
loginButton.addEventListener("click", () => {
  //Create data
  loginButton.disabled = true;
  const data = {};
  data["username"] = document.getElementById("username").value
  data["password"] = document.getElementById("password").value
  data["rememberMe"] = document.getElementById("rememberMe").checked ? "true" : "false"
  if(params.has("next")) {
    data["next"] = params.get("next")
  }

  //Send POST
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "./login.php", true); //add path to requested file
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onload = () => {
    //Validate responce
    if (xhr.status != 200) {
      if (xhr.status == 503) {
        window.location.href = ("../../errorPages/PHP/handleError.php?code=503&message=" + encodeURIComponent(JSON.parse(xhr.responseText)["message"]) + "&from="+encodeURIComponent(window.location.href));
        return
      }
      alert("Failed to login!");
      loginButton.disabled = false;
      return
    }

    //Redirect
    try {
      const resp = JSON.parse(xhr.responseText);
      sessionStorage.setItem("login", resp["id"]);
      window.location.href = resp["next"]
    } catch (e) {
      alert("Failed to login!")
      console.error(e);
      loginButton.disabled = false;
    }
  };
  xhr.send(JSON.stringify(data)); //data is a list send to requested file
})
