<?php
session_start();
$_SESSION["login"] = "";
if (isset($_POST["username"], $_POST["password"])) {
    //Handle login - Get user info form API
    $context = stream_context_create(["http" => ["ignore_errors" => true]]);
    $body = file_get_contents("../../api/users", false, $context);
    $users = json_decode($body);
    foreach ($users as $user) {
        if ($user["username"] == $_POST["username"]) {
            $hash = password_hash($_POST["password"], PASSWORD_BCRYPT);
            if ($user["password"] == $hash) {
                http_response_code(200);
                $_SESSION["login"] = $user["id"];
                echo "ok";
                die();
            }
            http_response_code(401);
            echo "Invalid password!";
            die();
        }
    }
    http_response_code(404);
    echo "User not found!";
    die();
} ?>

<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Login</title>
	<link rel="stylesheet" href="../../Teachers-view/main/CSS/style_en.css" />
        <link rel="stylesheet" href="../../checklistManagement/CSS/style.css" />
        <link rel="stylesheet" href="../CSS/login.css">
</head>
<body>
    <main id="app" class="page">
        <div class="page-heading">
            <div>
                <h1>Login</h1>
                <p class="subtitle">Enter your username and password for continue.</p>
            </div>
        </div>
	<label for="username">Username:</label><br>
	<input type="text" name="username" id="username"><br>
	<label for="password">Password:</label><br>
	<input type="password" name="password" id="password">
	<input type="checkbox" name="passwordEye" id="passwordEye">
	<label for="passwordEye">Show password</label><br>
	<button id='login' class='button'>Login</button>
    </main>
 <br>
</body>
<script src="../JS/login.js"></script>
</html>
