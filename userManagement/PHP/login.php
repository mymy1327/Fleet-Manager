<?php
/** @var string $API */
require  __DIR__ . "/../../assets/sharedUserFunctions.php";
session_start();
$_SESSION["login"] = "";
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    //Handle login - Get user info form API
    $data = GetPOSTData();
    $users = SendRequestToAPI("/users","GET");
    if($users === false) {
        echo "API not available!";
        die();
    }
    foreach ($users as $user) {
        if ($user["username"] == $data["username"]) {
            $hash = password_hash($data["password"], PASSWORD_BCRYPT);
            if (password_verify($data["password"], $user["password"])) {
                http_response_code(200);
                $_SESSION["login"] = $user["id_users"];
                $result = [];
                if(!isset($data["next"])) {
                    if($user["role"] == "admin") {
                        $result["next"] = "./admin.php";
                    }
                } else {
                    $result["next"] = $data["next"];
                }
                echo (json_encode($result));
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
