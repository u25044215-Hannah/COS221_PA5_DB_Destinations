<?php
session_start();

require_once __DIR__ . "/config.php";

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit();
}

if (!isset($conn) && isset($mysqli)) {
    $conn = $mysqli;
}

if (!isset($conn)) {
    echo json_encode([
        "success" => false,
        "message" => "Database connection variable not found. Expected \$conn."
    ]);
    exit();
}

function jsonResponse($success, $message, $data = null) {
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);
    exit();
}

function getPackages($conn) {
    $sql = "
    SELECT
        p.packageID AS packageID,
        p.title AS title,
        p.title AS packageName,
        p.description AS description,
        p.pricePerPerson AS price,
        p.pricePerPerson AS pricePerPerson,
        p.currency AS currency,
        p.maxCapacity AS maxCapacity,
        p.startDate AS startDate,
        p.endDate AS endDate,
        p.destinationCity AS destinationCity,
        p.destinationCountry AS destinationCountry,
        p.status AS status,

        DATEDIFF(p.endDate, p.startDate) AS durationDays,

        a.userID AS agentID,
        a.companyName AS agencyName,
        a.companyName AS companyName,
        a.agentTier AS agentTier,

        gt.groupTripID AS groupTripID,
        gt.groupName AS groupName,
        gt.currentMembers AS currentMembers,

        GROUP_CONCAT(DISTINCT ac.propertyType SEPARATOR ', ') AS propertyType,
        GROUP_CONCAT(DISTINCT ac.propertyType SEPARATOR ', ') AS accommodationType,

        0 AS averageRating

    FROM Package p

    LEFT JOIN Agent a
        ON p.agentID = a.userID

    LEFT JOIN GroupTrip gt
        ON p.packageID = gt.packageID

    LEFT JOIN PackageComponent pc
        ON p.packageID = pc.packageID

    LEFT JOIN Accommodation ac
        ON pc.componentID = ac.componentID

    WHERE p.status IS NULL
    OR p.status <> 'Deleted'

    GROUP BY
        p.packageID,
        p.title,
        p.description,
        p.pricePerPerson,
        p.currency,
        p.maxCapacity,
        p.startDate,
        p.endDate,
        p.destinationCity,
        p.destinationCountry,
        p.status,
        a.userID,
        a.companyName,
        a.agentTier,
        gt.groupTripID,
        gt.groupName,
        gt.currentMembers

    ORDER BY p.packageID DESC";

    $result = $conn->query($sql);

    if (!$result) {
        jsonResponse(false, "Could not load packages: " . $conn->error, []);
    }

    $packages = [];

    while ($row = $result->fetch_assoc()) {
        $packages[] = $row;
    }

    jsonResponse(true, "Packages loaded successfully.", $packages);
}

function getBrowseFilters($conn) {
    $data = [
        "destinations" => [],
        "agencies" => [],
        "accommodationTypes" => []
    ];

    $destinationSQL = "
        SELECT DISTINCT
            destinationCity,
            destinationCountry,
            CONCAT(destinationCity, ', ', destinationCountry) AS destinationLabel
        FROM Package
        WHERE destinationCity IS NOT NULL
        AND destinationCity <> ''
        ORDER BY destinationCountry ASC, destinationCity ASC
    ";

    $destinationResult = $conn->query($destinationSQL);

    if ($destinationResult) {
        while ($row = $destinationResult->fetch_assoc()) {
            $data["destinations"][] = [
                "destinationID" => $row["destinationLabel"],
                "destinationCity" => $row["destinationCity"],
                "destinationCountry" => $row["destinationCountry"]
            ];
        }
    }

    $agencySQL = "
        SELECT DISTINCT
            userID AS agentID,
            companyName AS agencyName,
            companyName AS companyName
        FROM Agent
        WHERE companyName IS NOT NULL
        AND companyName <> ''
        ORDER BY companyName ASC
    ";

    $agencyResult = $conn->query($agencySQL);

    if ($agencyResult) {
        while ($row = $agencyResult->fetch_assoc()) {
            $data["agencies"][] = $row;
        }
    }

    $accommodationSQL = "
        SELECT DISTINCT
            propertyType AS propertyType,
            propertyType AS accommodationType
        FROM Accommodation
        WHERE propertyType IS NOT NULL
        AND propertyType <> ''
        ORDER BY propertyType ASC
    ";

    $accommodationResult = $conn->query($accommodationSQL);

    if ($accommodationResult) {
        while ($row = $accommodationResult->fetch_assoc()) {
            $data["accommodationTypes"][] = $row;
        }
    }

    jsonResponse(true, "Browse filters loaded successfully.", $data);
}

$action = $_GET["action"] ?? "";

switch ($action) {
    case "getPackages":
        getPackages($conn);
        break;

    case "getBrowseFilters":
        getBrowseFilters($conn);
        break;

    default:
        jsonResponse(false, "Invalid or missing API action.", [
            "validActions" => [
                "getPackages",
                "getBrowseFilters"
            ]
        ]);
}

$conn->close();
?>