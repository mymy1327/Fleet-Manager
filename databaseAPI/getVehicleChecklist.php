<?php
/**
 * returns all checklist item for vehicle
 * @param string $_GET["vehicle"] vehicle id
 * @return json list of checklist items
 * @var mysqli $conn
 */
 
session_start();
require "../assets/config.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["vehicle"])) {
    http_response_code(400);
    echo "No arguments received.";
    die();
}

$stmt = $conn->prepare("SELECT JSON_OBJECT('id_checklists', c.id_checklists, 'name', c.name, 'description', c.description) as json FROM `vehicles` v JOIN `vehicle_checklists` vc ON v.id_vehicles = vc.id_vehicles JOIN `checklists` c ON vc.id_checklists = c.id_checklists WHERE v.id_vehicles = ?");
$stmt->bind_param("i",$data["vehicle"]);
$stmt->execute();
$result = $stmt->get_result();

http_response_code(200);
die(json_encode($result->fetch_all()));
?>
