<?php
session_start();
require "../assets/config.php";

$data = json_decode(file_get_contents("php://input"), true);

/**
 * returns all checklist items for vehicle
 * @param mysqli $conn connection to database
 * @param int $id vehicle id
 * @return json|false list of checklist items | false on failure
 */
function getAllChecklistItemsForVehicle($conn, $id)
{
    $stmt = $conn->prepare(
        "SELECT c.id_checklists, c.name,  c.description FROM `vehicle_checklists` vc JOIN `checklists` c ON vc.id_checklists = c.id_checklists WHERE vc.id_vehicles = ?",
    );
    $vehicleId = (int) $id;
    $stmt->bind_param("i", $vehicleId);
    if (!$stmt->execute()) {
        return false;
    }
    $result = $stmt->get_result();
    if (!$result) {
        return false;
    }
    return json_encode($result->fetch_all(MYSQLI_ASSOC), JSON_NUMERIC_CHECK);
}

//echo $_SERVER["REQUEST_METHOD"], " ", $_GET["id_vehicles"];
switch ($_SERVER["REQUEST_METHOD"]) {
    case "GET":
        if (isset($_GET["id_vehicles"])) {
            $return = getAllChecklistItemsForVehicle($conn, $_GET["id_vehicles"]);
            if (!$return) {
                heaDie(404);
            }
            heaDie(200, $return);
        } else {
            heaDie(400);
        }
    default:
        heaDie(405);
}
?>
