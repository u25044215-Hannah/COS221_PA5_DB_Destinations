<?php
require_once __DIR__ . "/config.php";
header("Content-Type: application/json");

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    $input = $_POST;
}

$userID = intval($input["userID"] ?? 0);
$packageID = intval($input["packageID"] ?? 0);
$comment = trim($input["comment"] ?? "");
$overallScore = intval($input["overallScore"] ?? 0);
$cleanlinessScore = intval($input["cleanlinessScore"] ?? 0);
$serviceScore = intval($input["serviceScore"] ?? 0);

if ($userID <= 0 || $packageID <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid user or package"
    ]);
    exit;
}

if ($overallScore < 1 || $overallScore > 5) {
    echo json_encode([
        "success" => false,
        "message" => "Overall rating must be between 1 and 5"
    ]);
    exit;
}

$sql = "
    INSERT INTO Review
    (userID, packageID, comment, overallScore, cleanlinessScore, serviceScore)
    VALUES (?, ?, ?, ?, ?, ?)
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "iisiii",
    $userID,
    $packageID,
    $comment,
    $overallScore,
    $cleanlinessScore,
    $serviceScore
);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Review submitted successfully"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Review could not be submitted: " . $stmt->error
    ]);
}
?>