<?php
/**
 * @var mysqli $conn
 */
header("Content-Type: application/json");
header("Allow: *");
header("Access-Control-Allow-Methods: *");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, Origin");
//session_start();
require "../assets/config.php";

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    heaDie(200);
}

$listOfTables = ["checklists", "vehicles", "files", "users", "inspections"];

$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
$uri = array_slice(explode("/", $path), 2);
//logToConsole($uri[0]);
//logToConsole($_GET["id_vehicles"]);
$data = json_decode(file_get_contents("php://input"), true);

/**
 * checking the datetime to turn all vehicles available after 16:00
 */
date_default_timezone_set("Europe/Helsinki");
$currentHour = date("H");
$currentDate = date("Y-m-d");
if ($currentHour >= 16) {
    $conn->query("UPDATE `vehicles` SET `state`='available' WHERE state = 'in_use'");
} else {
    $conn->query("UPDATE `vehicles` v
    JOIN inspections i
        ON v.id_vehicles = i.id_vehicles
    JOIN (
        SELECT id_vehicles, MAX(`date`) AS latest_date
        FROM inspections
        GROUP BY id_vehicles
    ) latest
        ON i.id_vehicles = latest.id_vehicles
        AND i.`date` = latest.latest_date
    SET `state`='available'
    WHERE DATE(i.`date`) < CURDATE()
    AND `state` = 'in_use'");
}

/**
 * returns all entries in table
 * @param mysqli $conn connection to database
 * @param string $table db table name
 * @param string[] $filterColumn filtered column
 * @param string[] $filter filtering value
 * @param string|null $orderBy order field
 * @param string|null $orderWay[ASC | DESC]
 * @param int|null $offset offset to limit rows
 * @param int|null $limit number of rows to return
 * @return json|array[int, string|null] list of entries | array with error code on failure
 */
function getFullTable(
    $conn,
    $table,
    $filterColumn,
    $filter,
    $orderBy = null,
    $orderWay = null,
    $offset = null,
    $limit = null,
) {
    $orderBy = $orderBy ?? "id_$table";
    $orderWay = $orderWay ?? "ASC";
    $offset = $offset ?? null;
    $limit = $limit ?? null;
    global $listOfTables;
    //logToConsole($filter);
    if (count($filterColumn) > 0) {
        $query = "SELECT * FROM `$table` WHERE";
        $types = "";
        for ($i = 0; $i < count($filterColumn); $i++) {
            $types .= "s";
            if ($filterColumn[$i] == "date") {
                if ($i == 0) {
                    $query .= " CAST(`date` AS DATE) = ?";
                } else {
                    $query .= " AND CAST(`date` AS DATE) = ?";
                }
            } elseif ($i == 0) {
                $query .= " `$filterColumn[$i]` = ?";
            } else {
                $query .= " AND `$filterColumn[$i]` = ?";
            }
        }
        $query .= " ORDER BY `$orderBy` $orderWay";
        if (isset($offset)) {
            $query .= " OFFSET ? ROW";
            $types .= "i";
            $filter[] = $offset;
        }
        if (isset($limit)) {
            $query .= "  FETCH NEXT ? ROWS ONLY";
            $types .= "i";
            $filter[] = $limit;
        }
        $stmt = $conn->prepare($query);
        $stmt->bind_param($types, ...$filter);
        if (!$stmt->execute()) {
            return [404];
        }
        $return = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    } else {
        $query = "SELECT * FROM `$table`";
        $query .= " ORDER BY `$orderBy` $orderWay";
        if (!is_null($offset)) {
            $query .= " OFFSET $offset ROW";
        }
        if (!is_null($limit)) {
            $query .= " FETCH NEXT $limit ROWS ONLY";
        }
        $result = $conn->query($query);
        if (!$result) {
            return [404];
        }
        $return = $result->fetch_all(MYSQLI_ASSOC);
    }

    if ($table == $listOfTables[1]) {
        foreach ($return as $key => $vehicle) {
            $stmt = $conn->prepare("SELECT km FROM `inspections` WHERE id_vehicles = ? ORDER BY date DESC LIMIT 1");
            $stmt->bind_param("i", $vehicle["id_vehicles"]);
            if (!$stmt->execute()) {
                return [404];
            }
            $return[$key]["km"] = $stmt->get_result()->fetch_assoc()["km"] ?? null;
        }
    }
    //logToConsole($return[2]["name"], );
    return json_encode($return, JSON_NUMERIC_CHECK);
}

/**
 * return entry details
 * @param mysqli $conn connection to database
 * @param string $table db table name
 * @param int $id row id
 * @param bool $_rec true to stop recursion
 * @return json|array[int, string|null] entry details | array wit error code on failure
 */
function getEntryDetails($conn, $table, $id, $_rec = false)
{
    global $listOfTables;
    $stmt = $conn->prepare("SELECT * FROM `$table` WHERE id_$table = ?");
    $intId = (int) $id;
    $stmt->bind_param("i", $intId);
    if (!$stmt->execute()) {
        return [404];
    }
    $return = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (is_null($return) && $table != $listOfTables[2]) {
        return [404];
    }
    if ($table == $listOfTables[1]) {
        $return["checklist"] = getAllChecklistItemsForVehicle($conn, $intId);
        $stmt = $conn->prepare("SELECT km FROM `inspections` WHERE id_vehicles = ? ORDER BY date DESC LIMIT 1");
        $stmt->bind_param("i", $intId);
        if (!$stmt->execute()) {
            return [404];
        }
        $return["km"] = $stmt->get_result()->fetch_assoc()["km"] ?? null;
    } elseif ($table == $listOfTables[2]) {
        if (is_null($return)) {
            $row = $conn->query("SELECT * FROM `files` WHERE id_files = 8")->fetch_assoc();
            header("Content-Type: " . $row["type"]);
            header("Content-Length: " . strlen($row["data"]));
            echo $row["data"];
            die();
        }
        header("Content-Type: " . $return["type"]);
        header("Content-Length: " . strlen($return["data"]));
        echo $return["data"];
        die();
    } elseif ($table == $listOfTables[4]) {
        if ($return["passed"] === 0) {
            $return["problems"] = json_decode(getFullTable($conn, "problems", "id_inspections", $intId), true);
            foreach ($return["problems"] as $key => $problem) {
                $return["problems"][$key]["checklist"] = json_decode(
                    getEntryDetails($conn, "checklists", $problem["id_checklists"]),
                    true,
                );
            }
        }
        if (!$_rec) {
            $inspectionDetails = getEntryDetails($conn, "inspections", (int) $return["link"], true);
            if (gettype($inspectionDetails) == "array" && !$inspectionDetails[0]) {
                return $inspectionDetails;
            }
            if (!is_null($return["link"]) && $return["type"] == "departure") {
                $return["return"] = json_decode($inspectionDetails, true);
            } elseif (!is_null($return["link"])) {
                $return["departure"] = json_decode($inspectionDetails, true);
            }
        }
    }
    return json_encode($return, JSON_NUMERIC_CHECK);
}

/**
 * return all checklist items for vehicle
 * @param mysqli $conn connection to database
 * @param int $id vehicle id
 * @return array|false checklist items | false on failure
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
    return $result->fetch_all(MYSQLI_ASSOC);
}

/**
 * link checklist items to vehicle
 * @param mysqli $conn connection to database
 * @param int $vehicleId id to vehicle
 * @param int $checklistId id to checklist item
 * @return true|array[false, int, string|null] false on failure
 */
function addChecklistToVehicle($conn, $vehicleId, $checklistId)
{
    $int_id_vehicles = (int) $vehicleId;
    $int_id_checklists = (int) $checklistId;

    $stmt = $conn->prepare("INSERT INTO `vehicle_checklists`(`id_vehicles`, `id_checklists`) VALUES (?, ?)");
    $stmt->bind_param("ii", $int_id_vehicles, $int_id_checklists);

    if (!$stmt->execute()) {
        return [
            false,
            400,
            json_encode(
                ["error" => "bad_request", "message" => "Could not insert into database."],
                JSON_NUMERICAL_CHECK,
            ),
        ];
    }
    return true;
}

/**
 * unlink checklist items from vehicle
 * @param mysqli $conn connection to database
 * @param int $vehicleId id to vehicle
 * @param int $checklistId id to checklist item
 * @return true|array[false, int, string|null] false on failure
 */
function removeChecklistFromVehicle($conn, $vehicleId, $checklistId)
{
    $int_id_vehicles = (int) $vehicleId;
    $int_id_checklists = (int) $checklistId;

    $stmt = $conn->prepare("DELETE FROM `vehicle_checklists` WHERE id_vehicles = ? and id_checklists = ?");
    $stmt->bind_param("ii", $int_id_vehicles, $int_id_checklists);

    if (!$stmt->execute()) {
        return [
            false,
            400,
            json_encode(
                ["error" => "bad_request", "message" => "Could not remove from database."],
                JSON_NUMERICAL_CHECK,
            ),
        ];
    }
    return true;
}

/**
 * create new checklist item
 * @param mysqli $conn connection to database
 * @param string $name name of checklist item
 * @param string $description description of checklist item
 * @return json|array[false, int, string|null] details about new checklist item | false on failure
 */
function createNewChecklistItem($conn, $name, $description)
{
    $stmt = $conn->prepare("INSERT INTO `checklists`(`name`, `description`) VALUES (?, ?)");
    $stmt->bind_param("ss", $name, $description);
    if (!$stmt->execute()) {
        return [false, 400];
    }
    $result = [];
    $result["new_id"] = $conn->insert_id;
    $result["name"] = $name;
    $result["description"] = $description;
    return json_encode($result, JSON_NUMERIC_CHECK);
}

/**
 * create new file
 * @param mysqli $conn connection to database
 * @param file $file file object
 * @return json|array[false, int, string|null] new id | false on failure
 */
function createNewFile($conn, $file)
{
    $tempPath = $file["tmp_name"];
    $fileName = $file["name"];
    $fileType = $file["type"];
    logToConsole($file["tmp_name"] . " " . $tempPath . " " . $fileName);

    $fileContent = file_get_contents($tempPath);

    unlink($tempPath);

    $stmt = $conn->prepare("INSERT INTO `files` (`name`, `type`, `data`) VALUES (?, ?, ?)");

    $stmt->bind_param("sss", $fileName, $fileType, $fileContent);

    if ($stmt->execute()) {
        return json_encode(["new_id" => $conn->insert_id]);
    } else {
        return [false, 400];
    }
}

/**
 * create new vehicle
 * @param mysqli $conn connection to database
 * @param string $name name of vehicle
 * @param string $type type of vehicle
 * @param string $licensePlate license plate of vehicle
 * @param string $code vehicle code
 * @param string $lastMaintenance date of last maintenance on vehicle in format YYYY-MM-DD
 * @param string $lastMaintenanceKm
 * @param string $nextMaintenance
 * @param string $maintenanceIntervalKm
 * @param string|null $blob picture of vehicle in blob string
 * @param string|null $state state of vehicle (available, in_use, disabled)
 * @return json|array[false, int, string|null] details about new vehicle | false on failure
 */
function createNewVehicle(
    $conn,
    $name,
    $type,
    $licensePlate,
    $code,
    $lastMaintenance = null,
    $lastMaintenanceKm,
    $nextMaintenance,
    $maintenanceIntervalKm,
    $idFiles = null,
    $state = "available",
) {
    logToConsole($lastMaintenance);
    $stmt = $conn->prepare(
        "INSERT INTO `vehicles`(`name`, `type`, `license_plate`, `code`, `last_maintenance`, `last_maintenance_km`, `next_maintenance`, `maintenance_interval_km`, `id_files`, `state`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );

    $int_id_files = (int) $idFiles;
    $int_last_maintenance_km = (int) $lastMaintenanceKm;
    $int_maintenance_interval_km = (int) $maintenanceIntervalKm;

    $stmt->bind_param(
        "sssssisiis",
        $name,
        $type,
        $licensePlate,
        $code,
        $lastMaintenance,
        $int_last_maintenance_km,
        $nextMaintenance,
        $int_maintenance_interval_km,
        $int_id_files,
        $state,
    );
    if (!$stmt->execute()) {
        return [false, 400];
    }

    $result = [
        "new_id" => $conn->insert_id,
        "name" => $name,
        "type" => $type,
        "license_plate" => $licensePlate,
        "code" => $code,
        "last_maintenance" => $lastMaintenance,
        "last_maintenance_km" => $lastMaintenanceKm,
        "next_maintenance" => $nextMaintenance,
        "maintenance_interval_km" => $maintenanceIntervalKm,
        "id_files" => $idFiles,
        "state" => $state,
    ];
    addChecklistToVehicle($conn, $result["new_id"], 25);
    return json_encode($result, JSON_NUMERIC_CHECK);
}

/**
 * create new user
 * @param mysqli $conn connection to database
 * @param string $username name of user
 * @param string $email email of user
 * @param string $password password of user
 * @param string $role user role
 * @return json|array[false, int, string|null] detail about new user | false on failure
 */
function createNewUser($conn, $username, $email, $password, $role)
{
    $stmt = $conn->prepare("INSERT INTO `users`(`username`, `email`, `password`, `role`) VALUES (?,?,?,?)");
    $stmt->bind_param("ssss", $username, $email, $password, $role);

    if (!$stmt->execute()) {
        return [false, 400];
    }

    return json_encode(
        [
            "new_id" => $conn->insert_id,
            "username" => $username,
            "email" => $email,
            "password" => $password,
            "role" => $role,
        ],
        JSON_NUMERIC_CHECK,
    );
}

/**
 * create new inspection
 * @param mysqli $conn connection to database
 * @param int $id_vehicles id of vehicle
 * @param 0|1 $passed if no problems;
 * @param string $note inspection note
 * @param int $id_users user submitting the inspection
 * @param int $km KiloMeter reading
 * @param int $fuel fuel tank percentage
 * @param int $oil_picture file id of oil stick
 * @param string $type departure|return
 * @param int $link on return, id_inspections to departure inspection
 * @return json|array[false, int, string|null] details about new issue | false on failure
 */
function createNewInspection($conn, $id_vehicles, $passed, $note, $id_users, $km, $fuel, $oil_picture, $type, $link)
{
    if ($type == "departure") {
        $link = null;
    }
    $stmt = $conn->prepare(
        "INSERT INTO `inspections`(`id_vehicles`, `passed`, `note`, `id_users`, `km`, `fuel`, `oil_picture`, `type`, `link`) VALUES (?,?,?,?,?,?,?,?,?)",
    );

    $int_id_vehicles = (int) $id_vehicles;
    $int_passed = (int) $passed;
    $int_id_users = (int) $id_users;
    $int_km = (int) $km;
    $int_fuel = (int) $fuel;
    $int_oil_picture = (int) $oil_picture;
    $int_link = (int) $link ?? null;

    if ($type == "departure") {
        $int_link = null;
    }

    $stmt->bind_param(
        "iisiiiisi",
        $int_id_vehicles,
        $int_passed,
        $note,
        $int_id_users,
        $int_km,
        $int_fuel,
        $int_oil_picture,
        $type,
        $int_link,
    );

    if (!$stmt->execute()) {
        return [false, 400];
    }
    $stmt->close();
    $return = [
        "new_id" => $conn->insert_id,
        "passed" => $passed,
        "note" => $note,
        "date" => date("Y-m-d H:i:s"),
        "id_users" => $id_users,
        "km" => $km,
        "fuel" => $fuel,
        "oil_picture" => $oil_picture,
        "type" => $type,
        "link" => $link,
    ];

    if ($type == "return" && !is_null($link)) {
        if (
            !$conn->query("UPDATE `inspections` SET `link` = " . $return["new_id"] . " WHERE id_inspections = $link")
        ) {
            return [
                false,
                400,
                json_encode([
                    "error" => ["code" => "bad_request", "note" => "Could't set link for inspection id = $link"],
                ]),
            ];
        }
    }

    return json_encode($return, JSON_NUMERIC_CHECK);
}

/**
 * PUT update checklist
 * @param mysqli $conn connection to database
 * @param int $checklistId id of checklist to update
 * @param string $name new name
 * @param string $description new description
 * @return json|array[int, string|null] new entry details | array with error code on failure
 */
function updateWholeChecklist($conn, $checklistId, $name, $description)
{
    $int_id_checklists = (int) $checklistId;
    $stmt = $conn->prepare("UPDATE `checklists` SET `name`=?,`description`=? WHERE id_checklists = ?");
    $stmt->bind_param("ssi", $name, $descriptions, $int_id_checklists);

    if (!$stmt->execute()) {
        return [400];
    }
    $stmt->close();

    $stmt = $conn->prepare("SELECT * FROM `checklists` WHERE `id_checklists` = ?");
    $stmt->bind_param("i", $int_id_checklists);

    if (!$stmt->execute()) {
        return [400];
    }

    $return = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    return json_encode($return, JSON_NUMERIC_CHECK);
}

/**
 * PUT update vehicle
 * @param mysqli $conn connection to database
 * @param int $vehicleId id of vehicle to update
 * @param string $name new name of vehicle
 * @param string $type new type of vehicle
 * @param string $licensePlate new license plate of vehicle
 * @param string $code new vehicle code
 * @param string $lastMaintenance  new date of last maintenance on vehicle in format YYYY-MM-DD
 * @param string $lastMaintenanceKm new km reading when last maintenance
 * @param string $nextMaintenance new next maintenance date in format YYYY-MM-DD
 * @param string $maintenanceIntervalKm new interval between maintenances
 * @param string $idFiles new picture of vehicle
 * @param string $state[available | in_use | disabled] state of vehicle
 * @return json|array[int, string|null] details about new vehicle | array with error code on failure
 */
function updateWholeVehicle(
    $conn,
    $vehicleId,
    $name,
    $type,
    $licensePlate,
    $code,
    $lastMaintenance,
    $lastMaintenanceKm,
    $nextMaintenance,
    $maintenanceIntervalKm,
    $idFiles,
    $state,
) {
    $int_id_vehicles = (int) $vehicleId;
    $int_id_files = (int) $idFiles;
    $int_maintenance_interval_km = (int) $maintenanceIntervalKm;
    $stmt = $conn->prepare(
        "UPDATE `vehicles` SET `name`=?,`type`=?,`license_plate`=?,`code`=?,`last_maintenance`=?,`last_maintenance_km`=?,`next_maintenance`=?,`maintenance_interval_km`=?,`id_files`=?,`state`=? WHERE id_vehicles = ?",
    );
    $stmt->bind_param(
        "sssssssiisi",
        $name,
        $type,
        $licensePlate,
        $code,
        $lastMaintenance,
        $lastMaintenanceKm,
        $nextMaintenance,
        $int_maintenance_interval_km,
        $int_id_files,
        $state,
        $int_id_vehicles,
    );

    if (!$stmt->execute()) {
        return [400];
    }
    $stmt->close();

    $stmt = $conn->prepare("SELECT * FROM `vehicles` WHERE `id_vehicles` = ?");
    $stmt->bind_param("i", $int_id_vehicles);

    if (!$stmt->execute()) {
        return [400];
    }

    $return = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    return json_encode($return, JSON_NUMERIC_CHECK);
}

/**
 * PUT update user
 * @param mysqli $conn connection to database
 * @param int $userId id of user to update
 * @param string $username new username
 * @param string $email new email
 * @param string $role new user role
 * @return json|array[int, string|null] new entry details | array with error code on failure
 */
function updateWholeUser($conn, $userId, $username, $email, $password, $role)
{
    $int_id_users = (int) $userId;
    $stmt = $conn->prepare("UPDATE `users` SET `username`=?,`email`=?,`password`=?,`role`=? WHERE id_users = ?");
    $stmt->bind_param("ssssi", $username, $email, $password, $role, $int_id_users);

    if (!$stmt->execute()) {
        return [400];
    }
    $stmt->close();

    $stmt = $conn->prepare("SELECT * FROM `users` WHERE `id_users` = ?");
    $stmt->bind_param("i", $int_id_users);

    if (!$stmt->execute()) {
        return [400];
    }

    $return = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    return json_encode($return, JSON_NUMERIC_CHECK);
}

/**
 * PATCH update entry
 * @param mysqli $conn connection to database
 * @param string $table patent table of entry
 * @param int $id id of entry to update
 * @param array $data array of fields and values to updata
 * @param array $checkList array of acceptable fields
 * @return json|array[int, string|null] updated entry details | array with error code on failure
 */
function update($conn, $table, $id, $data, $checkList)
{
    $int_id = (int) $id;

    $quary = "UPDATE `$table` SET";
    $values = [];
    $types = "";
    $first = true;
    foreach ($data as $key => $value) {
        if (!in_array($key, $checkList)) {
            return [
                400,
                json_encode(["error" => "Bad Request", "message" => "$key was not found in table $table."]),
            ];
        }
        if ($first) {
            $quary .= " $key = ?";
            $first = false;
        } else {
            $quary .= ", $key = ?";
        }
        $values[] = $value;
        $types .= "s";
    }
    $values[] = $int_id;
    $quary .= " WHERE `id_$table` = ?";

    $stmt = $conn->prepare($quary);
    $stmt->bind_param($types . "i", ...$values);

    if (!$stmt->execute()) {
        return [400];
    }
    $stmt->close();
    $stmt = $conn->prepare("SELECT * FROM `$table` WHERE `id_$table` = ?");
    $stmt->bind_param("i", $int_id);

    if (!$stmt->execute()) {
        return [false, 400];
    }

    $return = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    return json_encode($return, JSON_NUMERIC_CHECK);
}

/**
 * delete entry
 * @param mysqli $conn connection to database
 * @param string $table db table name
 * @param int $id entry id
 * @return true|array[int, string|null] true on success | array with error code on failure
 */
function deleteEntry($conn, $table, $id)
{
    $stmt = $conn->prepare("DELETE FROM `$table` WHERE id_$table = ?");
    $intId = (int) $id;
    $stmt->bind_param("i", $intId);
    if (!$stmt->execute()) {
        return [404, json_encode(["error" => "Not Found", "message" => "Entry $intId not found in $table."])];
    }
    return true;
}

if (
    !in_array($uri[0], $listOfTables) ||
    ($uri[0] == $listOfTables[2] && $uri[1] == 8 && $_SERVER["REQUEST_METHOD"] != "GET") //prevent deletion of laughing cat
) {
    heaDie(404, json_encode(["error" => "not_found", "message" => $uri[0]], JSON_NUMERIC_CHECK));
}

switch ($_SERVER["REQUEST_METHOD"]) {
    case "GET":
        $filterColumn = [];
        $filter = [];
        $order_by = null;
        $order_way = null;
        $offset = null;
        $limit = null;
        if (isset($_GET["order_by"]) && !is_null($_GET["order_by"]) && $_GET["order_by"] != "") {
            $order_by = $_GET["order_by"];
        }
        if (isset($_GET["order_way"]) && !is_null($_GET["order_way"]) && $_GET["order_way"] != "") {
            $order_way = $_GET["order_way"];
        }
        if (isset($_GET["offset"]) && !is_null($_GET["offset"]) && $_GET["offset"] != "") {
            $offset = $_GET["offset"];
        }
        if (isset($_GET["limit"]) && !is_null($_GET["limit"]) && $_GET["limit"] != "") {
            $limit = $_GET["limit"];
        }

        if (
            isset($_GET["id_vehicles"]) &&
            !is_null($_GET["id_vehicles"]) &&
            $_GET["id_vehicles"] != "" &&
            in_array($uri[0], [$listOfTables[0], $listOfTables[4]])
        ) {
            $filterColumn[] = "id_vehicles";
            $filter[] = $_GET["id_vehicles"];
            if ($uri[0] == $listOfTables[0]) {
                heaDie(200, json_encode(getAllChecklistItemsForVehicle($conn, $filter[0]), JSON_NUMERIC_CHECK));
            }
        }
        if (
            isset($_GET["code"]) &&
            !is_null($_GET["code"]) &&
            $_GET["code"] != "" &&
            in_array($uri[0], [$listOfTables[1]])
        ) {
            $filterColumn[] = "code";
            $filter[] = $_GET["code"];
        }
        if (
            isset($_GET["state"]) &&
            !is_null($_GET["state"]) &&
            $_GET["state"] != "" &&
            in_array($uri[0], [$listOfTables[1]])
        ) {
            $filterColumn[] = "state";
            $filter[] = $_GET["state"];
        }
        if (
            isset($_GET["id_users"]) &&
            !is_null($_GET["id_users"]) &&
            $_GET["id_users"] != "" &&
            in_array($uri[0], [$listOfTables[4]])
        ) {
            $filterColumn[] = "id_users";
            $filter[] = $_GET["id_users"];
        }
        if (
            isset($_GET["date"]) &&
            !is_null($_GET["date"]) &&
            $_GET["date"] != "" &&
            in_array($uri[0], [$listOfTables[4]])
        ) {
            $filterColumn[] = "date";
            $filter[] = $_GET["date"];
        }

        if (!isset($uri[1])) {
            $return = getFullTable($conn, $uri[0], $filterColumn, $filter, $order_by, $order_way, $offset, $limit);
            if (gettype($return) == "array") {
                heaDie($return[0], $return[1] ?? null);
            }
            heaDie(200, $return);
        } else {
            $return = getEntryDetails($conn, $uri[0], $uri[1]);
            if (gettype($return) == "array") {
                heaDie($return[0], $return[1] ?? null);
            }
            heaDie(200, $return);
        }
    case "POST":
        switch (array_search($uri[0], $listOfTables)) {
            case 0:
                $return = createNewChecklistItem($conn, $data["name"], $data["description"]);
                break;
            case 1:
                if (isset($uri[1])) {
                    $return = addChecklistToVehicle($conn, $uri[1], $data["id_checklists"]);
                    if (gettype($return) == "array" && !$return[0]) {
                        heaDie($return[1], $return[2] ?? null);
                    }
                    heaDie(204);
                } else {
                    $return = createNewVehicle(
                        $conn,
                        $data["name"],
                        $data["type"],
                        $data["license_plate"],
                        $data["code"],
                        $data["last_maintenance"],
                        $data["last_maintenance_km"],
                        $data["next_maintenance"],
                        $data["maintenance_interval_km"],
                        $data["id_files"],
                        $data["state"],
                    );
                }
                break;
            case 2:
                $return = createNewFile($conn, $_FILES["file"]);
                break;
            case 3:
                $return = createNewUser($conn, $data["username"], $data["email"], $data["password"], $data["role"]);
                break;
            case 4:
                $return = createNewInspection(
                    $conn,
                    $data["id_vehicles"],
                    $data["passed"],
                    $data["note"],
                    $data["id_users"],
                    $data["km"],
                    $data["fuel"],
                    $data["oil_picture"],
                    $data["type"],
                    $data["link"],
                );
        }
        //logToConsole($return[0]);
        if (gettype($return) == "array" && !$return[0]) {
            heaDie($return[1], $return[2] ?? null);
        }
        heaDie(201, $return);
    case "PUT":
        if (isset($uri[1])) {
            switch (array_search($uri[0], $listOfTables)) {
                case 0:
                    $return = updateWholeChecklist($conn, $uri[1], $data["name"], $data["description"]);
                    break;
                case 1:
                    $return = updateWholeVehicle(
                        $conn,
                        $uri[1],
                        $data["name"],
                        $data["type"],
                        $data["license_plate"],
                        $data["code"],
                        $data["last_maintenance"],
                        $data["last_maintenance_km"],
                        $data["next_maintenance"],
                        $data["maintenance_interval_km"],
                        $data["id_files"],
                        $data["state"],
                    );
                    break;
                case 3:
                    $return = updateWholeUser(
                        $conn,
                        $uri[1],
                        $data["username"],
                        $data["email"],
                        $data["password"],
                        $data["role"],
                    );
                    break;
                default:
                    heaDie(400);
            }
            if (gettype($return) == "array") {
                heaDie($return[0], $return[1] ?? null);
            }
        } else {
            heaDie(400, json_encode(["error" => "Bad Request", "message" => "No id provided."]));
        }
    case "PATCH":
        if (isset($uri[1])) {
            switch (array_search($uri[0], $listOfTables)) {
                case 0:
                    $return = update($conn, $uri[0], $uri[1], $data, ["name", "description"]);
                    break;
                case 1:
                    $return = update($conn, $uri[0], $uri[1], $data, [
                        "name",
                        "type",
                        "license_plate",
                        "code",
                        "last_maintenance",
                        "last_maintenance_km",
                        "next_maintenance",
                        "maintenance_interval_km",
                        "id_files",
                        "state",
                    ]);
                    break;
                case 3:
                    $return = update($conn, $uri[0], $uri[1], $data, ["username", "email", "password", "role"]);
                    break;
            }
            if (gettype($return) == "array") {
                heaDie($return[0], $return[1] ?? null);
            }
            heaDie(200, $return);
        } else {
            heaDie(400);
        }
    case "DELETE":
        if (isset($uri[1])) {
            if (
                ($uri[0] == $listOfTables[0] && $uri[1] == 25) ||
                ($uri[0] == $listOfTables[1] && $uri[2] == 25) ||
                ($uri[0] == $listOfTables[0] && $uri[1] == 1) ||
                ($uri[0] == $listOfTables[1] && $uri[2] == 1) ||
                ($uri[0] == $listOfTables[0] && $uri[1] == 2) ||
                ($uri[0] == $listOfTables[1] && $uri[2] == 2)
            ) {
                //prevent deletion of oil checklist (mandatory item)
                heaDie(400, ["error" => "Bad Request", "message" => "Can't delete this checklist item."]);
            }
            if (isset($uri[2])) {
                if ($uri[0] == $listOfTables[1]) {
                    $return = removeChecklistFromVehicle($conn, $uri[1], $uri[2]);
                }
            } else {
                $return = deleteEntry($conn, $uri[0], $uri[1]);
            }

            if (gettype($return) == "array") {
                heaDie($return[0], $return[1] ?? null);
            }
            if ($return) {
                heaDie(204);
            }
        } else {
            heaDie(400);
        }
    default:
        heaDie(405);
}
heaDie(405);
