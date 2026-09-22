<?php
/** @var string $API */
require  __DIR__ . "/../../assets/sharedUserFunctions.php";
session_start();
$_SESSION["login"] = "";
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $data = GetPOSTData();
    echo (json_encode(HandleLogin($data["username"],$data["password"],$data["rememberMe"] == "true", isset($data["next"]) ? $data["next"] : null)));
    die();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Login</title>
	<link rel="stylesheet" href="../../Teachers-view/main/CSS/style.css" />
        <link rel="stylesheet" href="../../checklistManagement/CSS/style.css" />
        <link rel="stylesheet" href="../CSS/login.css">
</head>
<body>
    <main id="app" class="page">

        <div class="page-heading">
            <h1>Login</h1>
            <p class="sub">
                Enter your username and password for continue.
            </p>
        </div>

        <div class="login-container">

            <label for="username">Username</label>
            <input type="text" name="username" id="username">

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
<script src="../JS/login.js"></script>
</html>
