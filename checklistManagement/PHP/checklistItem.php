<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Checklist item</title>
    <link rel="stylesheet" href="../../Teachers-view/main/CSS/style_en.css" />
    <link rel="stylesheet" href="../CSS/style.css">
</head>
<body>
    <header class="topbar">
        <a class="brand" href="#home" aria-label="Fleet Manager home">
            <span class="brand-mark" aria-hidden="true"
                ><svg viewBox="0 0 24 24" class="svg-icon"><path d="M3 6h12a2 2 0 0 1 2 2v2h2.5a2 2 0 0 1 1.7 1l1.8 3.1V17h-2.2a2.5 2.5 0 0 1-4.6 0H8.1a2.5 2.5 0 0 1-4.6 0H1V8a2 2 0 0 1 2-2Zm1 2v7h.4a2.5 2.5 0 0 1 4.6 0H16v-5h-1V8H4Zm14 4v3h.1a2.5 2.5 0 0 1 4.6 0h.1v-.5L19.5 12H18ZM5.8 18a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Zm12 0a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z" /></svg
            ></span>
            <strong>Fleet Manager</strong>
        </a>
        <nav class="main-nav" aria-label="Main navigation">
            <a href="#home" data-view="home"><span>⌗</span>Home</a>
            <a href="#fleet" data-view="fleet"><span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" class="svg-icon"><path d="M3 6h12a2 2 0 0 1 2 2v2h2.5a2 2 0 0 1 1.7 1l1.8 3.1V17h-2.2a2.5 2.5 0 0 1-4.6 0H8.1a2.5 2.5 0 0 1-4.6 0H1V8a2 2 0 0 1 2-2Zm1 2v7h.4a2.5 2.5 0 0 1 4.6 0H16v-5h-1V8H4Zm14 4v3h.1a2.5 2.5 0 0 1 4.6 0h.1v-.5L19.5 12H18ZM5.8 18a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Zm12 0a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z" /></svg></span>Fleet</a>
            <a href="#inspections" data-view="inspections"><span>🖹</span>Inspections</a>
            <a href="#faults" data-view="faults"><span>△</span>Faults</a>
            <a href="#reports" data-view="reports"><span>▥</span>Reports</a>
        </nav>
        <div class="header-actions">
            <button class="language-switch" type="button" data-language-switch>FI</button>
            <button class="logout" type="button">↪&nbsp; Logout</button>
        </div>
    </header>
    <main id="app" class="page">
        <div class="page-heading">
            <div>
                <h1><?php echo isset($_GET["id"]) ? "Edit" : "Add"; ?> checklist item</h1>
                <p class="subtitle">Manage selected checklist item.</p>
            </div>
        </div>
        <label for="name">Name:</label><br>
        <input type="text" id="name" maxlength=255 name="name"><br>
        <label for="name">Description:</label><br>
        <input type="textarea" id="description" maxlength=512 name="description"><br>
        <button id="btnSubmit" class='button'>Submit</button>
        <a href="../HTML/checklistManager.html"><button class="button">Exit without saving</button></a>
    </main>
</body>
<script src="../JS/checklistItem.js"></script>
</html>
