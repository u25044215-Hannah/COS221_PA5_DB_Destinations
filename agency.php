<?php
// u25038967
// Shelby Bodenstein
// Tripistry - Agency, component, and group trip backend controller

session_start();
//gets the connection to the database
require_once __DIR__ . "/config.php";
if (file_exists(__DIR__ . "/includes/auth_check.php")) {
    require_once __DIR__ . "/includes/auth_check.php";
}

//gives responses as JSON
header("Content-Type: application/json; charset=utf-8");

//GENERAL RESPONSE HELPERS

function respond($success, $data = null, $message = "", $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
    exit();
}

function fail($message, $statusCode = 400) {
    respond(false, null, $message, $statusCode);
}

function safePrepare($conn, $sql) {
    $stmt = $conn->prepare($sql);
    if (!$stmt) fail("SQL prepare failed: " . $conn->error, 500);
    return $stmt;
}

function getInput() {
    $raw = file_get_contents("php://input");
    $json = json_decode($raw, true);
    return is_array($json) ? $json : $_POST;
}

function getAction($input) {
    return $_GET["action"] ?? $input["action"] ?? "health";
}

//AUTH/SESSION HELPERS

function getLoggedInAgentID() {
    if (function_exists("getCurrentAgentID")) return intval(getCurrentAgentID());
    if (isset($_SESSION["agentID"])) return intval($_SESSION["agentID"]);
    if (isset($_SESSION["agent_id"])) return intval($_SESSION["agent_id"]);
    if (isset($_SESSION["userID"])) return intval($_SESSION["userID"]);
    if (isset($_SESSION["user_id"])) return intval($_SESSION["user_id"]);
    return 0;
}

function requireAgentLogin() {
    if (function_exists("requireAgency")) {
        requireAgency();
        return;
    }

    $agentID = getLoggedInAgentID();
    if ($agentID <= 0) fail("Not logged in as an agent.", 401);

    $type = strtolower((string)($_SESSION["userType"] ?? $_SESSION["user_type"] ?? $_SESSION["role"] ?? "Agent"));
    if (!in_array($type, ["agent", "agency", "travel agency"])) {
        fail("Access denied. Agent account required.", 403);
    }
}

//INPUT VALIDATION

function requiredString($input, $key, $max = 255) {
    if (!isset($input[$key])) fail("Missing required field: " . $key);
    $value = trim((string)$input[$key]);
    if ($value === "") fail($key . " cannot be empty.");
    if (strlen($value) > $max) fail($key . " is too long. Max length is " . $max . ".");
    return $value;
}

function optionalString($input, $key, $default = null, $max = 255) {
    if (!isset($input[$key]) || trim((string)$input[$key]) === "") return $default;
    $value = trim((string)$input[$key]);
    if (strlen($value) > $max) fail($key . " is too long. Max length is " . $max . ".");
    return $value;
}

function requiredInt($input, $key, $min = null) {
    if (!isset($input[$key]) || !is_numeric($input[$key])) fail("Missing or invalid integer field: " . $key);
    $value = intval($input[$key]);
    if ($min !== null && $value < $min) fail($key . " must be at least " . $min . ".");
    return $value;
}

function optionalInt($input, $key, $default = null, $min = null) {
    if (!isset($input[$key]) || $input[$key] === "") return $default;
    if (!is_numeric($input[$key])) fail("Invalid integer field: " . $key);
    $value = intval($input[$key]);
    if ($min !== null && $value < $min) fail($key . " must be at least " . $min . ".");
    return $value;
}

function optionalFloat($input, $key, $default = null, $min = null) {
    if (!isset($input[$key]) || $input[$key] === "") return $default;
    if (!is_numeric($input[$key])) fail("Invalid number field: " . $key);
    $value = floatval($input[$key]);
    if ($min !== null && $value < $min) fail($key . " must be at least " . $min . ".");
    return $value;
}

function getIDFromRequest($input, $key) {
    if (isset($_GET[$key])) return intval($_GET[$key]);
    if (isset($_GET["id"])) return intval($_GET["id"]);
    if (isset($input[$key])) return intval($input[$key]);
    if (isset($input["id"])) return intval($input["id"]);
    fail("Missing ID.");
}

