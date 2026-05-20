<?php
// api.php
// This file contains shared API helper functions.
// It can also be opened directly to handle simple user API requests.

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Load the database connection from config.php.
// This gives us access to the $conn variable.
require_once __DIR__ . "/config.php";


// ----------------------------------------------------
// SESSION / AUTH HELPER FUNCTIONS
// ----------------------------------------------------

// Gets the currently logged-in user's ID from the PHP session.
if (!function_exists("getCurrentUserID")) {
    function getCurrentUserID() {
        if (isset($_SESSION["userID"])) {
            return intval($_SESSION["userID"]);
        }

        if (isset($_SESSION["user_id"])) {
            return intval($_SESSION["user_id"]);
        }

        if (isset($_SESSION["UserID"])) {
            return intval($_SESSION["UserID"]);
        }

        return 0;
    }
}


// Gets the current agent's ID.
// This is used for agency-only backend actions.
if (!function_exists("getCurrentAgentID")) {
    function getCurrentAgentID() {
        if (isset($_SESSION["agentID"])) {
            return intval($_SESSION["agentID"]);
        }

        if (isset($_SESSION["agent_id"])) {
            return intval($_SESSION["agent_id"]);
        }

        if (isset($_SESSION["userID"])) {
            return intval($_SESSION["userID"]);
        }

        if (isset($_SESSION["user_id"])) {
            return intval($_SESSION["user_id"]);
        }

        return 0;
    }
}


// Sends a JSON response and immediately stops the script.
if (!function_exists("jsonExit")) {
    function jsonExit($success, $message = "", $data = null, $statusCode = 200) {
        http_response_code($statusCode);
        header("Content-Type: application/json; charset=utf-8");

        echo json_encode([
            "success" => $success,
            "message" => $message,
            "data" => $data
        ]);

        exit();
    }
}


// Makes sure the logged-in user is an agency/agent.
if (!function_exists("requireAgency")) {
    function requireAgency() {
        $agentID = getCurrentAgentID();

        if ($agentID <= 0) {
            jsonExit(false, "Not logged in as an agent.", null, 401);
        }

        $type = strtolower((string)($_SESSION["userType"] ?? $_SESSION["user_type"] ?? $_SESSION["role"] ?? ""));

        if ($type !== "" && !in_array($type, ["agent", "agency", "travel agency"])) {
            jsonExit(false, "Access denied. Agent account required.", null, 403);
        }

        return $agentID;
    }
}


// ----------------------------------------------------
// DIRECT API.PHP REQUEST HANDLING
// ----------------------------------------------------

// Reads JSON data sent from JavaScript fetch().
if (!function_exists("api_get_input")) {
    function api_get_input() {
        $raw = file_get_contents("php://input");
        $json = json_decode($raw, true);

        return is_array($json) ? $json : [];
    }
}


// Main router for api.php.
if (!function_exists("api_handle_request")) {
    function api_handle_request($conn) {
        header("Content-Type: application/json; charset=utf-8");
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Headers: Content-Type");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

        if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
            exit();
        }

        $input = api_get_input();

        if ($_SERVER["REQUEST_METHOD"] === "GET") {
            $type = $_GET["type"] ?? "";
        } else {
            $type = $input["type"] ?? "";
        }

        switch ($type) {
            case "getUsers":
                getUsers($conn);
                break;

            case "getUserByID":
                $userID = $_GET["userID"] ?? ($input["userID"] ?? null);
                getUserByID($conn, $userID);
                break;

            default:
                echo json_encode([
                    "success" => false,
                    "message" => "Invalid or missing API request type"
                ]);
                break;
        }
    }
}


// ----------------------------------------------------
// GET ALL USERS
// ----------------------------------------------------

if (!function_exists("getUsers")) {
    function getUsers($conn) {
        $sql = "
            SELECT UserID, Name, Surname, Email, UserType, CreatedAt
            FROM Users
            ORDER BY UserID ASC
        ";

        $result = $conn->query($sql);

        if (!$result) {
            echo json_encode([
                "success" => false,
                "message" => "Query failed: " . $conn->error
            ]);
            return;
        }

        $users = [];

        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }

        echo json_encode([
            "success" => true,
            "data" => $users
        ]);
    }
}


// ----------------------------------------------------
// GET ONE USER BY ID
// ----------------------------------------------------

if (!function_exists("getUserByID")) {
    function getUserByID($conn, $userID) {
        if ($userID === null || !is_numeric($userID)) {
            echo json_encode([
                "success" => false,
                "message" => "Valid userID is required"
            ]);
            return;
        }

        $stmt = $conn->prepare("
            SELECT UserID, Name, Surname, Email, UserType, CreatedAt
            FROM Users
            WHERE UserID = ?
        ");

        if (!$stmt) {
            echo json_encode([
                "success" => false,
                "message" => "Prepare failed: " . $conn->error
            ]);
            return;
        }

        $userID = intval($userID);

        $stmt->bind_param("i", $userID);
        $stmt->execute();

        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            echo json_encode([
                "success" => false,
                "message" => "User not found"
            ]);

            $stmt->close();
            return;
        }

        $user = $result->fetch_assoc();

        echo json_encode([
            "success" => true,
            "data" => $user
        ]);

        $stmt->close();
    }
}


// ----------------------------------------------------
// Only run this router when api.php is opened directly.
// If another PHP file includes api.php, this part will not run.
// ----------------------------------------------------

if (realpath($_SERVER["SCRIPT_FILENAME"]) === realpath(__FILE__)) {
    api_handle_request($conn);
    $conn->close();
}
?>