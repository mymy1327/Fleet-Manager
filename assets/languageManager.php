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

//Check if file is set
if(!isset($_GET["file"])) {
    GenerateAPIError(400,"Missing language file argument!");
    die();
}

//Get path
$path = ConvertToAbsolutePath($_GET["file"]);
if($path === true) {
    GenerateAPIError(400,"Invalid file path!");
    die();
}
if($path === false) {
    GenerateAPIError(404,"Language file not found!",200);
    die();
}

//Get language file
$data = file_get_contents($path);
if($data === false) {
    GenerateAPIError(404,"Language file not found!",200);
    die();
}

//Parse JSON
$languageData = json_decode($data, true);

//Select language
$language = (isset($_SESSION["language"]) && $_SESSION["language"] !== "") ? $_SESSION["language"] : $DEFAULT_LANGUAGE;
$_SESSION["language"] = $language;

//Check if data contains language
if($languageData[$language] === null) {
    GenerateAPIError(404,"Language not found!",200);
    die();
}

//Generate result
$result = [];
$result["code"] = 200;
$result["lang"] = $language;
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
