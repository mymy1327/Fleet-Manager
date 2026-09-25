//sessionStorage.clear("login");
const params = new URLSearchParams(window.location.search);
let uri = "./login.php";
if(params.has("next")) {
  uri += "?next=" + encodeURIComponent(params.get("next"))
}
console.log(uri);
window.location.replace(uri)
