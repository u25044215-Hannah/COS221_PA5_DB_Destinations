<?php
//coded by Michael Harding
require_once __DIR__ . "/config.php";
header("Content-Type: application/json");

$userID = intval($_GET["userID"] ?? 0);

if ($userID <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid user ID"
    ]);
    exit;
}

$sql = "
    SELECT 
        b.bookingID,
        b.numGuests,
        b.totalPrice,
        b.status,
        b.bookedAt,
        p.packageID,
        p.title,
        p.destinationCity,
        p.destinationCountry,
        p.startDate,
        p.endDate,
        DATEDIFF(p.endDate, p.startDate) AS durationDays,
        COALESCE(a.companyName, 'Tripistry Agency') AS agencyName
    FROM Booking b
    JOIN Package p ON b.packageID = p.packageID
    LEFT JOIN Agent a ON b.agentID = a.userID
    WHERE b.userID = ?
    ORDER BY b.bookedAt DESC
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $userID);
$stmt->execute();

echo json_encode([
    "success" => true,
    "data" => $stmt->get_result()->fetch_all(MYSQLI_ASSOC)
]);
?>
