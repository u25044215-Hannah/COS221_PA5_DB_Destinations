<?php
session_start();

header("Content-Type: application/json");

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

if ($email === "" || $password === "") {
    echo json_encode([
        "success" => false,
        "message" => "Email and password are required"
    ]);
    exit();
}

$stmt = $conn->prepare("
    SELECT userID, firstName, lastName, emailAddress, PasswordHash, userType
    FROM `User`
    WHERE emailAddress = ?
");

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

if (!password_verify($password, $user["PasswordHash"])) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password"
    ]);
    exit();
}

$_SESSION["userID"] = $user["userID"];
$_SESSION["emailAddress"] = $user["emailAddress"];
$_SESSION["userType"] = $user["userType"];
$_SESSION["firstName"] = $user["firstName"];

echo json_encode([
    "success" => true,
    "message" => "Login successful",
    "data" => [
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
