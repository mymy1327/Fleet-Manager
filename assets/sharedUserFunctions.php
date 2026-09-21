<?php
require_once __DIR__ . "/../errorPages/PHP/errorManager.php";
$API = "https://developmenterasmus.kolojar.cz/api";
function CheckAccessSession(array $roles)
{
    //Start session if needed
    if (session_status() != PHP_SESSION_ACTIVE) {
        session_start();
    }

    //Set session value if needed
    if (!isset($_SESSION["login"]) || $_SESSION["login"] == "") {
        $_SESSION["login"] = "-1";
    }

    //Check access
    $result = CheckAccess($_SESSION["login"], $roles);
    if ($result === true) {
        return;
    }

    //Deny on error
    if ($_SESSION["login"] == "-1") {
        HandleError(401);
        die();
    }
    HandleError($result);
    die();
}

function CheckAccess(int $user, array $roles): int|true
{
    //Send request
    $response = SendRequestToAPI("/users/" . $user, "GET");

    //Process responce
    if ($response === false) {
        return 404;
    }
    if (array_search($response["role"], $roles) === false) {
        return 403;
    }
    return true;
}

/**
 * Sends request to API
 * @param path Path at API URL
 * @param method HTTP Method
 * @param body Data for method body - will be converted to JSON
 * @return false|mixed Returns false when error or JSON object as mixed on success
 */
function SendRequestToAPI(string $path, string $method = "GET", mixed $body = null): mixed
{
    //Prepare cURL
    global $API;
    $curl = curl_init($API . $path);

    //Setup headers
    $headers = ["User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Accept: application/json"];

    //Setup payload
    $payload = "";
    if ($body !== null) {
        if (is_array($body)) {
            $payload = json_encode($body);
            $headers[] = "Content-Type: application/json";
        } else {
            $payload = (string) $body;
        }
    }

    // Configure cURL options
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_CUSTOMREQUEST, strtoupper($method));
    curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($curl, CURLOPT_TIMEOUT, 5);

    //Set payload
    if (!empty($payload)) {
        curl_setopt($curl, CURLOPT_POSTFIELDS, $payload);
    }

    // Execute request
    $response = curl_exec($curl);

    //Process responce
    if ($response === false) {
        //Error responce
        $errorMsg = curl_error($curl);
        curl_close($curl);
        error_log("cURL Error: " . $errorMsg);
        return false;
    }

    // Check HTTP status code
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    if ($httpCode < 200 || $httpCode >= 300) {
        error_log("API Error: HTTP status code " . $httpCode . " returned from " . $API . $path);
        return false;
    }

    //Decode responce
    return json_decode($response, true);
}

/**
 * Gets POST data
 * @return mixed Values
 */
function GetPOSTData(): mixed
{
    return json_decode(file_get_contents("php://input"), true);
}

/**
 * Converts absolute path to URL on this server
 * @param string $path Path to file
 */
function PathToURL(string $path)
{
    //Convert slashes
    $path = str_replace("\\", "/", $path);

    //Convert to relative path
    $relativePath = str_replace(str_replace("\\", "/", $_SERVER["DOCUMENT_ROOT"]), "", $path);

    // Get request info
    $protocol = !empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] === "on" ? "https" : "http";
    $host = $_SERVER["HTTP_HOST"];

    //Build URL
    return $protocol . "://" . $host . $relativePath;
}

/**
 * Handles error using custom sides
 * @param int $code HTTP error code
 * @param string|null $message Status message, set to null for none
 * @param string|null $from Overwrite source URL
 * @param string $lang Language of page
 * @param bool $redirect If should redirect
 */
function HandleError(int $code, string|null $message = null, string|null $from = null, string $lang = "en", bool $redirect = false)
{
    //Get paths
    $path = __DIR__ . "/../errorPages/PHP/handleError.php";
    $url = PathToURL($path);

    //Chceck if from is null
    if($from === null) {
        $from = $_SERVER['REQUEST_URI'];
    }

    //Handle redirect
    if ($redirect === true) {
        $url = "Location: " . $url . "?from=" . rawurlencode($from) . "&lang=" . rawurlencode($lang) ;
        if ($message !== null) {
            $url .= "&message=" . urlencode($message);
        }
        header($url);
        die();
    } else {
        HandleErrorPageLocal(false, $code, $message, $from, $lang);
    }
}

/**
 * Generate error for API
 * @param int $code HTTP error code
 * @param string|null $message Status message, set to null for none
 * @return string Echoes responce as JSON
 */
function GenerateAPIError(int $code, string|null $message = null)
{
    http_response_code($code);
    $responce = [];
    $responce["code"] = $code;
    if ($message !== null) {
        $responce["message"] = $message;
    }
    echo json_encode($responce);
    die();
}
