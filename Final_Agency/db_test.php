<?php
//Just Quick database connection verification, 
// use XAMPP -> Apache running + MySQL then run file in browser as localhost
require_once "config.php";

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

echo "Database connection SUCCESS";
?>