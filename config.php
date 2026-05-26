<?php
// coded by Hannah Diedrick
// This file connects the project to the MariaDB database.

// Path to the .env file.
$envPath = __DIR__ . "/.env";

// Check that the .env file exists.
if (!file_exists($envPath)) {
    die(json_encode([
        "success" => false,
        "message" => ".env file not found"
    ]));
}

// Read values from the .env file.
$env = parse_ini_file($envPath);

// Stop if the .env file could not be read.
if ($env === false) {
    die(json_encode([
        "success" => false,
        "message" => "Could not read .env file"
    ]));
}

// Get database details from .env.
$host = $env["DB_HOST"] ?? "";
$username = $env["DB_USER"] ?? "";
$password = $env["DB_PASSWORD"] ?? "";
$database = $env["DB_NAME"] ?? "";
$port = isset($env["DB_PORT"]) ? (int)$env["DB_PORT"] : 3306;

// Validate required database values.
if ($host === "" || $username === "" || $database === "") {
    die(json_encode([
        "success" => false,
        "message" => "Missing required database details in .env file"
    ]));
}

// Create the database connection.
$conn = new mysqli($host, $username, $password, $database, $port);

// Stop if connection fails.
if ($conn->connect_error) {
    die(json_encode([
        "success" => false,
        "message" => "Database connection failed: " . $conn->connect_error
    ]));
}

// Use UTF-8 encoding so special characters display correctly.
$conn->set_charset("utf8mb4");
?>
