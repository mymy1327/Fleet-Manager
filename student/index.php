<?php
require __DIR__ . "/../assets/sharedUserFunctions.php";
CheckAccessSession(["student", "teacher", "admin"]);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name='data-i18n-url' content='./index.lang'>
    <meta name='data-i18n-languages' content='fi;en'>
    <title>User dashboard</title>
    <link rel="stylesheet" href="/assets/style.css">
</head>
<body>
    <header class="topbar">
        <div class="topbar-row">
            <a class="brand" href="/index.php" aria-label="Hyria Garage home">
                <span class="brand-mark" aria-hidden="true">&#x26DF;</span>
                <strong data-i18n='brand'>Hyria Garage</strong>
            </a>
            <div class="header-actions">
                <a href="./getVehicle.php"><button class='button' data-i18n='getVehicle'>Get vehicle</button></a>
                <button class="language-switch" type="button" data-language-switch>EN</button>
                <a href='/assets/logout.php'> <button class="logout" type="button">&#x21AA;&nbsp; <span data-i18n='logout'>Logout</span></button></a>
            </div>
        </div>
    </header>
    <main id="app" class="page">
        <section data-view-content="home">
            <div id='loading'>
                <h1 data-i18n='loadingTitle'>Loading vehicle list...</h1>
                <p data-i18n='loadingSubtitle' class="subtitle">Please wait, list will be loaded in any moment.</p>
            </div>
            <div id='noUsedByYou' hidden>
                <h1 data-i18n='noVehicles'>No vehicles used by you</h1>
                <p data-i18n='noVehiclesSubtitle' class="subtitle">Scan QR Code in the vehicle using your mobile phone QR code app or click Get vehicle button.</p>
            </div>
            <section class="panel table-panel" id='carsCardsPanel' hidden>
                <h2 data-i18n='vehiclesTitle' class="panel-title">Vehicles used by you</h2>
                <div id="car" class="cards"></div>
            </section>
        </section>
    </main>
     <script src="/assets/apiCommunication.js"></script>
     <script src="/assets/languageManager.js"></script>
    <script src="./index.js"></script>
</body>
</html>
