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
require "../../assets/config.php";


if ($_SERVER["REQUEST_METHOD"] !== "GET") {

    http_response_code(405);

    echo json_encode([
        "error" => "Method not allowed"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


$vehicleId = $_GET["id_vehicles"] ?? null;


if (!$vehicleId) {

    http_response_code(400);

    echo json_encode([
        "error" => "id_vehicles is required"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


$sql = "
    SELECT
        id_checklists,
        id_vehicles,
        name,
        descriptions
    FROM checklists
    WHERE id_vehicles = ?
    ORDER BY id_checklists ASC
";


$stmt = $conn->prepare($sql);


if (!$stmt) {

    http_response_code(500);

    echo json_encode([
        "error" => "SQL prepare failed",
        "details" => $conn->error
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


$stmt->bind_param("i", $vehicleId);

$stmt->execute();

$result = $stmt->get_result();

$checklists = [];


while ($row = $result->fetch_assoc()) {

    $checklists[] = $row;

}


echo json_encode(
    $checklists,
    JSON_UNESCAPED_UNICODE
);


$stmt->close();

$conn->close();
