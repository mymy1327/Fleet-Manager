<?php
require __DIR__ . "/../sharedUserFunctions.php";
//Get data and validate
$data = GetPOSTData();
if(!isset($data["password"])) {
    GenerateAPIError(code: 400,message: "Missing password!");
    die();
}

//Hash
$result = [];
$result["hash"] = password_hash($data["password"],PASSWORD_BCRYPT);
$result["code"] = 200;
echo(json_encode($result));
?>
