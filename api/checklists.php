<?php

/**
 * GET - returns checklist items assigned to a vehicle
 *
 * @var mysqli $conn
 */

session_start();

require_once __DIR__ . "/../assets/config.php";

if ($_SERVER["REQUEST_METHOD"] !== "GET") {

    http_response_code(405);

    echo json_encode([
        "error" => "Method not allowed"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

// Get vehicle ID from the request
$vehicleId = $_GET["vehicle"] ?? null;

if (!$vehicleId) {

    http_response_code(400);

    echo json_encode([
        "error" => "vehicle is required"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$vehicleId = (int) $vehicleId;

// Get checklist items through the vehicle_checklists relation table
$sql = "
    SELECT
        c.id_checklists,
        c.name,
        c.description
    FROM vehicle_checklists vc
    INNER JOIN checklists c
        ON vc.id_checklists = c.id_checklists
    WHERE vc.id_vehicles = ?
    ORDER BY c.id_checklists ASC
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

if (!$stmt->execute()) {

    http_response_code(500);

    echo json_encode([
        "error" => "SQL execute failed",
        "details" => $stmt->error
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$result = $stmt->get_result();

$checklists = [];

while ($row = $result->fetch_assoc()) {
    $checklists[] = $row;
}

http_response_code(200);

echo json_encode(
    $checklists,
    JSON_UNESCAPED_UNICODE
);

$stmt->close();
$conn->close();

?>