<?php
/**
 * @var mysqli $conn
 */
header("Content-Type: application/json");
header("Allow: DELETE, PUT, PATCH");
header("Access-Control-Allow-Methods: DELETE");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, Origin");
//session_start();
require "../../assets/config.php";

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    heaDie(200);
}

$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
$uri = array_slice(explode("/", $path), 2);
//logToConsole($uri[0]);
//logToConsole($_GET["id_vehicles"]);
$data = json_decode(file_get_contents("php://input"), true);

/**
 * returns all entries in table
 * @param mysqli $conn connection to database
 * @param string $filterColumn filtered column
 * @param string $filter filtering value
 * @return json|array[false, int, string|null] list of entries | false on failure
 */
function getFullTable($conn, $table = "problems", $filterColumn, $filter)
{
    //logToConsole($filter);
    if (isset($filterColumn)) {
        $stmt = $conn->prepare("SELECT * FROM `$table` WHERE `$filterColumn` = ?");
        $stmt->bind_param("s", $filter);
        if (!$stmt->execute()) {
            return [false, 404];
        }
        $return = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    } else {
        $result = $conn->query("SELECT * FROM `problems`");
        if (!$result) {
            return [false, 404];
        }
        $return = $result->fetch_all(MYSQLI_ASSOC);
    }

    foreach ($return as $key => $problem) {
        $return[$key]["checklist"] = json_decode(
            getEntryDetails($conn, "checklists", $problem["id_checklists"]),
            true,
        );
    }

    //logToConsole($return[2]["name"], );
    return json_encode($return, JSON_NUMERIC_CHECK);
}

/**
 * returns all entries in table
 * @param mysqli $conn connection to database
 * @param string $filter filtering value
 * @return json|array[false, int, string|null] list of entries | false on failure
 */
function getProblemsByVehicleId($conn, $filter)
{
    //logToConsole($filter);
    $stmt = $conn->prepare(
        "SELECT p.* FROM `problems` p JOIN `inspections` i ON i.id_inspections = p.id_inspections WHERE id_vehicles = ?",
    );
    $stmt->bind_param("s", $filter);
    if (!$stmt->execute()) {
        return [false, 404];
    }
    $return = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    foreach ($return as $key => $problem) {
        $return[$key]["checklist"] = json_decode(
            getEntryDetails($conn, "checklists", $problem["id_checklists"]),
            true,
        );
    }

    //logToConsole($return[2]["name"], );
    return json_encode($return, JSON_NUMERIC_CHECK);
}

/**
 * return entry details
 * @param mysqli $conn connection to database
 * @param int $id row id
 * @return json|array[false, int, string|null] entry details | false on failure
 */
function getEntryDetails($conn, $table = "problems", $id)
{
    $table = $table ?? "problems";
    $stmt = $conn->prepare("SELECT * FROM `$table` WHERE id_$table = ?");
    $intId = (int) $id;
    $stmt->bind_param("i", $intId);
    if (!$stmt->execute()) {
        return [false, 404];
    }
    $return = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (is_null($return)) {
        return [false, 404];
    }

    if ($table == "problems" && !is_null($return["id_checklists"])) {
        $checklistTable = getEntryDetails($conn, "checklists", $return["id_checklists"]);
        if (gettype($checklistTable) == "array" && !$checklistTable[0]) {
            heaDie($checklistTable[1]);
        }
        $return["checklist"] = json_decode($checklistTable, true);
    }

    return json_encode($return, JSON_NUMERIC_CHECK);
}

switch ($_SERVER["REQUEST_METHOD"]) {
    case "GET":
        $filterColumn = null;
        $filter = null;
        if (isset($_GET["id_vehicles"]) && !is_null($_GET["id_vehicles"]) && $_GET["id_vehicles"] != "") {
            $return = getProblemsByVehicleId($conn, $_GET["id_vehicles"]);
            if (gettype($return) == "array" && !$return[0]) {
                heaDie($return[1]);
            }
            heaDie(200, $return);
        }
        if (!isset($uri[1])) {
            $return = getFullTable($conn, null, $filterColumn, $filter);
            if (gettype($return) == "array" && !$return[0]) {
                heaDie($return[1]);
            }
            heaDie(200, $return);
        } else {
            $return = getEntryDetails($conn, null, $uri[1]);
            if (gettype($return) == "array" && !$return[0]) {
                heaDie($return[1]);
            }
            heaDie(200, $return);
        }
    case "POST":
        //logToConsole($return[0]);
        if (gettype($return) == "array" && !$return[0]) {
            heaDie($return[1]);
        }
        heaDie(201, $return);

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
