<?php
// login.php
//Hannah Diedrick
session_start();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit();
}

require_once "config.php";

// Get JSON input from JavaScript fetch()
$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    echo json_encode([
        "success" => false,
        "message" => "No input received"
    ]);
    exit();
}

// Get values from request
$email = trim($input["email"] ?? "");
$password = trim($input["password"] ?? "");

// Basic validation
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

/*
|--------------------------------------------------------------------------
| THIS IS WHERE YOU ADD THE QUERY CODE
|--------------------------------------------------------------------------
| This searches the User table for the email address that was typed in.
*/
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

$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

/*
|--------------------------------------------------------------------------
| CHECK IF EMAIL EXISTS
|--------------------------------------------------------------------------
*/
if ($result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password"
    ]);
    exit();
}

$user = $result->fetch_assoc();

/*
|--------------------------------------------------------------------------
| THIS IS WHERE YOU ADD THE PASSWORD_VERIFY CODE
|--------------------------------------------------------------------------
| This checks the raw password typed by the user against the hashed password
| stored in the PasswordHash column.
*/
if (!password_verify($password, $user["PasswordHash"])) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password"
    ]);
    exit();
}

/*
|--------------------------------------------------------------------------
| LOGIN SUCCESSFUL
|--------------------------------------------------------------------------
| If the code reaches this point, the email exists and the password is correct.
*/
$_SESSION["userID"] = $user["userID"];
$_SESSION["emailAddress"] = $user["emailAddress"];
$_SESSION["userType"] = $user["userType"];
$_SESSION["firstName"] = $user["firstName"];

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
