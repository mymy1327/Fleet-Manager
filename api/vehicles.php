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

$vehicleId = $_GET["vehicle"] ?? null;

if (!$vehicleId) {
    http_response_code(400);

    echo json_encode([
        "error" => "vehicle is required"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$sql = "
    SELECT
        id_vehicles,
        name,
        type,
        license_plate,
        code,
        state,
        kilometers
    FROM vehicles
    WHERE id_vehicles = ?
    LIMIT 1
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

$vehicle = $result->fetch_assoc();

if (!$vehicle) {
    http_response_code(404);

    echo json_encode([
        "error" => "Vehicle not found"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

echo json_encode(
    $vehicle,
    JSON_UNESCAPED_UNICODE
);

$stmt->close();
$conn->close();