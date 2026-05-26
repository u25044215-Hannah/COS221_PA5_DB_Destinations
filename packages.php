<?php
// u25038967
// Shelby Bodenstein
// Tripistry - Package backend controller

//get connection
session_start();
require_once __DIR__ . "/config.php";
if (file_exists(__DIR__ . "/includes/auth_check.php")) {
    require_once __DIR__ . "/includes/auth_check.php";
}

//responses will be in JSON
header("Content-Type: application/json; charset=utf-8");

//GENERAL HELPERS

//sends basic response and stops the script
function respond($success, $data = null, $message = "", $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
    exit();
}

//shortcut for an error response
function fail($message, $statusCode = 400) {
    respond(false, null, $message, $statusCode);
}

//prepares sql safely and give a readable error
function safePrepare($conn, $sql) {
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        fail("SQL prepare failed: " . $conn->error, 500);
    }
    return $stmt;
}

//INPUT VALIDATION HELPERS
function getInput() {
    $raw = file_get_contents("php://input");
    $json = json_decode($raw, true);
    return is_array($json) ? $json : $_POST;
}

function getAction($input) {
    return $_GET["action"] ?? $input["action"] ?? "health";
}

//AUTH/SESSION HELPERS

//tries to find the logged-in agents ID from common session variable names
function getLoggedInAgentID() {
    if (function_exists("getCurrentAgentID")) return intval(getCurrentAgentID());
    if (isset($_SESSION["agentID"])) return intval($_SESSION["agentID"]);
    if (isset($_SESSION["agent_id"])) return intval($_SESSION["agent_id"]);
    if (isset($_SESSION["userID"])) return intval($_SESSION["userID"]);
    if (isset($_SESSION["user_id"])) return intval($_SESSION["user_id"]);
    return 0;
}

//makes sure only an agent or agenct can use this file
function requireAgentLogin() {
    if (function_exists("requireAgency")) {
        requireAgency();
        return;
    }

    $agentID = getLoggedInAgentID();
    if ($agentID <= 0) fail("Not logged in as an agent.", 401);

    $type = strtolower((string)($_SESSION["userType"] ?? $_SESSION["user_type"] ?? $_SESSION["role"] ?? "Agent"));
    if (!in_array($type, ["agent", "agency", "travel agency"])) {
        fail("Access denied. Agent account required.", 403);
    }
}

function requiredString($input, $key, $max = 255) {
    if (!isset($input[$key])) fail("Missing required field: " . $key);
    $value = trim((string)$input[$key]);
    if ($value === "") fail($key . " cannot be empty.");
    if (strlen($value) > $max) fail($key . " is too long. Max length is " . $max . ".");
    return $value;
}

function optionalString($input, $key, $default = null, $max = 255) {
    if (!isset($input[$key]) || trim((string)$input[$key]) === "") return $default;
    $value = trim((string)$input[$key]);
    if (strlen($value) > $max) fail($key . " is too long. Max length is " . $max . ".");
    return $value;
}

function requiredInt($input, $key, $min = null) {
    if (!isset($input[$key]) || !is_numeric($input[$key])) fail("Missing or invalid integer field: " . $key);
    $value = intval($input[$key]);
    if ($min !== null && $value < $min) fail($key . " must be at least " . $min . ".");
    return $value;
}

function requiredFloat($input, $key, $min = null) {
    if (!isset($input[$key]) || !is_numeric($input[$key])) fail("Missing or invalid number field: " . $key);
    $value = floatval($input[$key]);
    if ($min !== null && $value < $min) fail($key . " must be at least " . $min . ".");
    return $value;
}

function optionalDate($input, $key) {
    if (!isset($input[$key]) || trim((string)$input[$key]) === "") return null;
    $value = trim((string)$input[$key]);
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) fail($key . " must use YYYY-MM-DD format.");
    return $value;
}

function getIDFromRequest($input, $key = "packageID") {
    if (isset($_GET[$key])) return intval($_GET[$key]);
    if (isset($_GET["id"])) return intval($_GET["id"]);
    if (isset($input[$key])) return intval($input[$key]);
    if (isset($input["id"])) return intval($input["id"]);
    fail("Missing ID.");
}

//BONUS MARKS - SECURITY HELPERS
//creates or returns the current csrf token for this login session 
//the fontend sohuld first call ?action=get_csrf_token 
//then send the token bakc n POST/Put/delete request as either csrf_token
function getCsrfToken() {
    if (empty($_SESSION["csrf_token"])) {
        $_SESSION["csrf_token"] = bin2hex(random_bytes(32));
    }
    respond(true, ["csrf_token" => $_SESSION["csrf_token"]], "CSRF token generated.");
}

