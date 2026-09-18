<?php
$API = "http://127.0.0.1:5501/api";
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
    http_response_code(401);
    echo $result;
    die();
}

function CheckAccess(int $user, array $roles): string|true
{
    //Send request
    $response = SendRequestToAPI("/users/" . $user, "GET");

    //Process responce
    if ($response === false) {
        return "Invalid user!";
    }
    if (array_search($response["role"], $roles) === false) {
        return "Access denied!";
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
    return json_decode($response,true);
}

/**
 * Gets POST data
 * @return mixed Values
 */
function GetPOSTData(): mixed {
    return json_decode(file_get_contents('php://input'), true);
}
