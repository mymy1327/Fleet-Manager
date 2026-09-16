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

    //Take Id_inspection from vehicle
    if(isset($_GET["vehicle"])) {
        $vehicleId = (int) $_GET["vehicle"];

        $stmt = $conn ->prepare(
            "SELECT
                i.id_inspections,
                i.date,
                p.id_problems AS id_problems,
                p.note AS note,
                p.id_files AS id_files,
                p.state AS state, 
                p.priority AS priority,
                c.name AS checklist_name
            FROM `inspections` i
            INNER JOIN `problems` p
                ON i.id_inspections = p.id_inspections
            LEFT JOIN `checklists` c
                ON p.id_checklists = c.id_checklists
            WHERE i.vehicle = ?
            ORDER BY p.id_problems DESC"
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