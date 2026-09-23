<?php
require __DIR__ . "/../assets/sharedUserFunctions.php";
header("Location: " . PathToURL(__DIR__ . "/PHP/index.php"), true, 301);
die();
?>
