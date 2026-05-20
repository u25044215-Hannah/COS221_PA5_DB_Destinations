<?php
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/api.php";

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
        a.companyName AS agencyName,
        COALESCE(AVG(r.overallScore), 0) AS avgRating
    FROM Package p
    LEFT JOIN Agent a ON p.agentID = a.userID
    LEFT JOIN Review r ON p.packageID = r.packageID
    WHERE p.packageID = ?
    GROUP BY p.packageID
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

$componentSql = "
    SELECT *
    FROM PackageComponent
    WHERE packageID = ?
";

$stmt = $conn->prepare($componentSql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Component SQL prepare failed: " . $conn->error
    ]);
    exit;
}

$stmt->bind_param("i", $packageID);
$stmt->execute();
$components = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

$reviewSql = "
    SELECT 
        r.reviewID,
        r.comment,
        r.overallScore,
        r.cleanlinessScore,
        r.serviceScore,
        r.reviewDate,
        u.name AS travellerName
    FROM Review r
    LEFT JOIN User u ON r.userID = u.userID
    WHERE r.packageID = ?
    ORDER BY r.reviewDate DESC
";

$stmt = $conn->prepare($reviewSql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Review SQL prepare failed: " . $conn->error
    ]);
    exit;
}

$stmt->bind_param("i", $packageID);
$stmt->execute();
$reviews = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

echo json_encode([
    "success" => true,
    "package" => $package,
    "components" => $components,
    "reviews" => $reviews
]);

$stmt->close();
$conn->close();
?>