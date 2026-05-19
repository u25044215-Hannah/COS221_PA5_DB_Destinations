<?php
// login.php

session_start();

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

$email = trim($input["email"] ?? "");
$password = trim($input["password"] ?? "");

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

// ----------------------------
// Find user by email
// ----------------------------

$stmt = $conn->prepare("
    SELECT UserID, Name, Surname, Email, Password, UserType
    FROM Users
    WHERE Email = ?
");

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Prepare failed: " . $conn->error
    ]);
    exit();
}

$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password"
    ]);
    exit();
}

$user = $result->fetch_assoc();

// ----------------------------
// Raw password check
// ----------------------------
// This compares the typed password directly to the stored database password.

if ($password !== $user["Password"]) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password"
    ]);
    exit();
}

// ----------------------------
// Store login details in session
// ----------------------------

$_SESSION["userID"] = $user["UserID"];
$_SESSION["email"] = $user["Email"];
$_SESSION["userType"] = $user["UserType"];
$_SESSION["name"] = $user["Name"];

echo json_encode([
    "success" => true,
    "message" => "Login successful",
    "user" => [
        "userID" => $user["UserID"],
        "name" => $user["Name"],
        "surname" => $user["Surname"],
        "email" => $user["Email"],
        "userType" => $user["UserType"]
    ]
]);

$stmt->close();
$conn->close();
?>
