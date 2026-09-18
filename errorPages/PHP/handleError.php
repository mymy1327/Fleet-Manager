<?php
require __DIR__ . "/../../assets/sharedUserFunctions.php";
if(!isset($_GET["code"])) {
    HandleError(400,"Missing code parameter!");
}
HandleError($_GET["code"], isset($_GET["message"]) ? $_GET["message"] : null)
?>
