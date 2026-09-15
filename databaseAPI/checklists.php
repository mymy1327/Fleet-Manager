<?php
/**
 * GET - returns all checklist items
 * @return json list of checklist items
 *
 *
 * GET - return checklist item details
 * @param int $_GET["checklist"] checklist id
 * @return json checklist item details
 *
 *
 * @var mysqli $conn
 */

session_start();
require "../assets/config.php";

$data = json_decode(file_get_contents("php://input"), true);

/**
 * returns all checklist items
 * @param mysqli $conn connection to database
 * @return json|array[false, int, string|null] list of checklist items | false on failure
 */
function getAllChecklistItems($conn)
{
    $result = $conn->query("SELECT * FROM `checklists`");
    if (!$result) {
        return [false, 404];
    }
    return json_encode($result->fetch_all(MYSQLI_ASSOC), JSON_NUMERIC_CHECK);
}

/**
 * return checklist item details
 * @param mysqli $conn connection to database
 * @param int $id checklist id
 * @return json|array[false, int, string|null] checklist item details | false on failure
 */
function getChecklistItemDetail($conn, $id)
{
    $stmt = $conn->prepare("SELECT * FROM `checklists` WHERE id_checklists = ?");
    $checklistId = (int) $id;
    $stmt->bind_param("i", $checklistId);
    if (!$stmt->execute()) {
        return [false, 404];
    }
    return json_encode($stmt->get_result()->fetch_assoc());
}

/**
 * create new checklist item
 * @param mysqli $conn connection to database
 * @param string $name name of checklist item
 * @param string $description description of checklist item
 * @return int|array[false, int, string|null] id of checklist item | false on failure
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

//echo $_SERVER["REQUEST_METHOD"];
switch ($_SERVER["REQUEST_METHOD"]) {
    case "GET":
        if (!isset($_GET["id_checklist"])) {
            $return = getAllChecklistItems($conn);
            if (gettype($return) == "array" && !$return[0]) {
                heaDie($return[1]);
            }
            heaDie(200, $return);
        } else {
            $return = getChecklistItemDetail($conn, $_GET["id_checklist"]);
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
http_response_code(404);
