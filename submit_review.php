<?php
require_once "config.php";

header("Content-Type: application/json");

$userID = intval($_POST["userID"] ?? 0);
$packageID = intval($_POST["packageID"] ?? 0);
$comment = trim($_POST["comment"] ?? "");
$overallScore = intval($_POST["overallScore"] ?? 0);
$cleanlinessScore = intval($_POST["cleanlinessScore"] ?? 0);
$serviceScore = intval($_POST["serviceScore"] ?? 0);

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

$success = $stmt->execute();

if ($success) {
    echo json_encode([
        "success" => true,
        "message" => "Review submitted successfully"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Review could not be submitted"
    ]);
}

$stmt->close();
$conn->close();
?>
