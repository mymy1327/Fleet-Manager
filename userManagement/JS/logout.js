sessionStorage.clear("login");
const params = new URLSearchParams(window.location.search);
if(params.has("next")) {
  window.location.href = "./login.php?next=" + encodeURIComponent(params.get("next"))
}
window.location.href = "./login.php";
