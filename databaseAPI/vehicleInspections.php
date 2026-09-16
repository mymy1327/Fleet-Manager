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

switch($_SERVER["REQUEST_METHOD"]) {
        case "GET";

        //Take Inspection from a vehicle
        if(isset($_GET["vehicle"])) {
            $vehicleId = (int) $_GET["vehicle"];

            $stmt = $conn->prepare(
                "SELECT
                    i.id_inspections,
                    i.vehicle,
                    i.passed,
                    i.note,
                    i.date,
                    i.user,
                    i.km,
                    u.username AS username
                 FROM `inspections` i
                 LEFT JOIN `users` u
                    ON i.user = u.id_users
                 WHERE i.vehicle = ?
                 ORDER BY i.date DESC"
            );

            if (!$stmt) {
                http_response_code(500);
                die();
            }

            $stmt->bind_param("i", $vehicleId);

            if (!$stmt->execute()) {
                http_response_code(400);
                die();
            }

            $result = $stmt->get_result();

            http_response_code(200);

            die(
                json_encode(
                    $result->fetch_all(MYSQLI_ASSOC),
                    JSON_NUMERIC_CHECK
                )
            );
        }

        http_response_code(400);
        die();

    default:

        http_response_code(405);
        die();
}
?>