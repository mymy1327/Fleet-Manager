<?php
require __DIR__ . "/../assets/sharedUserFunctions.php";
    CheckAccessSession(["admin"])
?>

<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title data-i18n="title">User</title>
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
                <button class="language-switch" type="button" data-language-switch>FI</button>
                <a href='/assets/logout.php'> <button class="logout" type="button">↪&nbsp; Logout</button></a>
            </div>
        </header>
        <main id="app" class="page">
            <div class="page-heading">
                <div>
                    <h1><?php echo (isset($_GET["id"]) ? "<lang data-i18n='userTitleEdit'> Edit</lang>" : "<lang data-i18n='userTitleAdd'>Add</lang>") ?> <lang  data-i18n="userTitle">user</lang></h1>
                    <p class="subtitle" data-i18n="subTitle">Manage user - change name, email and role.</p>
                </div>
            </div>
        <input type="hidden" id='role'>
        <input type="hidden" id='password'>
        <label for="username" data-i18n="username">Username:</label> <br />
        <input type="text" id="username" name="username" /> <br />
        <label for="email" data-i18n="email">Email:</label><br />
        <input type="email" id="email" name="email" /><br />
        <label for="role" data-i18n="role">Role:</label> <br />
        <input type="radio" name="role" value="admin" id="roleAdmin" />
        <label for="roleAdmin" data-i18n="roleAdmin">Admin</label><br />
        <input type="radio" name="role" value="student" id="roleStudent" checked />
        <label for="roleStudent" data-i18n="roleStudent">Student</label><br />
        <input type="radio" name="role" value="teacher" id="roleTeacher" />
        <label for="roleTeacher" data-i18n="roleTeacher">Teacher</label><br />
        <button id="save" class='button' data-i18n="submit" disabled>Submit</button>
        <?php
        if (isset($_GET["id"])) {
            echo "<button class='button' id='changePassword' data-i18n='changePassword' disabled>Change password</button>";
        }
        ?>
        <a href="./index.php"><button class="button" data-i18n="exit">Exit without saving</button></a>
        </main>
    </body>
    <script src="/assets/apiCommunication.js"></script>
    <script src="editUser.js"></script>
</html>
