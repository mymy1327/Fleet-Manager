<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, Origin");

//require "../assets/sharedUserFunctions.php";

$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
$parts = explode("/", trim($path, "/"));

$code = $parts[1] ?? null;
echo $code;

if (!$code) {
    http_response_code(400);
    die("Missing vehicle code");
}

$url = "https://developmenterasmus.kolojar.cz/api/vehicles?code=" . urlencode($code);

$ch = curl_init($url);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 20,
]);

$rawResponse = curl_exec($ch);
echo "<br>" . $rawResponse;

if ($rawResponse === false) {
    http_response_code(500);
    die("cURL error: " . curl_error($ch));
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

if ($httpCode !== 200) {
    http_response_code($httpCode);
    die("API error: " . $rawResponse);
}

$response = json_decode($rawResponse, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(500);
    die("Invalid JSON: " . json_last_error_msg());
}

if (!isset($response[0]["id_vehicles"])) {
    http_response_code(404);
    die("Vehicle not found");
}

$id = $response[0]["id_vehicles"];
echo "<br>" . $id;

$newUrl = "https://developmenterasmus.kolojar.cz/inspection-student-form/index.html?id=" . urlencode($id);

//header("Location: " . $newUrl, true, 302);
exit();
