<?php
require_once __DIR__ . "/config.php";
header("Content-Type: application/json");

$packageID = intval($_GET["packageID"] ?? 0);

if ($packageID <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid package ID"
    ]);
    exit;
}

$sql = "
    SELECT 
        p.*,
        DATEDIFF(p.endDate, p.startDate) AS durationDays,
        COALESCE(a.companyName, 'Tripistry Agency') AS agencyName,
        COALESCE(AVG(r.overallScore), 0) AS avgRating
    FROM Package p
    LEFT JOIN Agent a ON p.agentID = a.userID
    LEFT JOIN Review r ON p.packageID = r.packageID
    WHERE p.packageID = ?
    GROUP BY p.packageID
";

$stmt = $conn->prepare($sql);
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

$stmt = $conn->prepare("
    SELECT *
    FROM PackageComponent
    WHERE packageID = ?
    ORDER BY componentType, componentID
");

$stmt->bind_param("i", $packageID);
$stmt->execute();

$components = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

$stmt = $conn->prepare("
    SELECT 
        r.reviewID,
        r.comment,
        r.overallScore,
        r.cleanlinessScore,
        r.serviceScore,
        CONCAT(u.firstName, ' ', u.lastName) AS travellerName
    FROM Review r
    LEFT JOIN User u ON r.userID = u.userID
    WHERE r.packageID = ?
    ORDER BY r.reviewID DESC
");

$stmt->bind_param("i", $packageID);
$stmt->execute();

$reviews = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

echo json_encode([
    "success" => true,
    "package" => $package,
    "components" => $components,
    "reviews" => $reviews
]);
?>