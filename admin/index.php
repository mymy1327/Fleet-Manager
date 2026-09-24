<?php
require __DIR__ . "/../assets/sharedUserFunctions.php";
CheckAccessSession(["admin"]);
?>

<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title data-i18n="title">User management</title>
        <link rel="stylesheet" href="/assets/style.css" />
    </head>
    <body>
        <header class="topbar">
            <a class="brand" href="./index.php">
                <span class="brand-mark" aria-hidden="true"
                    ><svg viewBox="0 0 24 24" class="svg-icon"><path d="M3 6h12a2 2 0 0 1 2 2v2h2.5a2 2 0 0 1 1.7 1l1.8 3.1V17h-2.2a2.5 2.5 0 0 1-4.6 0H8.1a2.5 2.5 0 0 1-4.6 0H1V8a2 2 0 0 1 2-2Zm1 2v7h.4a2.5 2.5 0 0 1 4.6 0H16v-5h-1V8H4Zm14 4v3h.1a2.5 2.5 0 0 1 4.6 0h.1v-.5L19.5 12H18ZM5.8 18a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Zm12 0a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z" /></svg
                ></span>
                <strong data-i18n="brand">Hyria AutoTalli Admin</strong>
            </a>
            <nav class="main-nav" aria-label="Main navigation"></nav>
            <div class="header-actions">
                <button class="language-switch" type="button" data-language-switch >FI</button>
                <a href='/assets/logout.php'> <button class="logout" type="button" data-i18n="logout">↪&nbsp; Logout</button></a>
            </div>
        </header>
        <main id="app" class="page">
            <div class="page-heading">
                <div>
                    <h1 data-i18n="title">User management</h1>
                    <p class="subtitle" data-i18n="subTitle">List of users that are registered in the system.</p>
                </div>
            </div>
            <table id="usersTable">
                <tr>
                    <th data-i18n="uT1">Name</th>
                    <th data-i18n="uT2">Email</th>
                    <th data-i18n="uT3">Role</th>
                    <th data-i18n="uT4">Actions</th>
                </tr>
            </table>
            <a href="../PHP/user.php"><button class="button" data-i18n="newUser">Add new user</button></a>
        </main>
    </body>
    <script src="/assets/apiCommunication.js"></script>
    <script src="admin.js"></script>
</html>
