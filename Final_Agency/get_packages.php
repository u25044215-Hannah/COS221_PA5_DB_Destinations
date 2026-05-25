<?php
require_once __DIR__ . "/config.php";
header("Content-Type: application/json");

$destination = trim($_GET["destination"] ?? "");
$sort = $_GET["sort"] ?? "rating_desc";
$maxPrice = isset($_GET["maxPrice"]) ? floatval($_GET["maxPrice"]) : 0;
$minRating = isset($_GET["minRating"]) ? floatval($_GET["minRating"]) : 0;

$searchTerm = "%" . $destination . "%";

$orderBy = "avgRating DESC";

if ($sort === "price_asc") {
    $orderBy = "p.pricePerPerson ASC";
} elseif ($sort === "price_desc") {
    $orderBy = "p.pricePerPerson DESC";
} elseif ($sort === "duration_asc") {
    $orderBy = "durationDays ASC";
} elseif ($sort === "newest") {
    $orderBy = "p.startDate DESC";
}

$sql = "
    SELECT 
        p.packageID,
        p.agentID,
        p.title,
        p.description,
        p.destinationCity,
        p.destinationCountry,
        p.pricePerPerson,
        p.currency,
        p.startDate,
        p.endDate,
        DATEDIFF(p.endDate, p.startDate) AS durationDays,
        p.maxCapacity,
        p.status,
        COALESCE(a.companyName, 'Tripistry Agency') AS agencyName,
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
    HAVING (? = 0 OR p.pricePerPerson <= ?)
       AND (? = 0 OR avgRating >= ?)
    ORDER BY $orderBy
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "SQL prepare failed",
        "error" => $conn->error
    ]);
    exit;
}

$stmt->bind_param(
    "sssdddd",
    $searchTerm,
    $searchTerm,
    $searchTerm,
    $maxPrice,
    $maxPrice,
    $minRating,
    $minRating
);

$stmt->execute();

$result = $stmt->get_result();

echo json_encode([
    "success" => true,
    "data" => $result->fetch_all(MYSQLI_ASSOC)
]);
?>