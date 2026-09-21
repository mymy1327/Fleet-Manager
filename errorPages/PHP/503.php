<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>503 Service unavailable</title>
	<link rel="stylesheet" href="../../Teachers-view/main/CSS/style_en.css" />
		<link rel="stylesheet" href="../CSS/style.css">
</head>
<body>
    <main id="app" class="page">
        <div class="page-heading">
            <div>
                <h1>503 - Service unavailable</h1>
                <p class="subtitle">Server can not process the request or API is not available. Please try it again later.</p>
            </div>
        </div>
	<?php
 if (isset($_GET["message"])) {
     echo "<p><i>Status message:" . $_GET["message"] . "</i></p>";
 }
 ?>
</body>
</html>
