<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, Origin");

$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
$parts = explode("/", trim($path, "/"));

$code = $parts[1] ?? null;

if (!$code) {
    http_response_code(400);
    die("Missing vehicle code");
}
?>

<script>
const restapi = "https://developmenterasmus.kolojar.cz";
const code = "<?php echo $code; ?>";
console.log(code);
const xhr = new XMLHttpRequest();
xhr.open("GET", restapi + "/api/vehicles?code=" + code, true);
xhr.setRequestHeader("Content-Type", "application/json");
xhr.onload = () => {
    let id = JSON.parse(xhr.responseText)[0]["id_vehicles"];
    window.location = "https://developmenterasmus.kolojar.cz/inspection-student-form/index.html?id=" + id;
};
xhr.send();

</script>
