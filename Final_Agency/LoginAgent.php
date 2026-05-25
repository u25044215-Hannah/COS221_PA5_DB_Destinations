<?php
// login.php — Tripistry Agency Authentication

if (session_status() === PHP_SESSION_NONE) session_start();

require_once __DIR__ . "/config.php";

header("Content-Type: application/json; charset=utf-8");

function respond($success, $data = null, $message = "", $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data"    => $data
    ], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
    exit();
}

function fail($message, $statusCode = 400) {
    respond(false, null, $message, $statusCode);
}

// Only accept POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    fail("Method not allowed.", 405);
}

// Parse JSON body
$raw   = file_get_contents("php://input");
$input = json_decode($raw, true);
if (!is_array($input)) $input = $_POST;

$email    = trim((string)($input["email"]    ?? ""));
$password = (string)($input["password"] ?? "");

if ($email === "" || $password === "") {
    fail("Email and password are required.");
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail("Invalid email format.");
}

// Look up the user
$stmt = $conn->prepare("
    SELECT u.userID, u.firstName, u.lastName, u.emailAddress,
           u.PasswordHash, u.userType, a.companyName
    FROM `User` u
    LEFT JOIN `Agent` a ON u.userID = a.userID
    WHERE u.emailAddress = ?
    LIMIT 1
");
if (!$stmt) fail("Database error.", 500);
$stmt->bind_param("s", $email);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();

// Validate credentials
if (!$user || !password_verify($password, $user["PasswordHash"])) {
    fail("Invalid email or password.", 401);
}

// Agency-only portal
if ($user["userType"] !== "Agent") {
    fail("This portal is for travel agencies only. Please use the traveller login.", 403);
}

// Regenerate session ID to prevent session fixation
session_regenerate_id(true);

// Store session
$_SESSION["userID"]      = $user["userID"];
$_SESSION["userType"]    = $user["userType"];
$_SESSION["firstName"]   = $user["firstName"];
$_SESSION["companyName"] = $user["companyName"] ?? "";

respond(true, [
    "userID"      => $user["userID"],
    "firstName"   => $user["firstName"],
    "lastName"    => $user["lastName"],
    "companyName" => $user["companyName"] ?? "",
], "Login successful.");