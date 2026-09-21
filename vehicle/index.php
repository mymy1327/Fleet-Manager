<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, Origin");
require "../assets/sharedUserFunctions.php";
$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
$uri = array_slice(explode("/", $path), 2);

$response = SendRequestToAPI("/vehicles?code=btf1w72oywq");
$id = $response[0]["id_vehicles"];
$newUrl = "http://127.0.0.1:5501/inspection-student-form/index.html?id=" . $id;
//echo json_encode($response);
//echo $uri[0] . " " . $id . " " . $newUrl;
header("Location: $newUrl");
//http_response_code(200);
die();
