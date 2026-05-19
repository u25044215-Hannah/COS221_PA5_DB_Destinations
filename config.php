<?php
// config.php

header("Content-Type: application/json");

// Load .env file
$envPath = __DIR__ . "/.env";

if (!file_exists($envPath)) {
    die(json_encode([
        "success" => false,
        "message" => ".env file not found"
    ]));
}

$env = parse_ini_file($envPath);

if ($env === false) {
    die(json_encode([
        "success" => false,
        "message" => "Could not read .env file"
    ]));
}

// Get database details from .env
$host = $env["DB_HOST"] ?? "";
$username = $env["DB_USER"] ?? "";
$password = $env["DB_PASSWORD"] ?? "";
$database = $env["DB_NAME"] ?? "";
$port = isset($env["DB_PORT"]) ? (int)$env["DB_PORT"] : 3306;

// Validate required values
if ($host === "" || $username === "" || $database === "") {
    die(json_encode([
        "success" => false,
        "message" => "Missing required database details in .env file"
    ]));
}

// Create database connection
$conn = new mysqli($host, $username, $password, $database, $port);

// Check connection
if ($conn->connect_error) {
    die(json_encode([
        "success" => false,
        "message" => "Database connection failed: " . $conn->connect_error
    ]));
}

// Set character encoding
$conn->set_charset("utf8mb4");
?>