<?php
// api.php

session_start();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit();
}

require_once "config.php";

$input = json_decode(file_get_contents("php://input"), true);

$type = "";

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    $type = $_GET["type"] ?? "";
} else {
    $type = $input["type"] ?? "";
}

switch ($type) {
    case "getUsers":
        getUsers($conn);
        break;

    case "getUserByID":
        $userID = $_GET["userID"] ?? ($input["userID"] ?? null);
        getUserByID($conn, $userID);
        break;

    default:
        echo json_encode([
            "success" => false,
            "message" => "Invalid or missing API request type"
        ]);
        break;
}

// ----------------------------
// Function: Get all users
// ----------------------------

function getUsers($conn) {
    $sql = "
        SELECT UserID, Name, Surname, Email, UserType, CreatedAt
        FROM Users
        ORDER BY UserID ASC
    ";

    $result = $conn->query($sql);

    if (!$result) {
        echo json_encode([
            "success" => false,
            "message" => "Query failed: " . $conn->error
        ]);
        return;
    }

    $users = [];

    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }

    echo json_encode([
        "success" => true,
        "data" => $users
    ]);
}

// ----------------------------
// Function: Get one user by ID
// ----------------------------

function getUserByID($conn, $userID) {
    if ($userID === null || !is_numeric($userID)) {
        echo json_encode([
            "success" => false,
            "message" => "Valid userID is required"
        ]);
        return;
    }

    $stmt = $conn->prepare("
        SELECT UserID, Name, Surname, Email, UserType, CreatedAt
        FROM Users
        WHERE UserID = ?
    ");

    if (!$stmt) {
        echo json_encode([
            "success" => false,
            "message" => "Prepare failed: " . $conn->error
        ]);
        return;
    }

    $userID = intval($userID);

    $stmt->bind_param("i", $userID);
    $stmt->execute();

    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "User not found"
        ]);
        return;
    }

    $user = $result->fetch_assoc();

    echo json_encode([
        "success" => true,
        "data" => $user
    ]);

    $stmt->close();
}

$conn->close();
?>