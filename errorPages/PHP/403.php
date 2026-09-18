<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>403 Forbidden</title>
	<link rel="stylesheet" href="../../Teachers-view/main/CSS/style_en.css" />
		<link rel="stylesheet" href="../CSS/style.css">
</head>
<body>
    <main id="app" class="page">
        <div class="page-heading">
            <div>
                <h1>403 - Forbidden</h1>
                <p class="subtitle">User does not have access to this page. Navigate to other page or log out.</p>
            </div>
        </div>
	<?php
 if (isset($_GET["message"])) {
     echo "<p><i>Status message:" . $_GET["message"] . "</i></p>";
 }
 $href = "../../userManagement/PHP/logout.php";
 if (isset($_GET["from"])) {
     $href .= "?next=" . $_GET["from"];
     //echo "<a href='" . $_GET["from"]. "'><button class='button'>Retry</button></a>";
 }
 echo "<a href='$href'><button class='button'>Logout</button></a>";
 ?>
</body>
</html>
