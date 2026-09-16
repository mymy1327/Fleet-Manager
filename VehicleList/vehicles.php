<?php
/**
 * GET - returns all vehicles
 * @return json list of vehicles
 *
 *
 * GET - return vehicle details
 * @param int $_GET["vehicle"] vehicle id
 * @return json vehicle details
 *
 * @var mysqli $conn
 */

session_start();
require "../assets/config.php";

//$data = json_decode(file_get_contents("php://input"), true);

switch ($_SERVER["REQUEST_METHOD"]) {
    case "GET":
        if (!isset($_GET["vehicle"])) {
            $result = $conn->query("SELECT * FROM `vehicles`");
            if (!$result) {
                http_response_code(404);
                die();
            }
            http_response_code(200);
            die(json_encode($result->fetch_all(MYSQLI_ASSOC), JSON_NUMERIC_CHECK));
        } else {
            //get vehicle info
        }
    default:
        http_response_code(405);
        die();
}

?>