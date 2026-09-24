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

$newUrl = "https://developmenterasmus.kolojar.cz/student/student-form.html?code=".$code;
header("Location: ".$newUrl);
die();
?>

<script>
</script>
