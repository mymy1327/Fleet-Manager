<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>401 Unauthorized</title>
	<link rel="stylesheet" href="../../Teachers-view/main/CSS/style_en.css" />
	<link rel="stylesheet" href="../CSS/style.css">
</head>
<body>
    <main id="app" class="page">
        <div class="page-heading">
            <div>
                <h1>401 - Unauthorized</h1>
                <p class="subtitle">User did not provide any authorization information. Please log in.</p>
            </div>
        </div>
	<?php
 if (isset($_GET["message"])) {
     echo "<p><i>Status message:" . $_GET["message"] . "</i></p>";
 }
 $href = "../../userManagement/PHP/login.php";
 if (isset($_GET["from"])) {
     $href .= "?next=" . $_GET["from"];
 }
 echo "<a href='$href'><button class='button'>Login</button></a>";
 ?>
</body>
</html>
