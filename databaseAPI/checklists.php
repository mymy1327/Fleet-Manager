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
 * exit this script
 * @param int $code response code
 * @param any $response response to be returned
 */
function heaDie($code, $response)
{
    http_response_code($code);
    die($response);
}

/**
 * returns all checklist items
 * @param mysqli $conn connection to database
 * @return json|false list of checklist items | false on failure
 */
function getAllChecklistItems($conn)
{
    $result = $conn->query("SELECT * FROM `checklists`");
    if (!$result) {
        return false;
    }
    return json_encode($result->fetch_all(MYSQLI_ASSOC), JSON_NUMERIC_CHECK);
}

/**
 * return checklist item details
 * @param mysqli $conn connection to database
 * @param int $id checklist id
 * @return json|false checklist item details | false on failure
 */
function getChecklistItemDetail($conn, $id)
{
    $stmt = $conn->prepare("SELECT * FROM `checklists` WHERE id_checklists = ?");
    $checklistId = (int) $id;
    $stmt->bind_param("i", $checklistId);
    if (!$stmt->execute()) {
        return false;
    }
    return json_encode($stmt->get_result()->fetch_assoc());
}

/**
 * create new checklist item
 * @param mysqli $conn connection to database
 * @param string $name name of checklist item
 * @param string $description description of checklist item
 * @return int|string|false id of checklist item | false on failure
 */
function createNewChecklistItem($conn, $name, $description)
{
    $stmt = $conn->prepare("INSERT INTO `checklists`(`name`, `description`) VALUES (?, ?)");
    $stmt->bind_param("ss", $name, $description);
    if (!$stmt->execute()) {
        return false;
    }
    $lastid = $conn->insert_id;
    return $lastid;
}

/**
 * rewrites checklist item
 * @param mysqli $conn connection to database
 * @param int $id checklist id
 * @param string $name name of checklist item
 * @param string $description description of checklist item
 * @return json|false old checklist item detail | false on failure
 */
function rewriteChecklistItem($conn, $id, $name, $description) {
    $stmt = $conn->prepare("SELECT * FROM `checklists` WHERE id_checklists = ?");
    $checklistId = (int) $id;
    $stmt->bind_param("i", $checklistId);
    if (!$stmt->execute()) {
        return false;
    }
    $result = json_encode($stmt->get_result()->fetch_assoc());
    $stmt->close();
    $stmt = $conn->prepare("UPDATE `checklists` SET `name`='?',`description`='?' WHERE id_checklists = ?");
    $stmt->bind_param("ssi", $name, $description, $checklistId);
    if (!$stmt->execute()) {
        return false;
    }
    return $result;
}

//echo $_SERVER["REQUEST_METHOD"];
switch ($_SERVER["REQUEST_METHOD"]) {
    case "GET":
        if (!isset($_GET["id_checklist"])) {
            $return = getAllChecklistItems($conn);
            if (!$return) {
                heaDie(404);
            }
            heaDie(200, $return);
        } else {
            $return = getChecklistItemDetail($conn, $_GET["id_checklist"]);
            if (!$return) {
                heaDie(404);
            }
            heaDie(200, $return);
        }
    case "POST":
        if (isset($data["name"])) {
            //echo $data["name"], $data["description"];
            $return = createNewChecklistItem($conn, $data["name"], $data["description"]);
            if (!$return) {
                heaDie(400);
            }
            heaDie(
                201,
                json_encode([
                    "id_checklist" => $return,
                    "name" => $data["name"],
                    "description" => $data["description"],
                ]),
            );
        } else {
            heaDie(400);
        }
    case "PUT":
        if (isset($data["id_checklists"], $data["name"], $data["description"])) {
            $return = rewriteChecklistItem($conn, $data["id_checklists"], $data["name"], $data["description"]);
            if (!$return) {
                heaDie(400);
            }
            heaDie(200, $return);
        } else {
            heaDie(400);
        }
    default:
        http_response_code(405);
        die();
}
http_response_code(404);
