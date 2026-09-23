//Password eye
const params = new URLSearchParams(window.location.search)
document.getElementById("passwordEye").addEventListener("change", () => {
  document.getElementById("password").type =  document.getElementById("passwordEye").checked ? "text" : "password"
})
//sessionStorage.clear("login");

//Login button
const loginButton = document.getElementById("login")
loginButton.addEventListener("click", async () => {
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
  const [ok, resp] = await SendPostAPIAndHandleErrors("./login.php", data)
  console.log(ok,resp)
  if (!ok) {
    return;
  }
  if (resp["code"] == 200) {
    window.location.href = resp["next"]
  } else {
    alert("Failed to login: " + resp["message"])
    loginButton.disabled = false;
  }
})
