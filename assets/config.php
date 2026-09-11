<?php
// DB login info
$servername = "10.1.17.108:3306";
$username = 'root';
$password = "root";
$dbname = "fleet-manager";

//Connect
$conn = new mysqli($servername, $username, $password, $dbname);
$conn->set_charset("utf8");
if ($conn->connect_error) {
    die("Error connecting to DB: " . $conn->connect_error);
}
