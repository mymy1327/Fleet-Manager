<?php
function CheckAccessSession(array $role) {
    //Start session if needed
    if(session_status() != PHP_SESSION_ACTIVE) {
        session_start();
    }

    //Set session value if needed
    if(!isset($_SESSION["login"]) || $_SESSION["login"] == "") {
         $_SESSION["login"] = "-1";
    }

    //Check access
    $result = CheckAccess($_SESSION["login"], $role);
    if ($result === true) {
        return;
    }

    //Deny on error
    http_response_code(401);
    echo $result;
    die();
}

function CheckAccess(int $user, string $role): string|true {
    //Setup options for GET
    $options = [
        'http' => [
            'method' => 'GET',
            'header' => 'Accept: application/json',
            'timeout' => 30
        ]
    ];

    //Send request
    $context = stream_context_create($options);
    $response = file_get_contents(__DIR__ . "/../api/users/" . $user, false, $context);

    //Process responce
    if ($response === false) {
        return "Invalid user!";
    }
    $userInfo = json_decode($response);
    if($userInfo["role"] != $role) {
        return "Access denied!";
    }
    return true;
}
