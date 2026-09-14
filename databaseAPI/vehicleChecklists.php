<?php
/**
 * GET - returns all checklist items for vehicles
 * @param int $_GET["vehicle"] vehicle id
 * @return json list of checklist items
 *
 *
 * @var mysqli $conn
 */

session_start();
require "../assets/config.php";

//$data = json_decode(file_get_contents("php://input"), true);

switch ($_SERVER["REQUEST_METHOD"]) {
    case "GET":
        if (isset($_GET["vehicle"])) {
            $stmt = $conn->prepare(
                "SELECT c.id_checklists, c.name,  c.description FROM `vehicle_checklists` vc JOIN `checklists` c ON vc.id_checklists = c.id_checklists WHERE vc.id_vehicles = ?",
            );
            $get = (int) $_GET["vehicle"];
            $stmt->bind_param("i", $get);
            if (!$stmt->execute()) {
                http_response_code(400);
                die();
            }
            $result = $stmt->get_result();
            if (!$result) {
                http_response_code(404);
                die();
            }
            http_response_code(200);
            die(json_encode($result->fetch_all(MYSQLI_ASSOC), JSON_NUMERIC_CHECK));
        }
        http_response_code(400);
        die();
    default:
        http_response_code(405);
        die();
}
?>
