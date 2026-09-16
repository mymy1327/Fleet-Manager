<?php
// DB login info
$servername = "10.1.17.108:3306";
//$servername = "127.0.0.1:3306";
$username = "root";
$password = "root";
$dbname = "fleet-manager";

//Connect
$conn = new mysqli($servername, $username, $password, $dbname);
$conn->set_charset("utf8");
if ($conn->connect_error) {
    die("Error connecting to DB: " . $conn->connect_error);
}

/**
 * exit this script
 * @param int $code response code
 * @param any $response response to be returned
 */
function heaDie($code, $response = null)
{
    http_response_code($code);
    die($response);
}

function logToConsole(string $log)
{
    file_put_contents("php://stdout", $log . "\n");
}
