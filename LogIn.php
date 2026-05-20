<?php
// LogIn.php
// This file logs a user in by checking their email and password.

session_start();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

// Browser sometimes sends an OPTIONS request before POST.
// We stop here so the real POST can continue after.
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit();
}

// Connect to database.
require_once "config.php";

// Get JSON input sent from auth.js.
$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    echo json_encode([
        "success" => false,
        "message" => "No input received"
    ]);
    exit();
}

// Get email and password from request.
$email = trim($input["email"] ?? "");
$password = trim($input["password"] ?? "");

// Validate email.
if ($email === "") {
    echo json_encode([
        "success" => false,
        "message" => "Email is required"
    ]);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid email format"
    ]);
    exit();
}

// Validate password.
if ($password === "") {
    echo json_encode([
        "success" => false,
        "message" => "Password is required"
    ]);
    exit();
}

// Find the user with this email address.
$stmt = $conn->prepare("
    SELECT userID, firstName, lastName, emailAddress, PasswordHash, userType
    FROM `User`
    WHERE emailAddress = ?
");

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Prepare failed: " . $conn->error
    ]);
    exit();
}

// Bind email safely to prevent SQL injection.
$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

// If no user was found, login fails.
if ($result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password"
    ]);
    exit();
}

$user = $result->fetch_assoc();

// Check typed password against the hashed password in the database.
if (!password_verify($password, $user["PasswordHash"])) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password"
    ]);
    exit();
}

// Save user details in PHP session.
$_SESSION["userID"] = $user["userID"];
$_SESSION["emailAddress"] = $user["emailAddress"];
$_SESSION["userType"] = $user["userType"];
$_SESSION["firstName"] = $user["firstName"];

// Return logged-in user details to frontend.
echo json_encode([
    "success" => true,
    "message" => "Login successful",
    "user" => [
        "userID" => $user["userID"],
        "firstName" => $user["firstName"],
        "lastName" => $user["lastName"],
        "emailAddress" => $user["emailAddress"],
        "userType" => $user["userType"]
    ]
]);

$stmt->close();
$conn->close();
?>