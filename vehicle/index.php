<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, Origin");
require "../assets/sharedUserFunctions.php";
$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
$uri = array_slice(explode("/", $path), 2);

$ch = curl_init("https://developmenterasmus.kolojar.cz/api/vehicles?code=" . $uri[0]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = json_decode(curl_exec($ch), true);
curl_close($ch);

if (!$response) {
    echo "none";
    die();
}
$id = $response[0]["id_vehicles"];
$newUrl = "https://developmenterasmus.kolojar.cz/inspection-student-form/index.html?id=" . $id;
print json_encode($response) . "\n";
echo $uri[0] . " " . $id . " " . $newUrl;
//header("Location: $newUrl");
//http_response_code(200);
die();
