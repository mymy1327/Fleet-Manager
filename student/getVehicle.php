<?php
require __DIR__ . "/../assets/sharedUserFunctions.php";
CheckAccessSession(["student", "teacher", "admin"]);
?>

<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title data-i18n='getVehicle'>Get vehicle</title>
	<meta name='data-i18n-url' content='./getVehicle.lang'>
    <meta name='data-i18n-languages' content='fi;en'>
	<link rel="stylesheet" href="/assets/style.css">
	<link rel="stylesheet" href="./style.css">
</head>
<body>
    <header class="topbar">
        <div class="topbar-row">
            <a class="brand" href="./index.php" aria-label="Hyria Garage home">
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
                <h1 data-i18n='getVehicle'>Get vehicle</h1>
                <p data-i18n='getVehicleSubtitle' class="subtitle">Scan QR Code in the vehicle using your mobile phone QR code app or enter vehicle code below.</p>
            </div>
        </div>
    <label for="vehicle" data-i18n='vehicleCode'>Vehicle code:</label><br>
	<input type="text" id="vehicle" name='vehicle'><br>
	<button id='submit' class='button' data-i18n='continue'>Continue</button>
	<a href="./index.php"><button class='button' data-i18n='back'>Back</button></a>
	<p><i data-i18n='note'>Note: You should be using this page only when you are near the vehicle.</i></p>
    </main>
    <script src="/assets/apiCommunication.js"></script>
    <script src="/assets/languageManager.js"></script>
	<script src="./getVehicle.js"></script>
</body>
</html>
