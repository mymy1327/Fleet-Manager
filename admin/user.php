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
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="/assets/style.css" />
        <link rel="stylesheet" href="admin.css">
    </head>
    <body>
        <header class="topbar bg-white border-bottom">
            <div class="container-fluid px-3 px-md-4">
                <div class="d-flex align-items-center justify-content-between" style="height: 64px;">
            <a class="brand d-flex align-items-center gap-2 text-decoration-none" href="./index.php">
                <span class="brand-mark d-flex align-items-center justify-content-center rounded-3" aria-hidden="true"
                    ><svg viewBox="0 0 24 24" class="svg-icon"><path d="M3 6h12a2 2 0 0 1 2 2v2h2.5a2 2 0 0 1 1.7 1l1.8 3.1V17h-2.2a2.5 2.5 0 0 1-4.6 0H8.1a2.5 2.5 0 0 1-4.6 0H1V8a2 2 0 0 1 2-2Zm1 2v7h.4a2.5 2.5 0 0 1 4.6 0H16v-5h-1V8H4Zm14 4v3h.1a2.5 2.5 0 0 1 4.6 0h.1v-.5L19.5 12H18ZM5.8 18a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Zm12 0a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z" /></svg></span>
                <strong class="brand-name d-none d-sm-inline" data-i18n="brand">Hyria AutoTalli Admin</strong>
            </a>
            <nav class="main-nav d-none" aria-label="Main navigation"></nav>
            <div class="header-actions d-flex align-items-center gap-1 gap-sm-2">
                <button class="language-switch btn btn-link text-decoration-none" type="button" data-language-switch>FI</button>
                <a href='/assets/logout.php'> <button class="logout btn btn-link text-decoration-none" type="button">↪&nbsp; Logout</button></a>
            </div>
</div>
</div>
        </header>
        <main id="app" class="page container-fluid px-3 px-md-4 px-lg-5 py-4 py-md-5">
            <div class="page-heading mb-4">
                <div>
                    <h1 class="mb-1 fw-fold"><?php echo (isset($_GET["id"]) ? "<lang data-i18n='userTitleEdit'> Edit</lang>" : "<lang data-i18n='userTitleAdd'>Add</lang>") ?> <lang  data-i18n="userTitle">user</lang></h1>
                    <p class="subtitle mb-0" data-i18n="subTitle">Manage user - change name, email and role.</p>
                </div>
            </div>
<div class="container-fluid gap-2 justify-content-center">
        <input type="hidden" id='password'>
        <div class="input-group mb-3">
        <span class="input-group-text" id="inputGroup-sizing-default" for="username" data-i18n="username">Username</span>
        <input type="text" class="form-control" type="text" id="username" name="username">
        </div>
        <div class="input-group mb-3">
        <span class="input-group-text" id="inputGroup-sizing-default" for="email" data-i18n="email">Email</span>
        <input type="text" class="form-control" type="email" id="email" name="email">
        </div>
        <div class="input-group mb-3">
        <label class="input-group-text" for="role" data-i18n="role">
            Role:
        </label>

        <select class="form-select" name="role" id="role">
            <option value="admin" data-i18n="roleAdmin">Admin</option>
            <option value="student" data-i18n="roleStudent">Student</option>
            <option value="teacher" data-i18n="roleTeacher">Teacher</option>
        </select>
    </div>
</div>
        <button id="save" class="button btn btn-link text-decoration-none" data-i18n="submit" disabled>Submit</button>
        <?php
        if (isset($_GET["id"])) {
            echo "<button class='button' id='changePassword' data-i18n='changePassword' disabled>Change password</button>";
        }
        ?>
        <a href="./index.php"><button class="button" data-i18n="exit">Exit without saving</button></a>
        </main>
    </body>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>
    <script src="/assets/apiCommunication.js"></script>
    <script src="editUser.js"></script>
</html>
