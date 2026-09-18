<?php
session_start();
$_SESSION["login"] = "";
if(isset($_GET["next"])) {
    header("Location: ./login.php?next=" . rawurlencode($_GET["next"]));
} else {
    header("Location: ./login.php");
}
exit();
?>
