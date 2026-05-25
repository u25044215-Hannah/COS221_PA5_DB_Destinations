<?php
// config.php - Database connection file

$host = "localhost";
$username = "root";
$password = "Your Mariadb password";
$database = "destination_db"; //imported databse name

$conn = new mysqli($host, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

$conn->set_charset("utf8");

?>