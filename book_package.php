<?php
//Michael Harding
require_once __DIR__ . "/config.php";
header("Content-Type: application/json");

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    $input = $_POST;
}

$userID = intval($input["userID"] ?? 0);
$packageID = intval($input["packageID"] ?? 0);
$numGuests = intval($input["numGuests"] ?? 1);

if ($userID <= 0 || $packageID <= 0 || $numGuests <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid booking data"
    ]);
    exit;
}

$stmt = $conn->prepare("
    SELECT agentID, pricePerPerson, maxCapacity
    FROM Package
    WHERE packageID = ? AND status = 'Active'
");

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

$agentID = intval($package["agentID"]);
$totalPrice = floatval($package["pricePerPerson"]) * $numGuests;

$stmt = $conn->prepare("
    INSERT INTO Booking 
    (userID, agentID, packageID, numGuests, totalPrice, status)
    VALUES (?, ?, ?, ?, ?, 'Confirmed')
");

$stmt->bind_param(
    "iiiid",
    $userID,
    $agentID,
    $packageID,
    $numGuests,
    $totalPrice
);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Package booked successfully",
        "bookingID" => $stmt->insert_id
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Booking failed: " . $stmt->error
    ]);
}
?>
