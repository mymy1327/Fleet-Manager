<?php
require __DIR__ . "/../../assets/sharedUserFunctions.php";
if(!isset($_GET["code"])) {
    HandleError(400,"Missing code parameter!");
}
if(!isset($_GET["from"])) {
    HandleError(400,"Can not handle error page - missing from argument!","");
}
HandleError($_GET["code"], isset($_GET["message"]) ? $_GET["message"] : null, $_GET["from"])
?>
