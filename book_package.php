<?php
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/api.php";

header("Content-Type: application/json");

$userID = intval($_POST["userID"] ?? 0);
$packageID = intval($_POST["packageID"] ?? 0);
$numGuests = intval($_POST["numGuests"] ?? 1);

if ($userID <= 0 || $packageID <= 0 || $numGuests <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid booking data"
    ]);
    exit;
}

$sql = "
    SELECT pricePerPerson, agentID
    FROM Package
    WHERE packageID = ?
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "SQL prepare failed: " . $conn->error
    ]);
    exit;
}

$stmt->bind_param("i", $packageID);
$stmt->execute();

$package = $stmt->get_result()->fetch_assoc();

if (!$package) {
    echo json_encode([
        "success" => false,
        "message" => "Package not found"
    ]);
    exit;
}

$totalPrice = $package["pricePerPerson"] * $numGuests;
$agentID = $package["agentID"];

$insertSql = "
    INSERT INTO Booking
    (userID, agentID, packageID, numGuests, totalPrice, status)
    VALUES (?, ?, ?, ?, ?, 'Confirmed')
";

$stmt = $conn->prepare($insertSql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "SQL prepare failed: " . $conn->error
    ]);
    exit;
}

$stmt->bind_param(
    "iiiid",
    $userID,
    $agentID,
    $packageID,
    $numGuests,
    $totalPrice
);

$success = $stmt->execute();

if ($success) {
    echo json_encode([
        "success" => true,
        "message" => "Booking created successfully"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Booking failed: " . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>