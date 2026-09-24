<?php
require __DIR__ . "/assets/sharedUserFunctions.php";
//Check access
if(!CheckAccessSession(["admin","teacher","student"], true)) {
    die();
}

//Get user role
$responce = SendRequestToAPI("/users/" . $_SESSION["login"]);
if($responce === false) {
    HandleError(500);
    die();
}

//Reload
header("Location: " . PathToURL($_SERVER["DOCUMENT_ROOT"] . GetURLBasedOnRole($responce["role"])), true, 302);
die();
?>
