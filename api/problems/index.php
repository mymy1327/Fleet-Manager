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
 * @param string $table "problems" added for backward compatibility
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
    $table = "problems",
    $filterColumn,
    $filter,
    $orderBy = null,
    $orderWay = null,
    $offset = null,
    $limit = null,
) {
    $table = $table ?? "problems";
    $orderBy = $orderBy ?? "id_$table";
    $orderWay = $orderWay ?? "ASC";
    $offset = $offset ?? null;
    $limit = $limit ?? null;
    //logToConsole($filter);
    if (count($filterColumn) > 0) {
        $query = "SELECT * FROM `$table` WHERE";
        $types = "";
        for ($i = 0; $i < count($filterColumn); $i++) {
            if ($i == 0) {
                $query .= " `$filterColumn[$i]` = ?";
            } else {
                $query .= " AND `$filterColumn[$i]` = ?";
            }
            $types .= "s";
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
 * @param string $table "problems" added for backward compatibility
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

/**
 * create problem
 * @param mysqli $conn connection to database
 * @param int $inspectionId id of inspection
 * @param int $checklistId id of checklist
 * @param string $note note about problem
 * @param int $fileId id of problem photo
 * @param string $priority [low | medium | high | critical] priority of problem
 * @return json|array[false, int, string|null] entry details | false on failure
 */
function createProblem($conn, $inspectionId, $checklistId, $note, $fileId, $priority)
{
    $stmt = $conn->prepare(
        "INSERT INTO `problems`( `id_inspections`, `id_checklists`, `note`, `id_files`, `priority`) VALUES (?,?,?,?,?)",
    );

    $int_id_inspections = (int) $inspectionId;
    $int_id_checklists = (int) $checklistId;
    $int_id_files = (int) $fileId;

    $stmt->bind_param("iisis", $int_id_inspections, $int_id_checklists, $note, $int_id_files, $priority);

    if (!$stmt->execute()) {
        return [false, 400];
    }

    return json_encode(
        [
            "new_id" => $conn->insert_id,
            "id_inspections" => $inspectionId,
            "id_checklists" => $inspectionId,
            "note" => $note,
            "id_files" => $fileId,
            "priority" => $priority,
            "state" => "open",
        ],
        JSON_NUMERIC_CHECK,
    );
}

/**
 * PUT update problem
 * @param mysqli $conn connection to database
 * @param int $problemId id of problem to update
 * @param int $inspectionId new inspection id
 * @param int $checklistId new checklist id
 * @param string $note new note
 * @param int $fileId new file id
 * @param string $state [open | resolved] new state of problem
 * @param string $priority [low | medium | high | critical] new priority of problem
 * @return json|array[int, string|null] new entry details | array with error code on failure
 */
function updateWholeProblem($conn, $problemId, $inspectionId, $checklistId, $note, $fileId, $state, $priority)
{
    $int_id_problems = (int) $problemId;
    $int_id_inspections = (int) $inspectionId;
    $int_id_checklists = (int) $checklistId;
    $int_id_files = (int) $fileId;
    $stmt = $conn->prepare(
        "UPDATE `problems` SET `id_inspections`=?,`id_checklists`=?,`note`=?,`id_files`=?,`state`=?,`priority`=? WHERE id_problems = ?",
    );
    $stmt->bind_param(
        "iisissi",
        $int_id_inspections,
        $int_id_checklists,
        $note,
        $int_id_files,
        $state,
        $priority,
        $int_id_problems,
    );

    if (!$stmt->execute()) {
        return [false, 400];
    }
    $stmt->close();

    $stmt = $conn->prepare("SELECT * FROM `problems` WHERE `id_problems` = ?");
    $stmt->bind_param("i", $int_id_problems);

    if (!$stmt->execute()) {
        return [false, 400];
    }

    $return = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    return json_encode($return, JSON_NUMERIC_CHECK);
}

/**
 * PATCH update problem
 * @param mysqli $conn connection to database
 * @param string $table "problems" added for backward compatibility
 * @param int $problemId id of problem to update
 * @param string
 */
function update($conn, $table = "problems", $problemId, $data, $checkList)
{
    $table = $table ?? "problems";
    $int_id_problems = (int) $problemId;

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
    $values[] = $int_id_problems;
    $quary .= " WHERE `id_$table` = ?";

    $stmt = $conn->prepare($quary);
    $stmt->bind_param($types . "i", ...$values);

    if (!$stmt->execute()) {
        return [400];
    }
    $stmt->close();
    $stmt = $conn->prepare("SELECT * FROM `$table` WHERE `id_$table` = ?");
    $stmt->bind_param("i", $int_id_problems);

    if (!$stmt->execute()) {
        return [false, 400];
    }

    $return = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    return json_encode($return, JSON_NUMERIC_CHECK);
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

        if (isset($_GET["id_vehicles"]) && !is_null($_GET["id_vehicles"]) && $_GET["id_vehicles"] != "") {
            $return = getProblemsByVehicleId($conn, $_GET["id_vehicles"]);
            if (gettype($return) == "array") {
                heaDie($return[0], $return[1] ?? null);
            }
            heaDie(200, $return);
        }
        if (isset($_GET["priority"]) && !is_null($_GET["priority"]) && $_GET["priority"] != "") {
            $filterColumn[] = "priority";
            $filter[] = $_GET["priority"];
        }
        if (isset($_GET["state"]) && !is_null($_GET["state"]) && $_GET["state"] != "") {
            $filterColumn[] = "state";
            $filter[] = $_GET["state"];
        }
        if (isset($_GET["id_inspections"]) && !is_null($_GET["id_inspections"]) && $_GET["id_inspections"] != "") {
            $filterColumn[] = "id_inspections";
            $filter[] = $_GET["id_inspections"];
        }
        if (!isset($uri[1])) {
            $return = getFullTable($conn, null, $filterColumn, $filter, $order_by, $order_way, $offset, $limit);
        } else {
            $return = getEntryDetails($conn, null, $uri[1]);
        }
        if (gettype($return) == "array") {
            heaDie($return[0], $return[1] ?? null);
        }
        heaDie(200, $return);
    case "POST":
        $return = createProblem(
            $conn,
            $data["id_inspections"],
            $data["id_checklists"],
            $data["note"],
            $data["id_files"],
            $data["priority"],
        );
        if (gettype($return) == "array") {
            heaDie($return[0], $return[1] ?? null);
        }
        heaDie(201, $return);

    case "PUT":
        if (
            isset(
                $data["id_inspections"],
                $data["id_checklists"],
                $data["note"],
                $data["id_files"],
                $data["state"],
                $data["priority"],
                $uri[1],
            )
        ) {
            $return = updateWholeProblem(
                $conn,
                $uri[1],
                $data["id_inspections"],
                $data["id_checklists"],
                $data["note"],
                $data["id_files"],
                $data["state"],
                $data["priority"],
            );
            if (gettype($return) == "array") {
                heaDie($return[0], $return[1] ?? null);
            }
            heaDie(200, $return);
        } else {
            heaDie(400);
        }
    case "PATCH":
        if (isset($uri[1])) {
            $return = update($conn, null, $uri[1], $data, [
                "id_inspections",
                "id_checklists",
                "note",
                "id_files",
                "state",
                "priority",
            ]);

            if (gettype($return) == "array" && !$return[0]) {
                heaDie($return[1]);
            }
            heaDie(200, $return);
        } else {
            heaDie(400);
        }
    default:
        heaDie(405);
}
heaDie(405);
