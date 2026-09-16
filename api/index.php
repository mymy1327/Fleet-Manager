<?php
header("Content-Type: application/json");
session_start();
require "../assets/config.php";

$listOfTables = ["checklists", "vehicles", "files"];

$uri = array_slice(explode("/", $_SERVER["REQUEST_URI"]), 2);
//logToConsole($uri[0]);
$data = json_decode(file_get_contents("php://input"), true);

/**
 * returns all entries in table
 * @param mysqli $conn connection to database
 * @param string $table db table name
 * @return json|array[false, int, string|null] list of entries | false on failure
 */
function getFullTable($conn, $table)
{
    $result = $conn->query("SELECT * FROM `$table`");
    if (!$result) {
        return [false, 404];
    }
    $return = $result->fetch_all(MYSQLI_ASSOC);
    //logToConsole($return[2]["name"], );
    return json_encode($return, JSON_NUMERIC_CHECK);
}

/**
 * return entry details
 * @param mysqli $conn connection to database
 * @param string $table db table name
 * @param int $id row id
 * @return json|array[false, int, string|null] entry details | false on failure
 */
function getEntryDetails($conn, $table, $id)
{
    global $listOfTables;
    $stmt = $conn->prepare("SELECT * FROM `$table` WHERE id_$table = ?");
    $intId = (int) $id;
    $stmt->bind_param("i", $intId);
    if (!$stmt->execute()) {
        return [false, 404];
    }
    $return = $stmt->get_result()->fetch_assoc();
    if ($table == $listOfTables[1]) {
        $return["checklist"] = getAllChecklistItemsForVehicle($conn, $intId);
    } elseif ($table == $listOfTables[2]) {
        header("Content-Type: " . $return["type"]);
        header("Content-Length: " . strlen($return["data"]));
        echo $return["data"];
    }
    return json_encode($return);
}

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
 * rewrites checklist item
 * @param mysqli $conn connection to database
 * @param int $id checklist id
 * @param string $name name of checklist item
 * @param string $description description of checklist item
 * @return json|array[false, int, string|null] old checklist item detail | false on failure
 */
function rewriteChecklistItem($conn, $id, $name, $description)
{
    //echo $name, " ", $description;
    $stmt = $conn->prepare("SELECT name, description FROM `checklists` WHERE id_checklists = ?");
    $checklistId = (int) $id;
    $stmt->bind_param("i", $checklistId);
    if (!$stmt->execute()) {
        return [false, 404];
    }
    $result = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    $stmt = $conn->prepare("DELETE FROM `checklists` WHERE id_checklists = ?");
    $stmt->bind_param("i", $checklistId);
    if (!$stmt->execute()) {
        return [false, 409];
    }
    $stmt->close();
    $stmt = $conn->prepare("INSERT INTO `checklists`(`name`, `description`) VALUES (?, ?)");
    $stmt->bind_param("ss", $name, $description);
    if (!$stmt->execute()) {
        return [false, 409];
    }
    $result["new_id"] = $lastid = $conn->insert_id;
    return json_encode($result);
}

/**
 * rewrites checklist item cell
 * @param mysqli $conn connection to database
 * @param int $id checklist id
 * @param string $column name of column to be rewriten
 * @param string $name name of checklist item
 * @param string $description description of checklist item
 * @return json|array[false, int, string|null] old checklist item detail | false on failure
 */
function rewriteChecklistItemCell($conn, $id, $column, $name, $description)
{
    //echo $column," ",$column !=="name";
    if ($column == "name") {
        $value = $name;
    } elseif ($column == "description") {
        $value = $description;
    } else {
        return [false, 415];
    }
    $stmt = $conn->prepare("SELECT `$column` FROM `checklists` WHERE id_checklists = ?");
    $checklistId = (int) $id;
    $stmt->bind_param("i", $checklistId);
    if (!$stmt->execute()) {
        return [false, 400];
    }

    $result = json_encode($stmt->get_result()->fetch_assoc());
    $stmt->close();
    $stmt = $conn->prepare("UPDATE `checklists` SET `$column` = ? WHERE `id_checklists` = ?");
    $stmt->bind_param("si", $value, $checklistId);
    if (!$stmt->execute()) {
        return [false, 409];
    }
    return $result;
}

/**
 * delete checklist item
 * @param mysqli $conn connection to database
 * @param int $id checklist id
 * @return true|array[false, int, string|null] true on success | false on failure
 */
function deleteChecklistItem($conn, $id)
{
    $stmt = $conn->prepare("DELETE FROM `checklists` WHERE id_checklists = ?");
    $checklistId = (int) $id;
    $stmt->bind_param("i", $checklistId);
    if (!$stmt->execute()) {
        return [false, 404];
    }
    return true;
}

if (!in_array($uri[0], $listOfTables)) {
    heaDie(404, json_encode(["error" => ["code" => "not_found", "table" => $uri[0]]], JSON_NUMERIC_CHECK));
}

switch ($_SERVER["REQUEST_METHOD"]) {
    case "GET":
        if (!isset($uri[1])) {
            $return = getFullTable($conn, $uri[0]);
            if (gettype($return) == "array" && !$return[0]) {
                heaDie($return[1]);
            }
            heaDie(200, $return);
        } else {
            $return = getEntryDetails($conn, $uri[0], $uri[1]);
            if (gettype($return) == "array" && !$return[0]) {
                heaDie($return[1]);
            }
            heaDie(200, $return);
        }
    case "POST":
        if (isset($data["name"])) {
            //echo $data["name"], $data["description"];
            $return = createNewChecklistItem($conn, $data["name"], $data["description"]);
            if (gettype($return) == "array" && !$return[0]) {
                heaDie($return[1]);
            }
            heaDie(201, $return);
        } else {
            heaDie(400);
        }
    case "PUT":
        if (isset($data["id_checklists"], $data["name"], $data["description"])) {
            $return = rewriteChecklistItem($conn, $data["id_checklists"], $data["name"], $data["description"]);
            if (gettype($return) == "array" && !$return[0]) {
                heaDie($return[1]);
            }
            heaDie(200, $return);
        } else {
            heaDie(400);
        }
    case "PATCH":
        if (
            isset($data["id_checklists"], $data["column"]) &&
            (isset($data["name"]) || isset($data["description"]))
        ) {
            $return = rewriteChecklistItemCell(
                $conn,
                $data["id_checklists"],
                $data["column"],
                $data["name"],
                $data["description"],
            );
            if (gettype($return) == "array" && !$return[0]) {
                heaDie($return[1]);
            }
            heaDie(200, $return);
        } else {
            heaDie(400);
        }
    case "DELETE":
        if (isset($data["id_checklists"])) {
            $return = deleteChecklistItem($conn, $data["id_checklists"]);
            if (gettype($return) == "array" && !$return[0]) {
                heaDie($return[1]);
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
