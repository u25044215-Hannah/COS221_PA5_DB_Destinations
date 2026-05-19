<?php
// signup.php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit();
}

require_once "config.php";

$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    echo json_encode([
        "success" => false,
        "message" => "No input received"
    ]);
    exit();
}

$name = trim($input["name"] ?? "");
$surname = trim($input["surname"] ?? "");
$email = trim($input["email"] ?? "");
$password = trim($input["password"] ?? "");
$userType = trim($input["userType"] ?? "");

// ----------------------------
// Validation
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

$allowedUserTypes = ["Traveller", "Agency"];

if (!in_array($userType, $allowedUserTypes)) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid user type. Must be Traveller or Agency"
    ]);
    exit();
}

// ----------------------------
// Check if email already exists
// ----------------------------

$checkStmt = $conn->prepare("SELECT UserID FROM Users WHERE Email = ?");

if (!$checkStmt) {
    echo json_encode([
        "success" => false,
        "message" => "Prepare failed: " . $conn->error
    ]);
    exit();
}

$checkStmt->bind_param("s", $email);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "Email address is already registered"
    ]);
    exit();
}

$checkStmt->close();

// ----------------------------
// Insert new user
// ----------------------------
// NOTE: Password is stored raw/unhashed because you requested this.
// For a real system, use password_hash().

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

$insertStmt->bind_param("sssss", $name, $surname, $email, $password, $userType);

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