//protects state-changing requests from crosspsite request forgery
//read-only actions sych as list/get so not need a csrf token
function requireCsrfToken($input) {
    $submitted = $_SERVER["HTTP_X_CSRF_TOKEN"] ?? ($input["csrf_token"] ?? "");
    if (empty($_SESSION["csrf_token"]) || !hash_equals($_SESSION["csrf_token"], (string)$submitted)) {
        fail("Invalid or missing CSRF token.", 403);
    }
}

//keeps a db audit trail of inportant agenct actions
//this should also help with security by monitoring audit/error logs
function createAuditTableIfMissing($conn) {
    $sql = "
        CREATE TABLE IF NOT EXISTS agencyAuditLog (
            auditID INT AUTO_INCREMENT PRIMARY KEY,
            agentID INT NOT NULL,
            eventType VARCHAR(100) NOT NULL,
            entityType VARCHAR(100) NOT NULL,
            entityID INT NULL,
            details TEXT NULL,
            ipAddress VARCHAR(45) NULL,
            userAgent VARCHAR(255) NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_audit_agent (agentID),
            INDEX idx_audit_event (eventType)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ";
    $conn->query($sql);
}

function writeAuditLog($conn, $agentID, $eventType, $entityType, $entityID = null, $details = "") {
    createAuditTableIfMissing($conn);
    $stmt = safePrepare($conn, "
        INSERT INTO agencyAuditLog (agentID, eventType, entityType, entityID, details, ipAddress, userAgent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $ip = $_SERVER["REMOTE_ADDR"] ?? null;
    $ua = substr($_SERVER["HTTP_USER_AGENT"] ?? "unknown", 0, 255);
    $stmt->bind_param("ississs", $agentID, $eventType, $entityType, $entityID, $details, $ip, $ua);
    $stmt->execute();
}

//PACKAGES CRUD FUNCTIONS

//returns all packages that belong to the logged-in agent
function listPackages($conn, $agentID) {
    $stmt = safePrepare($conn, "
        SELECT packageID, agentID, title, description, pricePerPerson, currency,
               maxCapacity, startDate, endDate, destinationCity, destinationCountry, status
        FROM `Package`
        WHERE agentID = ?
        ORDER BY startDate ASC, packageID ASC
    ");
    $stmt->bind_param("i", $agentID);
    $stmt->execute();
    respond(true, $stmt->get_result()->fetch_all(MYSQLI_ASSOC), "Packages loaded.");
}

//returns one package if it belogngs to the logged in agent
function getPackageByID($conn, $agentID, $input) {
    $packageID = getIDFromRequest($input, "packageID");
    $stmt = safePrepare($conn, "
        SELECT packageID, agentID, title, description, pricePerPerson, currency,
               maxCapacity, startDate, endDate, destinationCity, destinationCountry, status
        FROM `Package`
        WHERE packageID = ? AND agentID = ?
    ");
    $stmt->bind_param("ii", $packageID, $agentID);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    if (!$row) fail("Package not found or does not belong to this agent.", 404);
    respond(true, $row, "Package loaded.");
}

//creating a new package for the new agent
function createPackage($conn, $agentID, $input) {
    $title = requiredString($input, "title");
    $description = optionalString($input, "description", null, 5000);
    $pricePerPerson = requiredFloat($input, "pricePerPerson", 0);
    $currency = optionalString($input, "currency", "USD", 10);
    $maxCapacity = requiredInt($input, "maxCapacity", 1);
    $startDate = optionalDate($input, "startDate");
    $endDate = optionalDate($input, "endDate");
    $destinationCity = optionalString($input, "destinationCity", null, 100);
    $destinationCountry = optionalString($input, "destinationCountry", null, 100);
    $status = optionalString($input, "status", "Active", 50);

    if ($startDate && $endDate && $endDate < $startDate) fail("endDate cannot be before startDate.");

    $stmt = safePrepare($conn, "
        INSERT INTO `Package`
        (agentID, title, description, pricePerPerson, currency, maxCapacity,
         startDate, endDate, destinationCity, destinationCountry, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param(
        "issdsisssss",
        $agentID, $title, $description, $pricePerPerson, $currency, $maxCapacity,
        $startDate, $endDate, $destinationCity, $destinationCountry, $status
    );
    $stmt->execute();
    $newID = $conn->insert_id;
    writeAuditLog($conn, $agentID, "create_package", "Package", $newID, "Created package: " . $title);
    respond(true, ["packageID" => $newID], "Package created.", 201);
}

//update a package byt only if it belongs to the logged-in agent
function updatePackage($conn, $agentID, $input) {
    $packageID = getIDFromRequest($input, "packageID");
    $title = requiredString($input, "title");
    $description = optionalString($input, "description", null, 5000);
    $pricePerPerson = requiredFloat($input, "pricePerPerson", 0);
    $currency = optionalString($input, "currency", "USD", 10);
    $maxCapacity = requiredInt($input, "maxCapacity", 1);
    $startDate = optionalDate($input, "startDate");
    $endDate = optionalDate($input, "endDate");
    $destinationCity = optionalString($input, "destinationCity", null, 100);
    $destinationCountry = optionalString($input, "destinationCountry", null, 100);
    $status = optionalString($input, "status", "Active", 50);

    if ($startDate && $endDate && $endDate < $startDate) fail("endDate cannot be before startDate.");

    $stmt = safePrepare($conn, "
        UPDATE `Package`
        SET title = ?, description = ?, pricePerPerson = ?, currency = ?, maxCapacity = ?,
            startDate = ?, endDate = ?, destinationCity = ?, destinationCountry = ?, status = ?
        WHERE packageID = ? AND agentID = ?
    ");
    $stmt->bind_param(
        "ssdissssssii",
        $title, $description, $pricePerPerson, $currency, $maxCapacity,
        $startDate, $endDate, $destinationCity, $destinationCountry, $status,
        $packageID, $agentID
    );
    $stmt->execute();
    if ($stmt->affected_rows < 1) fail("Package not updated. It may not exist, belong to another agent, or values were unchanged.", 404);
    writeAuditLog($conn, $agentID, "update_package", "Package", $packageID, "Updated package: " . $title);
    respond(true, ["packageID" => $packageID], "Package updated.");
}

//makes the package inactive instead of completely deleting it
//protects the related bookings/reviews from breaking
function deletePackage($conn, $agentID, $input) {
    $packageID = getIDFromRequest($input, "packageID");
    $stmt = safePrepare($conn, "UPDATE `Package` SET status = 'Inactive' WHERE packageID = ? AND agentID = ?");
    $stmt->bind_param("ii", $packageID, $agentID);
    $stmt->execute();
    if ($stmt->affected_rows < 1) fail("Package not found, already inactive, or does not belong to this agent.", 404);
    writeAuditLog($conn, $agentID, "delete_package", "Package", $packageID, "Soft deleted package by setting status to Inactive.");
    respond(true, ["packageID" => $packageID], "Package marked inactive.");
}

//PACKAGE COMPONENT FUNCTIONS

//lists the components currently attached to one package
function listPackageComponents($conn, $agentID, $input) {
    $packageID = getIDFromRequest($input, "packageID");
    $stmt = safePrepare($conn, "
        SELECT pc.componentID, pc.packageID, pc.componentType, pc.name, pc.city, pc.country, pc.description
        FROM `PackageComponent` pc
        JOIN `Package` p ON pc.packageID = p.packageID
        WHERE pc.packageID = ? AND p.agentID = ?
        ORDER BY pc.componentType, pc.name
    ");
    $stmt->bind_param("ii", $packageID, $agentID);
    $stmt->execute();
    respond(true, $stmt->get_result()->fetch_all(MYSQLI_ASSOC), "Package components loaded.");
}

$input = getInput();
$action = getAction($input);

if ($action === "health") {
    respond(true, ["available_actions" => [
        "get_csrf_token", "list_packages", "get_package", "create_package",
        "update_package", "delete_package", "list_package_components"
    ]], "Packages backend is running.");
}

if ($action === "get_csrf_token") getCsrfToken();

//ROUTER 

requireAgentLogin();
$agentID = getLoggedInAgentID();

if (in_array($action, ["create_package", "update_package", "delete_package"])) {
    requireCsrfToken($input);
}

switch ($action) {
    case "list_packages": listPackages($conn, $agentID); break;
    case "get_package": getPackageByID($conn, $agentID, $input); break;
    case "create_package": createPackage($conn, $agentID, $input); break;
    case "update_package": updatePackage($conn, $agentID, $input); break;
    case "delete_package": deletePackage($conn, $agentID, $input); break;
    case "list_package_components": listPackageComponents($conn, $agentID, $input); break;
    default: fail("Unknown action: " . $action, 404);
}
