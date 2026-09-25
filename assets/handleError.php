<?php
require_once __DIR__ . "/errorManager.php";
if (!isset($_GET["code"])) {
    HandleErrorPageLocal(true, 400, "Missing code parameter!");
}
if (!isset($_GET["from"])) {
    HandleErrorPageLocal(true, 400, "Can not handle error page - missing from argument!", "");
}
HandleErrorPageLocal(true, $_GET["code"], isset($_GET["message"]) ? $_GET["message"] : null, $_GET["from"], isset($_GET["lang"]) ? $_GET["lang"] : "en");
?>
