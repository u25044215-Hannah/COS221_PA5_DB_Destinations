<?php
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/api.php";

header("Content-Type: application/json");

$destination = $_GET["destination"] ?? "";
$sort = $_GET["sort"] ?? "price_asc";

$orderBy = "p.pricePerPerson ASC";

if ($sort === "price_desc") {
    $orderBy = "p.pricePerPerson DESC";
} elseif ($sort === "rating_desc") {
    $orderBy = "avgRating DESC";
} elseif ($sort === "duration_asc") {
    $orderBy = "durationDays ASC";
}

$sql = "
    SELECT 
        p.packageID,
        p.title,
        p.description,
        p.destinationCity,
        p.destinationCountry,
        p.pricePerPerson,
        p.currency,
        p.startDate,
        p.endDate,
        DATEDIFF(p.endDate, p.startDate) AS durationDays,
        p.status,
        a.companyName AS agencyName,
        COALESCE(AVG(r.overallScore), 0) AS avgRating
    FROM Package p
    LEFT JOIN Agent a ON p.agentID = a.userID
    LEFT JOIN Review r ON p.packageID = r.packageID
    WHERE p.status = 'Active'
    AND (
        p.destinationCity LIKE ?
        OR p.destinationCountry LIKE ?
        OR p.title LIKE ?
    )
    GROUP BY p.packageID
    ORDER BY $orderBy
";

$search = "%" . $destination . "%";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "SQL prepare failed",
        "error" => $conn->error
    ]);
    exit;
}

$stmt->bind_param("sss", $search, $search, $search);
$stmt->execute();

$result = $stmt->get_result();
$packages = [];

while ($row = $result->fetch_assoc()) {
    $packages[] = $row;
}

echo json_encode([
    "success" => true,
    "data" => $packages
]);

$stmt->close();
$conn->close();
?>