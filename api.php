<?php
// api.php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . "/config.php";

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit();
}

function jsonResponse($success, $message = "", $data = null, $statusCode = 200) {
    http_response_code($statusCode);

    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);

    exit();
}

function getInput() {
    $raw = file_get_contents("php://input");
    $json = json_decode($raw, true);

    return is_array($json) ? $json : [];
}

function tableExists($conn, $tableName) {
    $stmt = $conn->prepare("
        SELECT COUNT(*) AS total
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
        AND table_name = ?
    ");

    $stmt->bind_param("s", $tableName);
    $stmt->execute();

    $result = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    return intval($result["total"]) > 0;
}

/*
    This endpoint is used by browse_backend.js.

    It gets all packages and joins the related agency, destination,
    accommodation and group-trip data where possible.
*/
function getPackages($conn) {
    $sql = "
        SELECT
            p.PackageID AS packageID,
            p.PackageName AS packageName,
            p.PackageName AS title,
            p.Description AS description,
            p.Price AS price,
            p.Price AS pricePerPerson,
            p.StartDate AS startDate,
            p.EndDate AS endDate,

            DATEDIFF(p.EndDate, p.StartDate) AS durationDays,

            d.DestinationID AS destinationID,
            d.City AS destinationCity,
            d.Country AS destinationCountry,

            a.AgentID AS agentID,
            a.CompanyName AS agencyName,
            a.CompanyName AS companyName,

            ac.AccommodationID AS accommodationID,
            ac.Name AS accommodationName,
            ac.PropertyType AS propertyType,
            ac.PropertyType AS accommodationType,

            gt.GroupTripID AS groupTripID,
            gt.GroupName AS groupName,
            gt.MaxGroupSize AS maxGroupSize,

            COALESCE(AVG(r.Rating), 0) AS averageRating

        FROM Package p

        LEFT JOIN Destination d
            ON p.DestinationID = d.DestinationID

        LEFT JOIN Agent a
            ON p.AgentID = a.AgentID

        LEFT JOIN Accommodation ac
            ON p.AccommodationID = ac.AccommodationID

        LEFT JOIN GroupTrip gt
            ON p.PackageID = gt.PackageID

        LEFT JOIN Review r
            ON p.PackageID = r.PackageID

        GROUP BY
            p.PackageID,
            p.PackageName,
            p.Description,
            p.Price,
            p.StartDate,
            p.EndDate,
            d.DestinationID,
            d.City,
            d.Country,
            a.AgentID,
            a.CompanyName,
            ac.AccommodationID,
            ac.Name,
            ac.PropertyType,
            gt.GroupTripID,
            gt.GroupName,
            gt.MaxGroupSize

        ORDER BY p.PackageID DESC
    ";

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

/*
    This endpoint fills the dropdowns on browse.html.

    It returns:
    - destinations
    - agencies
    - accommodation types
*/
function getBrowseFilters($conn) {
    $data = [
        "destinations" => [],
        "agencies" => [],
        "accommodationTypes" => []
    ];

    $destinationSQL = "
        SELECT DISTINCT
            DestinationID AS destinationID,
            City AS destinationCity,
            Country AS destinationCountry
        FROM Destination
        ORDER BY Country ASC, City ASC
    ";

    $agencySQL = "
        SELECT DISTINCT
            AgentID AS agentID,
            CompanyName AS agencyName,
            CompanyName AS companyName
        FROM Agent
        ORDER BY CompanyName ASC
    ";

    $accommodationSQL = "
        SELECT DISTINCT
            PropertyType AS propertyType,
            PropertyType AS accommodationType
        FROM Accommodation
        WHERE PropertyType IS NOT NULL
        AND PropertyType <> ''
        ORDER BY PropertyType ASC
    ";

    $destinationResult = $conn->query($destinationSQL);
    if ($destinationResult) {
        while ($row = $destinationResult->fetch_assoc()) {
            $data["destinations"][] = $row;
        }
    }

    $agencyResult = $conn->query($agencySQL);
    if ($agencyResult) {
        while ($row = $agencyResult->fetch_assoc()) {
            $data["agencies"][] = $row;
        }
    }

    $accommodationResult = $conn->query($accommodationSQL);
    if ($accommodationResult) {
        while ($row = $accommodationResult->fetch_assoc()) {
            $data["accommodationTypes"][] = $row;
        }
    }

    jsonResponse(true, "Browse filters loaded successfully.", $data);
}

function getUsers($conn) {
    $sql = "
        SELECT UserID, Name, Surname, Email, UserType, CreatedAt
        FROM Users
        ORDER BY UserID ASC
    ";

    $result = $conn->query($sql);

    if (!$result) {
        jsonResponse(false, "Query failed: " . $conn->error, []);
    }

    $users = [];

    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }

    jsonResponse(true, "Users loaded successfully.", $users);
}

function getUserByID($conn, $userID) {
    if ($userID === null || !is_numeric($userID)) {
        jsonResponse(false, "Valid userID is required.", null, 400);
    }

    $stmt = $conn->prepare("
        SELECT UserID, Name, Surname, Email, UserType, CreatedAt
        FROM Users
        WHERE UserID = ?
    ");

    if (!$stmt) {
        jsonResponse(false, "Prepare failed: " . $conn->error, null, 500);
    }

    $userID = intval($userID);

    $stmt->bind_param("i", $userID);
    $stmt->execute();

    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        $stmt->close();
        jsonResponse(false, "User not found.", null, 404);
    }

    $user = $result->fetch_assoc();
    $stmt->close();

    jsonResponse(true, "User loaded successfully.", $user);
}

$input = getInput();

$action = $_GET["action"] ?? $_GET["type"] ?? $input["action"] ?? $input["type"] ?? "";

switch ($action) {
    case "getPackages":
        getPackages($conn);
        break;

    case "getBrowseFilters":
        getBrowseFilters($conn);
        break;

    case "getUsers":
        getUsers($conn);
        break;

    case "getUserByID":
        $userID = $_GET["userID"] ?? $input["userID"] ?? null;
        getUserByID($conn, $userID);
        break;

    default:
        jsonResponse(false, "Invalid or missing API action.", [
            "receivedAction" => $action,
            "validActions" => [
                "getPackages",
                "getBrowseFilters",
                "getUsers",
                "getUserByID"
            ]
        ], 400);
}

$conn->close();
?>