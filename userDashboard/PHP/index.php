<?php
require __DIR__ . "/../../assets/sharedUserFunctions.php";
    CheckAccessSession(["user","teacher","admin"])
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User dashboard</title>
    <link rel="stylesheet" href="../../Teachers-view/main/CSS/style.css">
    <link rel="stylesheet" href="../../VehicleList/vehiclelist.css">
</head>
<body>
    <header class="topbar">
        <a class="brand" href="./index.php">
            <span class="brand-mark" aria-hidden="true">&#x26DF;</span>
            <strong>Hyria AutoTalli</strong>
        </a>
        <nav class="main-nav" aria-label="Main navigation"></nav>
        <div class="header-actions">
            <a href="./getVehicle.php"><button class='button'>Get vehicle</button></a>
            <button class="language-switch" type="button" data-language-switch>EN</button>
            <a href='../../userManagement/PHP/logout.php'> <button class="logout" type="button">↪&nbsp; Logout</button></a>
        </div>
    </header>

    <main id="app" class="page">
        <section data-view-content="home">
            <section class="panel table-panel">
                <h2 class="panel-title">Your vehicles</h2>
                <div id="car" class="cards"></div>
            </section>
            <section class="panel table-panel"><h2 class="panel-title">Your recent inspections<a class="panel-action" href="#inspections">View all</a></h2><div class="empty">No inspections yet</div></section>
        </section>
    </main>
    <script src="../JS/index.js"></script>
</body>
</html>
