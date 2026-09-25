<?php
require __DIR__ . "/assets/sharedUserFunctions.php";

//Check access
if(!CheckAccessSession(["admin","teacher","student"], true)) {
    die();
}

//Get user role
$responce = SendRequestToAPI("/users/" . $_SESSION["login"]);
if($responce === false) {
    HandleError(500);
    die();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title data-i18n='brand'>Hyria Garage</title>
	<meta name='data-i18n-url' content='./index.lang'>
    <meta name='data-i18n-languages' content='fi;en'>
	<link rel="stylesheet" href="/assets/style.css">
	<link rel="stylesheet" href="./style.css">
</head>
<body>
    <header class="topbar">
        <div class="topbar-row">
            <a class="brand" href="/index.php" aria-label="Hyria Garage home">
                <span class="brand-mark" aria-hidden="true">&#x26DF;</span>
                <strong data-i18n='brand'>Hyria Garage</strong>
            </a>
            <div class="header-actions">
                <button class="language-switch" type="button" data-language-switch>EN</button>
                <a href='/assets/logout.php'> <button class="logout" type="button">&#x21AA;&nbsp; <span data-i18n='logout'>Logout</span></button></a>
            </div>
        </div>
    </header>
    <main id="app" class="page">
        <div class="page-heading">
            <div>
                <h1 data-i18n='mainMenu'>Main menu</h1>
                <p  data-i18n='subtitle' class="subtitle">Select the option below where do you want to go.</p>
            </div>
        </div>
    <?php
        if($responce["role"] === "admin") {
            echo "<a href='/admin/index.php'><button class='button' data-i18n='admin'>Admin</button></a>";
        }
        if($responce["role"] === "admin" || $responce["role"] === "teacher") {
            echo "<a href='/teacher/index.php'><button class='button' data-i18n='teacher'>Teacher</button></a>";
        }
        if($responce["role"] === "admin" || $responce["role"] === "teacher" || $responce["role"] === "student") {
            echo "<a href='/student/index.php'><button class='button' data-i18n='student'>Student</button></a>";
        }
    ?>
    <script src="/assets/apiCommunication.js"></script>
    <script src="/assets/languageManager.js"></script>
</body>
</html>
