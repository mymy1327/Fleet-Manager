<?php
/** @var string $API */
require  __DIR__ . "/sharedUserFunctions.php";
session_start();

//Get user ID if needed
if(isset($_GET["getUserId"])) {
    $data = [];
    $data["id"] = $_SESSION["login"];
    echo(json_encode($data));
    http_response_code(200);
    die();
}

//Handle login
$_SESSION["login"] = "";
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $data = GetPOSTData();
    echo (json_encode(HandleLogin($data["email"],$data["password"],$data["rememberMe"] == "true", isset($data["next"]) ? $data["next"] : null)));
    die();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Login</title>
	<link rel="stylesheet" href="/assets/style.css" />
        <link rel="stylesheet" href="./login.css">
</head>
<body>
    <main id="app" class="page">

        <div class="page-heading">
            <h1>Login</h1>
            <p class="sub">
                Enter your email and password for continue.
            </p>
        </div>

        <div class="login-container">

            <label for="email">Email</label>
            <input type="text" name="email" id="email">

            <label for="password">Password</label>
            <input type="password" name="password" id="password">

            <div class="show-password">
                <input type="checkbox" name="passwordEye" id="passwordEye">
                <label for="passwordEye">Show password</label>
            </div>

            <div class="show-password">
                <input type="checkbox" name="rememberMe" id="rememberMe">
                <label for="rememberMe">Remember me</label>
            </div>

            <button id="login" class="button">login</button>

        </div>

    </main>
</body>
<script src="/assets/apiCommunication.js"></script>
<script src="./login.js"></script>
</html>
