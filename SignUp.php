<?php
//Michael Harding

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit();
}

require_once "config.php";

$input = json_decode(file_get_contents("php://input"), true);

$firstName = trim($input["name"] ?? "");
$lastName = trim($input["surname"] ?? "");
$email = trim($input["email"] ?? "");
$password = $input["password"] ?? "";
$userType = trim($input["userType"] ?? "Traveller");

if ($firstName === "" || $lastName === "" || $email === "" || $password === "") {
    echo json_encode(["success" => false, "message" => "Please fill in all fields"]);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "message" => "Invalid email address"]);
    exit();
}

if ($userType !== "Traveller" && $userType !== "Agent") {
    echo json_encode(["success" => false, "message" => "Invalid user type"]);
    exit();
}

$checkStmt = $conn->prepare("SELECT userID FROM `User` WHERE emailAddress = ?");
$checkStmt->bind_param("s", $email);
$checkStmt->execute();
$result = $checkStmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Email already exists"]);
    exit();
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

$insertStmt = $conn->prepare("
    INSERT INTO `User`
    (firstName, lastName, emailAddress, userType, PasswordHash)
    VALUES (?, ?, ?, ?, ?)
");

$insertStmt->bind_param("sssss", $firstName, $lastName, $email, $userType, $passwordHash);

if ($insertStmt->execute()) {
    $userID = $insertStmt->insert_id;

    if ($userType === "Traveller") {
        $roleStmt = $conn->prepare("INSERT INTO `Traveller` (userID, loyaltyTier, totalTrips) VALUES (?, 'Bronze', 0)");
    } else {
        $roleStmt = $conn->prepare("INSERT INTO `Agent` (userID, companyName, commissionRate, agentTier) VALUES (?, '', 0.00, 'Standard')");
    }

    $roleStmt->bind_param("i", $userID);
    $roleStmt->execute();

    echo json_encode([
        "success" => true,
        "message" => "Signup successful",
        "user" => [
            "userID" => $userID,
            "firstName" => $firstName,
            "lastName" => $lastName,
            "emailAddress" => $email,
            "userType" => $userType
        ]
    ]);
} else {
    echo json_encode(["success" => false, "message" => $insertStmt->error]);
}

$conn->close();
?>
