-- Add Flight component support to an existing Tripistry database
-- Run this if you do NOT want to re-import the full Destination_DB.sql dump.

ALTER TABLE `PackageComponent`
  MODIFY `componentType` ENUM('Accommodation','Restaurant','Excursion','Flight') NOT NULL;

CREATE TABLE IF NOT EXISTS `Flight` (
  `componentID` INT PRIMARY KEY,
  `airlineName` VARCHAR(100) NOT NULL,
  `flightNumber` VARCHAR(30),
  `departureAirport` VARCHAR(10) NOT NULL,
  `arrivalAirport` VARCHAR(10) NOT NULL,
  `departureTime` DATETIME NULL,
  `arrivalTime` DATETIME NULL,
  `cabinClass` VARCHAR(50) DEFAULT 'Economy',
  `baggageAllowance` VARCHAR(100),
  CONSTRAINT `fk_flight_component`
    FOREIGN KEY (`componentID`) REFERENCES `PackageComponent`(`componentID`)
    ON DELETE CASCADE ON UPDATE CASCADE
);
