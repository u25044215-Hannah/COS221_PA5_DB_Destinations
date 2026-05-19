<?php
$conn = new mysqli("localhost", "root", "", "DB_Destinations");

if ($conn->connect_error) {
    die(json_encode(["error" => "Database connection failed"]));
}
?>