//BONUS MARKS FOR SECURITY
//Creates or returns the current CSRF token for this login session 
//frontend wil first call ?action=get_csrf_token
//then send the token back in post/put/delete requests as either sdrf_token or X-csrf-token
function getCsrfToken() {
    if (empty($_SESSION["csrf_token"])) {
        $_SESSION["csrf_token"] = bin2hex(random_bytes(32));
    }
    respond(true, ["csrf_token" => $_SESSION["csrf_token"]], "CSRF token generated.");
}

//protects state changing request from cross-site request for forgery
//read-only actions such as list/get dont need a csrf token
function requireCsrfToken($input) {
    $submitted = $_SERVER["HTTP_X_CSRF_TOKEN"] ?? ($input["csrf_token"] ?? "");
    if (empty($_SESSION["csrf_token"]) || !hash_equals($_SESSION["csrf_token"], (string)$submitted)) {
        fail("Invalid or missing CSRF token.", 403);
    }
}

//keeps a trail of the databse of the important agenct actions
//this should get us bonus marks for security through audit/error logs
function createAuditTableIfMissing($conn) {
    $sql = "
        CREATE TABLE IF NOT EXISTS agencyAuditLog (
            auditID INT AUTO_INCREMENT PRIMARY KEY,
            agentID INT NOT NULL,
            eventType VARCHAR(100) NOT NULL,
            entityType VARCHAR(100) NOT NULL,
            entityID INT NULL,
            details TEXT NULL,
            ipAddress VARCHAR(45) NULL,
            userAgent VARCHAR(255) NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_audit_agent (agentID),
            INDEX idx_audit_event (eventType)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ";
    $conn->query($sql);
}

function writeAuditLog($conn, $agentID, $eventType, $entityType, $entityID = null, $details = "") {
    createAuditTableIfMissing($conn);
    $stmt = safePrepare($conn, "
        INSERT INTO agencyAuditLog (agentID, eventType, entityType, entityID, details, ipAddress, userAgent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $ip = $_SERVER["REMOTE_ADDR"] ?? null;
    $ua = substr($_SERVER["HTTP_USER_AGENT"] ?? "unknown", 0, 255);
    $stmt->bind_param("ississs", $agentID, $eventType, $entityType, $entityID, $details, $ip, $ua);
    $stmt->execute();
}

function assertPackageBelongsToAgent($conn, $packageID, $agentID) {
    $stmt = safePrepare($conn, "SELECT packageID FROM `Package` WHERE packageID = ? AND agentID = ?");
    $stmt->bind_param("ii", $packageID, $agentID);
    $stmt->execute();
    if (!$stmt->get_result()->fetch_assoc()) {
        fail("Package not found or does not belong to this agent.", 404);
    }
}

function assertComponentBelongsToAgent($conn, $componentID, $agentID) {
    $stmt = safePrepare($conn, "
        SELECT pc.componentID
        FROM `PackageComponent` pc
        JOIN `Package` p ON pc.packageID = p.packageID
        WHERE pc.componentID = ? AND p.agentID = ?
    ");
    $stmt->bind_param("ii", $componentID, $agentID);
    $stmt->execute();
    if (!$stmt->get_result()->fetch_assoc()) {
        fail("Component not found or does not belong to this agent.", 404);
    }
}

//AGENCY/ AGENT PROFILE FUNCTION HELPERS

//loads the logged-in agency profile using the erd structure
// the user is the supertype, agent is the agenct subtype
function getAgencyProfile($conn, $agentID) {
    $stmt = safePrepare($conn, "
        SELECT u.userID, u.firstName, u.lastName, u.emailAddress, u.phoneNumber,
               u.nationality, u.DOB, u.userType,
               a.companyName, a.commissionRate, a.agentTier
        FROM `User` u
        JOIN `Agent` a ON u.userID = a.userID
        WHERE u.userID = ?
    ");
    $stmt->bind_param("i", $agentID);
    $stmt->execute();
    $profile = $stmt->get_result()->fetch_assoc();
    if (!$profile) fail("Agent profile not found.", 404);
    respond(true, $profile, "Agency profile loaded.");
}

//update basuc agenct profile details
function updateAgencyProfile($conn, $agentID, $input) {
    $firstName = requiredString($input, "firstName", 100);
    $lastName = requiredString($input, "lastName", 100);
    $emailAddress = requiredString($input, "emailAddress", 255);
    $phoneNumber = optionalString($input, "phoneNumber", null, 30);
    $nationality = optionalString($input, "nationality", null, 100);
    $DOB = optionalString($input, "DOB", null, 10);
    $companyName = optionalString($input, "companyName", null, 255);
    $commissionRate = optionalFloat($input, "commissionRate", null, 0);
    $agentTier = optionalString($input, "agentTier", null, 50);

    if (!filter_var($emailAddress, FILTER_VALIDATE_EMAIL)) fail("Invalid email address.");

    $conn->begin_transaction();
    try {
        //update common user fields
        $stmt = safePrepare($conn, "
            UPDATE `User`
            SET firstName = ?, lastName = ?, emailAddress = ?, phoneNumber = ?, nationality = ?, DOB = ?
            WHERE userID = ? AND userType = 'Agent'
        ");
        $stmt->bind_param("ssssssi", $firstName, $lastName, $emailAddress, $phoneNumber, $nationality, $DOB, $agentID);
        $stmt->execute();

        //update agent-specific fields
        $stmt = safePrepare($conn, "
            UPDATE `Agent`
            SET companyName = ?, commissionRate = ?, agentTier = ?
            WHERE userID = ?
        ");
        $stmt->bind_param("sdsi", $companyName, $commissionRate, $agentTier, $agentID);
        $stmt->execute();

        $conn->commit();
        writeAuditLog($conn, $agentID, "update_agency_profile", "Agent", $agentID, "Updated agency profile.");
        respond(true, ["agentID" => $agentID], "Agency profile updated.");
    } catch (Exception $e) {
        $conn->rollback();
        fail("Could not update agency profile: " . $e->getMessage(), 500);
    }
}

//COMPONENT FUNCTIONS

//returns all components owned by the logged-in agent
function listComponents($conn, $agentID) {
    $stmt = safePrepare($conn, "
        SELECT pc.componentID, pc.packageID, pc.componentType, pc.name, pc.city, pc.country, pc.description,
               p.title AS packageTitle
        FROM `PackageComponent` pc
        JOIN `Package` p ON pc.packageID = p.packageID
        WHERE p.agentID = ?
        ORDER BY p.title, pc.componentType, pc.name
    ");
    $stmt->bind_param("i", $agentID);
    $stmt->execute();
    respond(true, $stmt->get_result()->fetch_all(MYSQLI_ASSOC), "Components loaded.");
}

//gets one component and also loads its subtype details
function getComponentByID($conn, $agentID, $input) {
    $componentID = getIDFromRequest($input, "componentID");
    $stmt = safePrepare($conn, "
        SELECT pc.componentID, pc.packageID, pc.componentType, pc.name, pc.city, pc.country, pc.description,
               p.title AS packageTitle
        FROM `PackageComponent` pc
        JOIN `Package` p ON pc.packageID = p.packageID
        WHERE pc.componentID = ? AND p.agentID = ?
    ");
    $stmt->bind_param("ii", $componentID, $agentID);
    $stmt->execute();
    $component = $stmt->get_result()->fetch_assoc();
    if (!$component) fail("Component not found or does not belong to this agent.", 404);

    //loads subtyoe-specific details based on componentType
    if ($component["componentType"] === "Accommodation") {
        $stmt = safePrepare($conn, "SELECT propertyType, starRating, address, amenities FROM `Accommodation` WHERE componentID = ?");
    } elseif ($component["componentType"] === "Restaurant") {
        $stmt = safePrepare($conn, "SELECT cuisineType, priceTier, address FROM `Restaurant` WHERE componentID = ?");
    } else {
        $stmt = safePrepare($conn, "SELECT duration, difficulty, meetingPoint, maxGroupSize FROM `Excursion` WHERE componentID = ?");
    }

    $stmt->bind_param("i", $componentID);
    $stmt->execute();
    $component["details"] = $stmt->get_result()->fetch_assoc();
    respond(true, $component, "Component loaded.");
}

//creates a component and then creates the correct subtype row
function createComponent($conn, $agentID, $input) {
    $packageID = requiredInt($input, "packageID", 1);
    assertPackageBelongsToAgent($conn, $packageID, $agentID);

    $componentType = requiredString($input, "componentType", 50);
    if (!in_array($componentType, ["Accommodation", "Restaurant", "Excursion"])) {
        fail("componentType must be Accommodation, Restaurant, or Excursion.");
    }

    $name = requiredString($input, "name");
    $city = optionalString($input, "city", null, 100);
    $country = optionalString($input, "country", null, 100);
    $description = optionalString($input, "description", null, 5000);

    $conn->begin_transaction();
    try {
        //first you need to create the general package component row
        $stmt = safePrepare($conn, "
            INSERT INTO `PackageComponent` (packageID, componentType, name, city, country, description)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->bind_param("isssss", $packageID, $componentType, $name, $city, $country, $description);
        $stmt->execute();
        $componentID = $conn->insert_id;

        //then the matching subtype row
        if ($componentType === "Accommodation") {
            $propertyType = optionalString($input, "propertyType", null, 100);
            $starRating = optionalInt($input, "starRating", null, 0);
            $address = optionalString($input, "address", null, 255);
            $amenities = optionalString($input, "amenities", null, 5000);
            $stmt = safePrepare($conn, "
                INSERT INTO `Accommodation` (componentID, propertyType, starRating, address, amenities)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->bind_param("isiss", $componentID, $propertyType, $starRating, $address, $amenities);
            $stmt->execute();
        } elseif ($componentType === "Restaurant") {
            $cuisineType = optionalString($input, "cuisineType", null, 100);
            $priceTier = optionalString($input, "priceTier", null, 50);
            $address = optionalString($input, "address", null, 255);
            $stmt = safePrepare($conn, "
                INSERT INTO `Restaurant` (componentID, cuisineType, priceTier, address)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->bind_param("isss", $componentID, $cuisineType, $priceTier, $address);
            $stmt->execute();
        } else {
            $duration = optionalString($input, "duration", null, 100);
            $difficulty = optionalString($input, "difficulty", null, 50);
            $meetingPoint = optionalString($input, "meetingPoint", null, 255);
            $maxGroupSize = optionalInt($input, "maxGroupSize", null, 1);
            $stmt = safePrepare($conn, "
                INSERT INTO `Excursion` (componentID, duration, difficulty, meetingPoint, maxGroupSize)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->bind_param("isssi", $componentID, $duration, $difficulty, $meetingPoint, $maxGroupSize);
            $stmt->execute();
        }

        $conn->commit();
        writeAuditLog($conn, $agentID, "create_component", "PackageComponent", $componentID, "Created component: " . $name);
        respond(true, ["componentID" => $componentID], "Component created.", 201);
    } catch (Exception $e) {
        $conn->rollback();
        fail("Could not create component: " . $e->getMessage(), 500);
    }
}

//updates the common component fields and its subtype -specific fields
function updateComponent($conn, $agentID, $input) {
    $componentID = getIDFromRequest($input, "componentID");
    assertComponentBelongsToAgent($conn, $componentID, $agentID);

    $packageID = requiredInt($input, "packageID", 1);
    assertPackageBelongsToAgent($conn, $packageID, $agentID);

    $componentType = requiredString($input, "componentType", 50);
    if (!in_array($componentType, ["Accommodation", "Restaurant", "Excursion"])) {
        fail("componentType must be Accommodation, Restaurant, or Excursion.");
    }

    $name = requiredString($input, "name");
    $city = optionalString($input, "city", null, 100);
    $country = optionalString($input, "country", null, 100);
    $description = optionalString($input, "description", null, 5000);

    $conn->begin_transaction();
    try {
        $stmt = safePrepare($conn, "
            UPDATE `PackageComponent`
            SET packageID = ?, componentType = ?, name = ?, city = ?, country = ?, description = ?
            WHERE componentID = ?
        ");
        $stmt->bind_param("isssssi", $packageID, $componentType, $name, $city, $country, $description, $componentID);
        $stmt->execute();

        // Remove existing subtype row, then insert the correct subtype row.
        $stmt = safePrepare($conn, "DELETE FROM `Accommodation` WHERE componentID = ?");
        $stmt->bind_param("i", $componentID);
        $stmt->execute();
        $stmt = safePrepare($conn, "DELETE FROM `Restaurant` WHERE componentID = ?");
        $stmt->bind_param("i", $componentID);
        $stmt->execute();
        $stmt = safePrepare($conn, "DELETE FROM `Excursion` WHERE componentID = ?");
        $stmt->bind_param("i", $componentID);
        $stmt->execute();

        if ($componentType === "Accommodation") {
            $propertyType = optionalString($input, "propertyType", null, 100);
            $starRating = optionalInt($input, "starRating", null, 0);
            $address = optionalString($input, "address", null, 255);
            $amenities = optionalString($input, "amenities", null, 5000);
            $stmt = safePrepare($conn, "INSERT INTO `Accommodation` (componentID, propertyType, starRating, address, amenities) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("isiss", $componentID, $propertyType, $starRating, $address, $amenities);
            $stmt->execute();
        } elseif ($componentType === "Restaurant") {
            $cuisineType = optionalString($input, "cuisineType", null, 100);
            $priceTier = optionalString($input, "priceTier", null, 50);
            $address = optionalString($input, "address", null, 255);
            $stmt = safePrepare($conn, "INSERT INTO `Restaurant` (componentID, cuisineType, priceTier, address) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("isss", $componentID, $cuisineType, $priceTier, $address);
            $stmt->execute();
        } else {
            $duration = optionalString($input, "duration", null, 100);
            $difficulty = optionalString($input, "difficulty", null, 50);
            $meetingPoint = optionalString($input, "meetingPoint", null, 255);
            $maxGroupSize = optionalInt($input, "maxGroupSize", null, 1);
            $stmt = safePrepare($conn, "INSERT INTO `Excursion` (componentID, duration, difficulty, meetingPoint, maxGroupSize) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("isssi", $componentID, $duration, $difficulty, $meetingPoint, $maxGroupSize);
            $stmt->execute();
        }

        $conn->commit();
        writeAuditLog($conn, $agentID, "update_component", "PackageComponent", $componentID, "Updated component: " . $name);
        respond(true, ["componentID" => $componentID], "Component updated.");
    } catch (Exception $e) {
        $conn->rollback();
        fail("Could not update component: " . $e->getMessage(), 500);
    }
}

//fully deletes a component and its sybtype row
//first removes the link to packages to avoid foreign key errors
function deleteComponent($conn, $agentID, $input) {
    $componentID = getIDFromRequest($input, "componentID");
    assertComponentBelongsToAgent($conn, $componentID, $agentID);

    // Because Accommodation/Restaurant/Excursion all cascade from PackageComponent,
    // deleting PackageComponent automatically removes its subtype row.
    $stmt = safePrepare($conn, "DELETE FROM `PackageComponent` WHERE componentID = ?");
    $stmt->bind_param("i", $componentID);
    $stmt->execute();
    writeAuditLog($conn, $agentID, "delete_component", "PackageComponent", $componentID, "Deleted component.");
    respond(true, ["componentID" => $componentID], "Component deleted.");
}

//GROUP TRIP FUNCS

//lists all of the group trups for packages owned by the logged-on agent
function listGroupTrips($conn, $agentID) {
    $stmt = safePrepare($conn, "
        SELECT gt.groupTripID, gt.groupName, gt.currentMembers, gt.packageID,
               p.title AS packageTitle, p.destinationCity, p.destinationCountry
        FROM `GroupTrip` gt
        JOIN `Package` p ON gt.packageID = p.packageID
        WHERE p.agentID = ?
        ORDER BY gt.groupName
    ");
    $stmt->bind_param("i", $agentID);
    $stmt->execute();
    respond(true, $stmt->get_result()->fetch_all(MYSQLI_ASSOC), "Group trips loaded.");
}

//gets one group trip, but only if the package belings to the agent that is logged-in
function getGroupTripByID($conn, $agentID, $input) {
    $groupTripID = getIDFromRequest($input, "groupTripID");
    $stmt = safePrepare($conn, "
        SELECT gt.groupTripID, gt.groupName, gt.currentMembers, gt.packageID,
               p.title AS packageTitle, p.destinationCity, p.destinationCountry
        FROM `GroupTrip` gt
        JOIN `Package` p ON gt.packageID = p.packageID
        WHERE gt.groupTripID = ? AND p.agentID = ?
    ");
    $stmt->bind_param("ii", $groupTripID, $agentID);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    if (!$row) fail("Group trip not found or does not belong to this agent.", 404);
    respond(true, $row, "Group trip loaded.");
}

//creates a group trip under one of th e liffed-in agents packages
function createGroupTrip($conn, $agentID, $input) {
    $packageID = requiredInt($input, "packageID", 1);
    assertPackageBelongsToAgent($conn, $packageID, $agentID);
    $groupName = requiredString($input, "groupName");
    $currentMembers = optionalInt($input, "currentMembers", 0, 0);

    //check that the package belongs to this agent
    $stmt = safePrepare($conn, "
        INSERT INTO `GroupTrip` (groupName, currentMembers, packageID)
        VALUES (?, ?, ?)
    ");
    $stmt->bind_param("sii", $groupName, $currentMembers, $packageID);
    $stmt->execute();
    $newID = $conn->insert_id;
    writeAuditLog($conn, $agentID, "create_group_trip", "GroupTrip", $newID, "Created group trip: " . $groupName);
    respond(true, ["groupTripID" => $newID], "Group trip created.", 201);
}

//updates a group trip
function updateGroupTrip($conn, $agentID, $input) {
    $groupTripID = getIDFromRequest($input, "groupTripID");
    $packageID = requiredInt($input, "packageID", 1);
    assertPackageBelongsToAgent($conn, $packageID, $agentID);
    $groupName = requiredString($input, "groupName");
    $currentMembers = optionalInt($input, "currentMembers", 0, 0);

    //make sure the new selected packafe belongs to this agent
    $stmt = safePrepare($conn, "
        UPDATE `GroupTrip` gt
        JOIN `Package` oldp ON gt.packageID = oldp.packageID
        SET gt.groupName = ?, gt.currentMembers = ?, gt.packageID = ?
        WHERE gt.groupTripID = ? AND oldp.agentID = ?
    ");
    $stmt->bind_param("siiii", $groupName, $currentMembers, $packageID, $groupTripID, $agentID);
    $stmt->execute();
    if ($stmt->affected_rows < 1) fail("Group trip not updated. It may not exist, belong to another agent, or values were unchanged.", 404);
    writeAuditLog($conn, $agentID, "update_group_trip", "GroupTrip", $groupTripID, "Updated group trip: " . $groupName);
    respond(true, ["groupTripID" => $groupTripID], "Group trip updated.");
}

//deletes a group trip if it is linker to one of the logged-in agents packages
function deleteGroupTrip($conn, $agentID, $input) {
    $groupTripID = getIDFromRequest($input, "groupTripID");
    $stmt = safePrepare($conn, "
        DELETE gt
        FROM `GroupTrip` gt
        JOIN `Package` p ON gt.packageID = p.packageID
        WHERE gt.groupTripID = ? AND p.agentID = ?
    ");
    $stmt->bind_param("ii", $groupTripID, $agentID);
    $stmt->execute();
    if ($stmt->affected_rows < 1) fail("Group trip not found or does not belong to this agent.", 404);
    writeAuditLog($conn, $agentID, "delete_group_trip", "GroupTrip", $groupTripID, "Deleted group trip.");
    respond(true, ["groupTripID" => $groupTripID], "Group trip deleted.");
}

function listBookings($conn, $agentID) {
    $stmt = safePrepare($conn, "
        SELECT 
            b.bookingID,
            b.userID,
            b.agentID,
            b.packageID,
            b.groupTripID,
            b.numGuests,
            b.totalPrice,
            b.status,
            b.bookedAt,
            u.firstName,
            u.lastName,
            p.title AS packageTitle,
            p.currency
        FROM `Booking` b
        JOIN `User` u ON b.userID = u.userID
        JOIN `Package` p ON b.packageID = p.packageID
        WHERE b.agentID = ?
        ORDER BY b.bookedAt DESC
    ");

    $stmt->bind_param("i", $agentID);
    $stmt->execute();

    respond(true, $stmt->get_result()->fetch_all(MYSQLI_ASSOC), "Bookings loaded.");
}

function getDashboardStats($conn, $agentID) {
    $stmt = safePrepare($conn, "
        SELECT 
            COALESCE(SUM(totalPrice), 0) AS totalRevenue,
            COUNT(*) AS totalBookings,
            SUM(CASE WHEN LOWER(status) = 'pending' THEN 1 ELSE 0 END) AS pendingBookings
        FROM `Booking`
        WHERE agentID = ?
    ");

    $stmt->bind_param("i", $agentID);
    $stmt->execute();
    $bookingStats = $stmt->get_result()->fetch_assoc();

    $stmt = safePrepare($conn, "
        SELECT COALESCE(AVG(r.overallScore), 0) AS avgRating
        FROM `Review` r
        JOIN `Package` p ON r.packageID = p.packageID
        WHERE p.agentID = ?
    ");

    $stmt->bind_param("i", $agentID);
    $stmt->execute();
    $ratingStats = $stmt->get_result()->fetch_assoc();

    $stmt = safePrepare($conn, "
        SELECT 
            r.reviewID,
            r.userID,
            r.packageID,
            r.comment,
            r.overallScore,
            r.cleanlinessScore,
            r.serviceScore,
            CONCAT(u.firstName, ' ', u.lastName) AS travellerName,
            p.title AS packageTitle
        FROM `Review` r
        JOIN `User` u ON r.userID = u.userID
        JOIN `Package` p ON r.packageID = p.packageID
        WHERE p.agentID = ?
        ORDER BY r.reviewID DESC
        LIMIT 5
    ");

    $stmt->bind_param("i", $agentID);
    $stmt->execute();
    $recentReviews = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    respond(true, [
        "totalRevenue" => $bookingStats["totalRevenue"],
        "totalBookings" => $bookingStats["totalBookings"],
        "pendingBookings" => $bookingStats["pendingBookings"],
        "avgRating" => $ratingStats["avgRating"],
        "recentReviews" => $recentReviews
    ], "Dashboard stats loaded.");
}

function getGroupTripEnrollees($conn, $agentID, $input) {
    $groupTripID = getIDFromRequest($input, "groupTripID");

    $stmt = safePrepare($conn, "
        SELECT 
            gm.membershipID,
            gm.userID,
            gm.groupTripID,
            gm.role,
            gm.joinedAt,
            gm.paymentStatus,
            u.firstName,
            u.lastName,
            u.emailAddress
        FROM `GroupMembership` gm
        JOIN `User` u ON gm.userID = u.userID
        JOIN `GroupTrip` gt ON gm.groupTripID = gt.groupTripID
        JOIN `Package` p ON gt.packageID = p.packageID
        WHERE gm.groupTripID = ?
          AND p.agentID = ?
        ORDER BY gm.joinedAt DESC
    ");

    $stmt->bind_param("ii", $groupTripID, $agentID);
    $stmt->execute();

    respond(true, $stmt->get_result()->fetch_all(MYSQLI_ASSOC), "Group trip enrollees loaded.");
}

$input = getInput();
$action = getAction($input);

if ($action === "health") {
    respond(true, ["available_actions" => [
        "get_csrf_token", "get_agency_profile", "update_agency_profile",
        "list_bookings", "get_dashboard_stats", "get_group_trip_enrollees",
        "list_components", "get_component", "create_component", "update_component", "delete_component",
        "list_group_trips", "get_group_trip", "create_group_trip", "update_group_trip", "delete_group_trip"
    ]], "Agencies backend is running.");
}

if ($action === "get_csrf_token") getCsrfToken();

//ROUTER

requireAgentLogin();
$agentID = getLoggedInAgentID();

if (in_array($action, [
    "update_agency_profile", "create_component", "update_component", "delete_component",
    "create_group_trip", "update_group_trip", "delete_group_trip"
])) {
    requireCsrfToken($input);
}

switch ($action) {
    case "get_agency_profile": getAgencyProfile($conn, $agentID); break;
    case "update_agency_profile": updateAgencyProfile($conn, $agentID, $input); break;
    case "list_components": listComponents($conn, $agentID); break;
    case "get_component": getComponentByID($conn, $agentID, $input); break;
    case "create_component": createComponent($conn, $agentID, $input); break;
    case "update_component": updateComponent($conn, $agentID, $input); break;
    case "delete_component": deleteComponent($conn, $agentID, $input); break;
    case "list_group_trips": listGroupTrips($conn, $agentID); break;
    case "get_group_trip": getGroupTripByID($conn, $agentID, $input); break;
    case "create_group_trip": createGroupTrip($conn, $agentID, $input); break;
    case "update_group_trip": updateGroupTrip($conn, $agentID, $input); break;
    case "delete_group_trip": deleteGroupTrip($conn, $agentID, $input); break;
    case "list_bookings": listBookings($conn, $agentID); break;
    case "get_dashboard_stats": getDashboardStats($conn, $agentID); break;
    case "get_group_trip_enrollees": getGroupTripEnrollees($conn, $agentID, $input); break;
    default: fail("Unknown action: " . $action, 404);
}
