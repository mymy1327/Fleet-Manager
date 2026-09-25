<?php
require __DIR__ . "/sharedUserFunctions.php";
$DEFAULT_LANGUAGE = "fi";
session_start();

//Check for language change
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $data = GetPOSTData();
    $_SESSION["language"] = $data["language"];
    logToConsole($_SESSION["language"]);
    echo(json_encode(null));
    die();
}

//Select language
$language = (isset($_SESSION["language"]) && $_SESSION["language"] !== "") ? $_SESSION["language"] : $DEFAULT_LANGUAGE;
$_SESSION["language"] = $language;
$result = [];
$result["lang"] = $language;

//Check if file is set
if(!isset($_GET["file"])) {
    GenerateAPIError(400,"Missing language file argument!",responce: $result);
    die();
}

//Get path
$path = ConvertToAbsolutePath($_GET["file"]);
if($path === true) {
    GenerateAPIError(400,"Invalid file path!",responce: $result);
    die();
}
if($path === false) {
    GenerateAPIError(404,"Language file not found!",200,$result);
    die();
}

//Get language file
$data = file_get_contents($path);
if($data === false) {
    GenerateAPIError(404,"Language file not found!",200,$result);
    die();
}

//Parse JSON
$languageData = json_decode($data, true);

//Check if data contains language
if($languageData[$language] === null) {
    GenerateAPIError(404,"Language not found!",200,$result);
    die();
}

//Generate result
$result["code"] = 200;
$result["data"] = $languageData[$language];
echo (json_encode($result));
die();

/*
Structure of language file:
{
    "lang": {
        "key": "value"
    },
    "lang2": {
        "key": "value"
    }
}
*/

?>
