<?php
require __DIR__ . "/../../assets/sharedUserFunctions.php";
    CheckAccessSession(["admin"])
?>


<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>User</title>
        <link rel="stylesheet" href="../../Teachers-view/main/CSS/style_en.css" />
        <link rel="stylesheet" href="../../checklistManagement/CSS/style.css" />
    </head>
    <body>
        <header class="topbar">
            <a class="brand" href="#home" aria-label="Fleet Manager home">
                <span class="brand-mark" aria-hidden="true"
                    ><svg viewBox="0 0 24 24" class="svg-icon"><path d="M3 6h12a2 2 0 0 1 2 2v2h2.5a2 2 0 0 1 1.7 1l1.8 3.1V17h-2.2a2.5 2.5 0 0 1-4.6 0H8.1a2.5 2.5 0 0 1-4.6 0H1V8a2 2 0 0 1 2-2Zm1 2v7h.4a2.5 2.5 0 0 1 4.6 0H16v-5h-1V8H4Zm14 4v3h.1a2.5 2.5 0 0 1 4.6 0h.1v-.5L19.5 12H18ZM5.8 18a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Zm12 0a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z" /></svg
                ></span>
                <strong>Fleet Manager Admin</strong>
            </a>
            <nav class="main-nav" aria-label="Main navigation"></nav>
            <div class="header-actions">
                <button class="language-switch" type="button" data-language-switch>FI</button>
                <a href='./logout.php'> <button class="logout" type="button">↪&nbsp; Logout</button></a>
            </div>
        </header>
        <main id="app" class="page">
            <div class="page-heading">
                <div>
                    <h1><?php echo (isset($_GET["id"]) ? "Edit" : "Add") ?> user</h1>
                    <p class="subtitle">Manage user - change name, email and role.</p>
                </div>
            </div>
        <label for="name">Name:</label> <br />
        <input type="text" id="name" name="name" /> <br />
        <label for="email">Email:</label><br />
        <input type="email" id="email" name="email" /><br />
        <label for="role">Role:</label> <br />
        <input type="radio" name="role" value="Admin" id="roleAdmin" />
        <label for="roleAdmin">Admin</label><br />
        <input type="radio" name="role" value="Student" id="roleStudent" checked />
        <label for="roleStudent">Student</label><br />
        <input type="radio" name="role" value="Teacher" id="roleTeacher" />
        <label for="roleTeacher">Teacher</label><br />
        <button id="save" class='button' disabled>Submit</button>
        <?php
        if (isset($_GET["id"])) {
            echo "<button class='button' is='changePassword' disabled>Change password</button>";
        }
        ?>
        </main>
    </body>
    <script src="../JS/editUser.js"></script>
</html>
