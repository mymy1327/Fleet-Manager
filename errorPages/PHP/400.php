<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>400 Bad request</title>
	<link rel="stylesheet" href="../../Teachers-view/main/CSS/style_en.css" />
	<link rel="stylesheet" href="../CSS/style.css">
</head>
<body>
    <main id="app" class="page">
        <div class="page-heading">
            <div>
                <h1>400 - Bad request</h1>
                <p class="subtitle">User did not provide required arguments. Please retry it.</p>
            </div>
        </div>
	<?php
 if (isset($_GET["message"])) {
     echo "<p><i>Status message:" . $_GET["message"] . "</i></p>";
 }
 ?>
</body>
</html>
