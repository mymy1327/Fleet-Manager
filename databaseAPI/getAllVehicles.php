<?php
/**
 * returns all vehicles
 * @return JSON list of vehicles
 * @var mysqli $conn
 */
 
session_start();
require "../assets/config.php";

$result = $conn->query("SELECT JSON_OBJECT('id_vehicles', `id_vehicles`, 'name', `name`, 'type', `type`, 'license_plate', `license_plate`, 'code', `code`, 'last_maintenance', `last_maintenance`, 'photo', `photo`, 'state', `state`) FROM `vehicles`");
http_response_code(200);
die(json_encode($result->fetch_all()));
?>
