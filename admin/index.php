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
    <meta name='data-i18n-url' content='./index.lang'>
    <meta name='data-i18n-languages' content='fi;en'>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="/assets/style.css" />
    <link rel="stylesheet" href="admin.css" />
</head>
<body>
    <header class="topbar">
        <div class="container-fluid px-3 px-md-4">
            <div class="d-flex align-items-center justify-content-between">
                <a class="brand d-flex align-items-center text-decoration-none" href="/">
                    <span class="brand-mark d-flex align-items-center justify-content-center"
                        aria-hidden="true">
                        <svg viewBox="0 0 24 24" class="svg-icon">
                            <path d="M3 6h12a2 2 0 0 1 2 2v2h2.5a2 2 0 0 1 1.7 1l1.8 3.1V17h-2.2a2.5 2.5 0 0 1-4.6 0H8.1a2.5 2.5 0 0 1-4.6 0H1V8a2 2 0 0 1 2-2Zm1 2v7h.4a2.5 2.5 0 0 1 4.6 0H16v-5h-1V8H4Zm14 4v3h.1a2.5 2.5 0 0 1 4.6 0h.1v-.5L19.5 12H18ZM5.8 18a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Zm12 0a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z" />
                        </svg>
                    </span>
                    <strong class="d-none d-sm-inline" data-i18n="brand">
                        Hyria AutoTalli Admin
                    </strong>
                </a>
                <nav class="main-nav d-none" aria-label="Main navigation"></nav>
                <div class="header-actions d-flex align-items-center gap-2">
                    <button class="language-switch btn btn-link text-decoration-none" type="button" data-language-switch> FI </button>
                    <a href="/assets/logout.php" class="text-decoration-none">
                        <button
                            class="logout btn btn-link text-decoration-none"
                            type="button"
                            data-i18n="logout">
                            ↪&nbsp; Logout
                        </button>
                    </a>
                </div>
            </div>
        </div>
    </header>
    <main id="app" class="page container-fluid px-3 px-md-4 px-lg-5">
        <div class="page-heading d-flex flex-column flex-md-row align-items-md-center justify-content-between">
            <div>
                <h1 data-i18n="title">
                    User management
                </h1>
                <p class="subtitle" data-i18n="subTitle">
                    List of users that are registered in the system.
                </p>
            </div>
        </div>
        <div class="table-responsive">
            <table id="usersTable" class="table table-hover align-middle mb-0">
                <tr class="justify-content-center container-fluid align-items-center text-center">
                    <th class="justify-self-center text-center" data-i18n="uT1">Name</th>
                    <th class="justify-self-center text-center" data-i18n="uT2">Email</th>
                    <th class="justify-self-center text-center" data-i18n="uT3">Role</th>
                    <th class="justify-self-center text-center" data-i18n="uT4">Actions</th>
                </tr>
            </table>
        </div>
        <a href="./user.php" class="button btn btn-primary mt-3" data-i18n="newUser"> Add new user
        </a>
    </main>
    <script src="/assets/apiCommunication.js"></script>
    <script src="/assets/languageManager.js"></script>
    <script src="./admin.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
