<?php
// SignUp.php
// This file creates a new user account.

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

// Handle browser preflight request.
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit();
}

// Connect to database.
require_once "config.php";

// Read JSON sent from auth.js.
$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    echo json_encode([
        "success" => false,
        "message" => "No input received"
    ]);
    exit();
}

// Get values from request.
$name = trim($input["name"] ?? "");
$surname = trim($input["surname"] ?? "");
$email = trim($input["email"] ?? "");
$password = trim($input["password"] ?? "");
$userType = trim($input["userType"] ?? "");


// ----------------------------
// VALIDATION
// ----------------------------

if ($name === "") {
    echo json_encode([
        "success" => false,
        "message" => "Name is required"
    ]);
    exit();
}

if ($surname === "") {
    echo json_encode([
        "success" => false,
        "message" => "Surname is required"
    ]);
    exit();
}

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

if ($password === "") {
    echo json_encode([
        "success" => false,
        "message" => "Password is required"
    ]);
    exit();
}

if (strlen($password) < 4) {
    echo json_encode([
        "success" => false,
        "message" => "Password must be at least 4 characters long"
    ]);
    exit();
}

if ($userType === "") {
    echo json_encode([
        "success" => false,
        "message" => "User type is required"
    ]);
    exit();
}

// Only allow known user types.
$allowedUserTypes = ["Traveller", "Agency"];

if (!in_array($userType, $allowedUserTypes)) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid user type. Must be Traveller or Agency"
    ]);
    exit();
}


// ----------------------------
// CHECK IF EMAIL ALREADY EXISTS
// ----------------------------

$checkStmt = $conn->prepare("SELECT UserID FROM Users WHERE Email = ?");

if (!$checkStmt) {
    echo json_encode([
        "success" => false,
        "message" => "Prepare failed: " . $conn->error
    ]);
    exit();
}

// Bind email safely to prevent SQL injection.
$checkStmt->bind_param("s", $email);
$checkStmt->execute();

$checkResult = $checkStmt->get_result();

// Stop if email is already registered.
if ($checkResult->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "Email address is already registered"
    ]);
    exit();
}

$checkStmt->close();


// ----------------------------
// INSERT NEW USER
// ----------------------------

// NOTE: This version stores the password as plain text because that is what this file currently does.
// For safer code, use password_hash($password, PASSWORD_DEFAULT).

$insertStmt = $conn->prepare("
    INSERT INTO Users (Name, Surname, Email, Password, UserType, CreatedAt)
    VALUES (?, ?, ?, ?, ?, NOW())
");

if (!$insertStmt) {
    echo json_encode([
        "success" => false,
        "message" => "Prepare failed: " . $conn->error
    ]);
    exit();
}

// Bind user details safely.
$insertStmt->bind_param("sssss", $name, $surname, $email, $password, $userType);

// Run insert query.
if ($insertStmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "User registered successfully",
        "user" => [
            "userID" => $insertStmt->insert_id,
            "name" => $name,
            "surname" => $surname,
            "email" => $email,
            "userType" => $userType
        ]
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Signup failed: " . $insertStmt->error
    ]);
}

$insertStmt->close();
$conn->close();
?>