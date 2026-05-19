/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-12.2.2-MariaDB, for osx10.21 (arm64)
--
-- Host: localhost    Database: DB_Destinations
-- ------------------------------------------------------
-- Server version	12.2.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `Accommodation`
--

DROP TABLE IF EXISTS `Accommodation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Accommodation` (
  `componentID` int(11) NOT NULL,
  `propertyType` varchar(100) DEFAULT NULL,
  `starRating` tinyint(4) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `amenities` text DEFAULT NULL,
  PRIMARY KEY (`componentID`),
  CONSTRAINT `fk_accommodation_component` FOREIGN KEY (`componentID`) REFERENCES `PackageComponent` (`componentID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Accommodation`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Accommodation` WRITE;
/*!40000 ALTER TABLE `Accommodation` DISABLE KEYS */;
INSERT INTO `Accommodation` VALUES
(1,'Hotel',4,'6 Rue de Bretagne, Paris','WiFi, Spa, Restaurant, Bar'),
(2,'Hotel',4,'2-1 Kabukicho, Shinjuku, Tokyo','WiFi, Gym, Onsen, Restaurant'),
(3,'Camp',5,'Maasai Mara National Reserve','Pool, WiFi, Game Drives, Bar'),
(4,'Resort',5,'Oia, Santorini','Infinity Pool, Spa, WiFi, Bar'),
(5,'Hotel',4,'135 W 45th St, New York, NY','WiFi, Gym, Rooftop Bar'),
(6,'Resort',5,'Jalan Raya Ubud, Bali','Pool, Yoga Studio, Spa, WiFi'),
(7,'Lodge',3,'Torres del Paine National Park','WiFi, Restaurant, Drying Room'),
(8,'Hotel',5,'Jumeirah Beach Rd, Dubai','Private Beach, Spa, Butler, Pool'),
(9,'Hotel',5,'West Quay, V&A Waterfront, Cape Town','Spa, Pool, WiFi, Bar'),
(10,'Inn',3,'Laugavegur 46, Reykjavik','WiFi, Hot Tub, Restaurant');
/*!40000 ALTER TABLE `Accommodation` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Agent`
--

DROP TABLE IF EXISTS `Agent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Agent` (
  `userID` int(11) NOT NULL,
  `companyName` varchar(255) DEFAULT NULL,
  `commissionRate` decimal(5,2) DEFAULT NULL,
  `agentTier` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`userID`),
  CONSTRAINT `fk_agent_user` FOREIGN KEY (`userID`) REFERENCES `User` (`userID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Agent`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Agent` WRITE;
/*!40000 ALTER TABLE `Agent` DISABLE KEYS */;
INSERT INTO `Agent` VALUES
(11,'TravelCo Inc.',8.50,'Senior'),
(12,'Voyages Ltd.',7.00,'Junior'),
(13,'GlobeTrip Agency',9.00,'Senior'),
(14,'Lux Travel Group',10.00,'Elite'),
(15,'Worldwide Tours',6.50,'Junior'),
(16,'Charlotte Trips SARL',8.00,'Senior'),
(17,'Adventours SRL',7.50,'Junior'),
(18,'TrekMate SA',9.50,'Elite'),
(19,'Elite Travel Japan',11.00,'Elite'),
(20,'Nomadic Travels Inc.',7.25,'Senior');
/*!40000 ALTER TABLE `Agent` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Booking`
--

DROP TABLE IF EXISTS `Booking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Booking` (
  `bookingID` int(11) NOT NULL AUTO_INCREMENT,
  `userID` int(11) NOT NULL,
  `agentID` int(11) DEFAULT NULL,
  `packageID` int(11) NOT NULL,
  `groupTripID` int(11) DEFAULT NULL,
  `numGuests` int(11) NOT NULL DEFAULT 1,
  `totalPrice` decimal(10,2) NOT NULL,
  `status` varchar(50) DEFAULT NULL,
  `bookedAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`bookingID`),
  KEY `fk_booking_traveller` (`userID`),
  KEY `fk_booking_agent` (`agentID`),
  KEY `fk_booking_package` (`packageID`),
  KEY `fk_booking_grouptrip` (`groupTripID`),
  CONSTRAINT `fk_booking_agent` FOREIGN KEY (`agentID`) REFERENCES `Agent` (`userID`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_booking_grouptrip` FOREIGN KEY (`groupTripID`) REFERENCES `GroupTrip` (`groupTripID`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_booking_package` FOREIGN KEY (`packageID`) REFERENCES `Package` (`packageID`) ON UPDATE CASCADE,
  CONSTRAINT `fk_booking_traveller` FOREIGN KEY (`userID`) REFERENCES `Traveller` (`userID`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Booking`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Booking` WRITE;
/*!40000 ALTER TABLE `Booking` DISABLE KEYS */;
INSERT INTO `Booking` VALUES
(1,1,11,1,1,2,2400.00,'Confirmed','2026-01-10 09:15:00'),
(2,2,11,1,1,1,1200.00,'Confirmed','2026-01-12 11:45:00'),
(3,3,12,2,2,2,3600.00,'Confirmed','2026-02-05 10:20:00'),
(4,4,13,2,2,1,1800.00,'Pending','2026-02-07 14:10:00'),
(5,5,14,3,3,2,7000.00,'Confirmed','2026-03-01 08:30:00'),
(6,6,NULL,4,4,2,4400.00,'Confirmed','2026-03-15 16:20:00'),
(7,7,15,5,5,1,950.00,'Confirmed','2026-01-20 09:45:00'),
(8,8,NULL,6,6,2,2800.00,'Pending','2026-04-01 12:15:00'),
(9,9,16,7,7,1,2800.00,'Confirmed','2026-04-10 10:30:00'),
(10,10,17,8,8,2,8000.00,'Confirmed','2026-04-20 15:20:00');
/*!40000 ALTER TABLE `Booking` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Excursion`
--

DROP TABLE IF EXISTS `Excursion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Excursion` (
  `componentID` int(11) NOT NULL,
  `duration` varchar(100) DEFAULT NULL,
  `difficulty` varchar(50) DEFAULT NULL,
  `meetingPoint` varchar(255) DEFAULT NULL,
  `maxGroupSize` int(11) DEFAULT NULL,
  PRIMARY KEY (`componentID`),
  CONSTRAINT `fk_excursion_component` FOREIGN KEY (`componentID`) REFERENCES `PackageComponent` (`componentID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Excursion`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Excursion` WRITE;
/*!40000 ALTER TABLE `Excursion` DISABLE KEYS */;
INSERT INTO `Excursion` VALUES
(21,'4 hours','Easy','Louvre Pyramid Main Entrance',25),
(22,'Full day','Moderate','Shinjuku Station South Exit',20),
(23,'6 hours','Easy','Safari Camp Main Gate',12),
(24,'8 hours','Easy','Athinios Ferry Port, Santorini',20),
(25,'4 hours','Easy','Battery Park Ferry Terminal',30),
(26,'3 hours','Easy','Tegalalang Village Car Park',15),
(27,'4 days','Hard','CONAF Park Entrance',10),
(28,'6 hours','Easy','Dubai Mall Main Entrance',20),
(29,'3 hours','Easy','Lower Cable Car Station',25),
(30,'Full day','Moderate','Reykjavik BSI Bus Terminal',30);
/*!40000 ALTER TABLE `Excursion` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `GroupMembership`
--

DROP TABLE IF EXISTS `GroupMembership`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `GroupMembership` (
  `membershipID` int(11) NOT NULL AUTO_INCREMENT,
  `userID` int(11) NOT NULL,
  `groupTripID` int(11) NOT NULL,
  `role` varchar(100) DEFAULT NULL,
  `joinedAt` datetime DEFAULT current_timestamp(),
  `paymentStatus` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`membershipID`),
  KEY `fk_membership_traveller` (`userID`),
  KEY `fk_membership_grouptrip` (`groupTripID`),
  CONSTRAINT `fk_membership_grouptrip` FOREIGN KEY (`groupTripID`) REFERENCES `GroupTrip` (`groupTripID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_membership_traveller` FOREIGN KEY (`userID`) REFERENCES `Traveller` (`userID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `GroupMembership`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `GroupMembership` WRITE;
/*!40000 ALTER TABLE `GroupMembership` DISABLE KEYS */;
INSERT INTO `GroupMembership` VALUES
(1,1,1,'Leader','2026-01-10 09:00:00','Paid'),
(2,2,1,'Member','2026-01-12 11:30:00','Paid'),
(3,3,2,'Leader','2026-02-05 10:00:00','Paid'),
(4,4,2,'Member','2026-02-07 14:00:00','Pending'),
(5,5,3,'Leader','2026-03-01 08:00:00','Paid'),
(6,6,4,'Member','2026-03-15 16:00:00','Paid'),
(7,7,5,'Leader','2026-01-20 09:30:00','Paid'),
(8,8,6,'Member','2026-04-01 12:00:00','Pending'),
(9,9,7,'Leader','2026-04-10 10:00:00','Paid'),
(10,10,8,'Member','2026-04-20 15:00:00','Paid');
/*!40000 ALTER TABLE `GroupMembership` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `GroupTrip`
--

DROP TABLE IF EXISTS `GroupTrip`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `GroupTrip` (
  `groupTripID` int(11) NOT NULL AUTO_INCREMENT,
  `groupName` varchar(255) NOT NULL,
  `currentMembers` int(11) DEFAULT 0,
  `packageID` int(11) NOT NULL,
  PRIMARY KEY (`groupTripID`),
  KEY `fk_grouptrip_package` (`packageID`),
  CONSTRAINT `fk_grouptrip_package` FOREIGN KEY (`packageID`) REFERENCES `Package` (`packageID`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `GroupTrip`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `GroupTrip` WRITE;
/*!40000 ALTER TABLE `GroupTrip` DISABLE KEYS */;
INSERT INTO `GroupTrip` VALUES
(1,'Paris Lovers 2026',8,1),
(2,'Tokyo Explorers',6,2),
(3,'Kenya Safari Squad',5,3),
(4,'Greek Island Hoppers',10,4),
(5,'NYC Weekend Warriors',7,5),
(6,'Bali Soul Seekers',9,6),
(7,'Patagonia Adventurers',4,7),
(8,'Dubai High Flyers',8,8),
(9,'Cape Town Explorers',6,9),
(10,'Iceland Aurora Chasers',5,10);
/*!40000 ALTER TABLE `GroupTrip` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Package`
--

DROP TABLE IF EXISTS `Package`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Package` (
  `packageID` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `pricePerPerson` decimal(10,2) NOT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'USD',
  `maxCapacity` int(11) DEFAULT NULL,
  `startDate` date DEFAULT NULL,
  `endDate` date DEFAULT NULL,
  `destinationCity` varchar(100) DEFAULT NULL,
  `destinationCountry` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`packageID`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Package`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Package` WRITE;
/*!40000 ALTER TABLE `Package` DISABLE KEYS */;
INSERT INTO `Package` VALUES
(1,'Paris Romantic Getaway','A 7-day romantic escape in the City of Light.',1200.00,'USD',20,'2026-06-01','2026-06-07','Paris','France','Active'),
(2,'Tokyo Cultural Immersion','Explore temples, cuisine and tradition in Tokyo.',1800.00,'USD',15,'2026-07-10','2026-07-20','Tokyo','Japan','Active'),
(3,'Safari Adventure Kenya','Witness the Great Migration on the Maasai Mara.',3500.00,'USD',12,'2026-08-05','2026-08-15','Nairobi','Kenya','Active'),
(4,'Greek Islands Cruise','Sail through Santorini, Mykonos and Rhodes.',2200.00,'EUR',30,'2026-09-01','2026-09-10','Athens','Greece','Active'),
(5,'New York City Highlights','Experience the best of the Big Apple in 5 days.',950.00,'USD',25,'2026-05-20','2026-05-24','New York','USA','Active'),
(6,'Bali Wellness Retreat','Yoga, spa and nature in the Island of the Gods.',1400.00,'USD',18,'2026-10-01','2026-10-10','Bali','Indonesia','Active'),
(7,'Patagonia Trekking Tour','Challenging hikes through Torres del Paine.',2800.00,'USD',10,'2026-11-15','2026-11-25','Punta Arenas','Chile','Active'),
(8,'Dubai Luxury Experience','Ultra-luxury stays, desert dunes and fine dining.',4000.00,'USD',20,'2026-12-01','2026-12-07','Dubai','UAE','Active'),
(9,'Cape Town Explorer','Wine routes, Table Mountain and the Cape Peninsula.',1600.00,'ZAR',22,'2026-06-15','2026-06-22','Cape Town','South Africa','Active'),
(10,'Iceland Northern Lights','Chase the aurora borealis across the Arctic Circle.',2500.00,'EUR',16,'2026-01-10','2026-01-17','Reykjavik','Iceland','Active');
/*!40000 ALTER TABLE `Package` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `PackageComponent`
--

DROP TABLE IF EXISTS `PackageComponent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `PackageComponent` (
  `componentID` int(11) NOT NULL AUTO_INCREMENT,
  `packageID` int(11) NOT NULL,
  `componentType` enum('Accommodation','Restaurant','Excursion') NOT NULL,
  `name` varchar(255) NOT NULL,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`componentID`),
  KEY `fk_component_package` (`packageID`),
  CONSTRAINT `fk_component_package` FOREIGN KEY (`packageID`) REFERENCES `Package` (`packageID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PackageComponent`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `PackageComponent` WRITE;
/*!40000 ALTER TABLE `PackageComponent` DISABLE KEYS */;
INSERT INTO `PackageComponent` VALUES
(1,1,'Accommodation','Hotel Le Marais','Paris','France','4-star boutique hotel in central Paris.'),
(2,2,'Accommodation','Shinjuku Grand Hotel','Tokyo','Japan','Modern hotel near Shinjuku station.'),
(3,3,'Accommodation','Maasai Mara Safari Camp','Nairobi','Kenya','Luxury tented camp on the savannah.'),
(4,4,'Accommodation','Santorini Clifftop Suites','Athens','Greece','Clifftop suites with caldera views.'),
(5,5,'Accommodation','Manhattan Boutique Hotel','New York','USA','Stylish hotel in Midtown Manhattan.'),
(6,6,'Accommodation','Ubud Jungle Resort','Bali','Indonesia','Eco-resort surrounded by rice terraces.'),
(7,7,'Accommodation','Patagonia Base Lodge','Punta Arenas','Chile','Rustic lodge near Torres del Paine.'),
(8,8,'Accommodation','Burj Al Arab Suite','Dubai','UAE','Iconic ultra-luxury hotel suite.'),
(9,9,'Accommodation','Cape Grace Hotel','Cape Town','South Africa','Waterfront hotel with mountain views.'),
(10,10,'Accommodation','Reykjavik Aurora Inn','Reykjavik','Iceland','Cosy inn with northern lights access.'),
(11,1,'Restaurant','Le Jules Verne','Paris','France','Fine dining inside the Eiffel Tower.'),
(12,2,'Restaurant','Sukiyabashi Jiro','Tokyo','Japan','World-famous sushi restaurant.'),
(13,3,'Restaurant','Carnivore Restaurant','Nairobi','Kenya','Renowned game meat dining experience.'),
(14,4,'Restaurant','Ambrosia Santorini','Athens','Greece','Seafood with sunset caldera views.'),
(15,5,'Restaurant','Eleven Madison Park','New York','USA','Three Michelin star plant-based cuisine.'),
(16,6,'Restaurant','Locavore Ubud','Bali','Indonesia','Farm-to-table contemporary Indonesian.'),
(17,7,'Restaurant','El Asador Patagónico','Punta Arenas','Chile','Traditional Patagonian lamb asado.'),
(18,8,'Restaurant','Nathan Outlaw at Al Mahara','Dubai','UAE','Underwater dining at the Burj Al Arab.'),
(19,9,'Restaurant','The Test Kitchen','Cape Town','South Africa','Award-winning contemporary cuisine.'),
(20,10,'Restaurant','Dill Restaurant','Reykjavik','Iceland','New Nordic cuisine using local produce.'),
(21,1,'Excursion','Louvre Museum Guided Tour','Paris','France','Skip-the-line guided tour of the Louvre.'),
(22,2,'Excursion','Mt Fuji Day Trip','Tokyo','Japan','Full-day trip to Mount Fuji and Hakone.'),
(23,3,'Excursion','Great Migration Game Drive','Nairobi','Kenya','Sunrise game drive to see the migration.'),
(24,4,'Excursion','Sailing around Santorini','Athens','Greece','Private catamaran tour of the islands.'),
(25,5,'Excursion','Statue of Liberty Ferry Tour','New York','USA','Ferry visit to Liberty and Ellis Islands.'),
(26,6,'Excursion','Tegalalang Rice Terrace Trek','Bali','Indonesia','Guided trek through iconic rice terraces.'),
(27,7,'Excursion','Torres del Paine W Trek','Punta Arenas','Chile','Multi-day trek of the famous W circuit.'),
(28,8,'Excursion','Desert Dune Bashing & BBQ','Dubai','UAE','Evening 4x4 dunes with a desert BBQ.'),
(29,9,'Excursion','Table Mountain Cable Car','Cape Town','South Africa','Cable car ride to the Table Mountain top.'),
(30,10,'Excursion','Golden Circle Day Tour','Reykjavik','Iceland','Geysers, waterfalls and Þingvellir Park.');
/*!40000 ALTER TABLE `PackageComponent` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Payment`
--

DROP TABLE IF EXISTS `Payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Payment` (
  `paymentID` int(11) NOT NULL AUTO_INCREMENT,
  `bookingID` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` varchar(50) DEFAULT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'USD',
  `status` varchar(50) DEFAULT NULL,
  `transactionRef` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`paymentID`),
  KEY `fk_payment_booking` (`bookingID`),
  CONSTRAINT `fk_payment_booking` FOREIGN KEY (`bookingID`) REFERENCES `Booking` (`bookingID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Payment`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Payment` WRITE;
/*!40000 ALTER TABLE `Payment` DISABLE KEYS */;
INSERT INTO `Payment` VALUES
(1,1,2400.00,'Credit Card','USD','Completed','TXN-001-2026'),
(2,2,1200.00,'PayPal','USD','Completed','TXN-002-2026'),
(3,3,3600.00,'Credit Card','USD','Completed','TXN-003-2026'),
(4,4,1800.00,'Bank Transfer','USD','Pending','TXN-004-2026'),
(5,5,7000.00,'Credit Card','USD','Completed','TXN-005-2026'),
(6,6,4400.00,'Debit Card','EUR','Completed','TXN-006-2026'),
(7,7,950.00,'PayPal','USD','Completed','TXN-007-2026'),
(8,8,2800.00,'Credit Card','USD','Pending','TXN-008-2026'),
(9,9,2800.00,'Bank Transfer','USD','Completed','TXN-009-2026'),
(10,10,8000.00,'Credit Card','USD','Completed','TXN-010-2026');
/*!40000 ALTER TABLE `Payment` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Restaurant`
--

DROP TABLE IF EXISTS `Restaurant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Restaurant` (
  `componentID` int(11) NOT NULL,
  `cuisineType` varchar(100) DEFAULT NULL,
  `priceTier` varchar(50) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`componentID`),
  CONSTRAINT `fk_restaurant_component` FOREIGN KEY (`componentID`) REFERENCES `PackageComponent` (`componentID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Restaurant`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Restaurant` WRITE;
/*!40000 ALTER TABLE `Restaurant` DISABLE KEYS */;
INSERT INTO `Restaurant` VALUES
(11,'French Fine Dining','Luxury','Champ de Mars, Paris'),
(12,'Japanese Sushi','Luxury','4-2-15 Ginza, Chuo-ku, Tokyo'),
(13,'African Game Meat','Mid-range','Langata Road, Nairobi'),
(14,'Greek Seafood','High-end','Oia, Santorini'),
(15,'Contemporary American','Luxury','11 Madison Ave, New York'),
(16,'Indonesian Modern','High-end','Jalan Dewisita, Ubud, Bali'),
(17,'Argentine/Patagonian','Mid-range','Av. Colón 762, Punta Arenas'),
(18,'British Seafood','Luxury','Jumeirah Beach Rd, Dubai'),
(19,'Contemporary SA','High-end','Old Biscuit Mill, Cape Town'),
(20,'New Nordic','High-end','Hverfisgata 12, Reykjavik');
/*!40000 ALTER TABLE `Restaurant` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Review`
--

DROP TABLE IF EXISTS `Review`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Review` (
  `reviewID` int(11) NOT NULL AUTO_INCREMENT,
  `userID` int(11) NOT NULL,
  `packageID` int(11) NOT NULL,
  `comment` text DEFAULT NULL,
  `overallScore` tinyint(4) DEFAULT NULL,
  `cleanlinessScore` tinyint(4) DEFAULT NULL,
  `serviceScore` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`reviewID`),
  KEY `fk_review_traveller` (`userID`),
  KEY `fk_review_package` (`packageID`),
  CONSTRAINT `fk_review_package` FOREIGN KEY (`packageID`) REFERENCES `Package` (`packageID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_review_traveller` FOREIGN KEY (`userID`) REFERENCES `Traveller` (`userID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Review`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Review` WRITE;
/*!40000 ALTER TABLE `Review` DISABLE KEYS */;
INSERT INTO `Review` VALUES
(1,1,1,'Absolutely magical trip! Paris exceeded all expectations.',5,5,5),
(2,2,1,'Beautiful city, the hotel was a little noisy but overall great.',4,3,4),
(3,3,2,'Tokyo is incredible. The food tour was the highlight.',5,5,5),
(4,4,2,'Amazing culture. Mt Fuji trip was worth every penny.',5,4,5),
(5,5,3,'The safari was life-changing. Saw the Big Five on day one!',5,4,5),
(6,6,4,'Greece was stunning. Catamaran tour was the best part.',5,5,4),
(7,7,5,'NYC never sleeps! Great value for such a vibrant city.',4,4,4),
(8,8,6,'Bali was peaceful and restorative. The resort is paradise.',5,5,5),
(9,9,7,'Patagonia is brutal but breathtaking. Tough trek, worth it.',5,3,4),
(10,10,8,'Dubai is over the top in the best way. Burj suite was unreal.',5,5,5);
/*!40000 ALTER TABLE `Review` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `Traveller`
--

DROP TABLE IF EXISTS `Traveller`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Traveller` (
  `userID` int(11) NOT NULL,
  `loyaltyTier` varchar(50) DEFAULT NULL,
  `totalTrips` int(11) DEFAULT 0,
  PRIMARY KEY (`userID`),
  CONSTRAINT `fk_traveller_user` FOREIGN KEY (`userID`) REFERENCES `User` (`userID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Traveller`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `Traveller` WRITE;
/*!40000 ALTER TABLE `Traveller` DISABLE KEYS */;
INSERT INTO `Traveller` VALUES
(1,'Gold',12),
(2,'Silver',7),
(3,'Platinum',25),
(4,'Bronze',3),
(5,'Gold',15),
(6,'Silver',5),
(7,'Platinum',30),
(8,'Bronze',2),
(9,'Gold',9),
(10,'Silver',6);
/*!40000 ALTER TABLE `Traveller` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `User`
--

DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `User` (
  `userID` int(11) NOT NULL AUTO_INCREMENT,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) NOT NULL,
  `emailAddress` varchar(255) NOT NULL,
  `phoneNumber` varchar(30) DEFAULT NULL,
  `nationality` varchar(100) DEFAULT NULL,
  `DOB` date DEFAULT NULL,
  `userType` enum('Traveller','Agent') NOT NULL,
  PRIMARY KEY (`userID`),
  UNIQUE KEY `emailAddress` (`emailAddress`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `User` WRITE;
/*!40000 ALTER TABLE `User` DISABLE KEYS */;
INSERT INTO `User` VALUES
(1,'Liam','Anderson','liam.anderson@email.com','+1-202-555-0101','American','1990-03-15','Traveller'),
(2,'Sophia','Martinez','sophia.martinez@email.com','+1-305-555-0182','Mexican','1985-07-22','Traveller'),
(3,'Noah','Williams','noah.williams@email.com','+44-20-7946-0301','British','1992-11-08','Traveller'),
(4,'Olivia','Johnson','olivia.johnson@email.com','+61-2-5550-0412','Australian','1988-01-30','Traveller'),
(5,'Ethan','Brown','ethan.brown@email.com','+1-416-555-0523','Canadian','1995-06-14','Traveller'),
(6,'Ava','Taylor','ava.taylor@email.com','+49-30-5550-0634','German','1993-09-27','Traveller'),
(7,'James','Davis','james.davis@email.com','+33-1-5550-0745','French','1987-04-03','Traveller'),
(8,'Isabella','Wilson','isabella.wilson@email.com','+39-06-5550-0856','Italian','1991-12-19','Traveller'),
(9,'Lucas','Moore','lucas.moore@email.com','+27-11-555-0967','South African','1996-08-11','Traveller'),
(10,'Mia','Jackson','mia.jackson@email.com','+81-3-5550-1078','Japanese','1989-02-25','Traveller'),
(11,'Oliver','White','oliver.white@travelco.com','+1-212-555-1101','American','1980-05-10','Agent'),
(12,'Emma','Harris','emma.harris@voyages.com','+44-20-7946-1202','British','1978-09-18','Agent'),
(13,'William','Clark','william.clark@globetrip.com','+1-310-555-1303','American','1982-03-22','Agent'),
(14,'Amelia','Lewis','amelia.lewis@luxtravel.com','+61-2-5550-1404','Australian','1975-11-07','Agent'),
(15,'Benjamin','Robinson','ben.robinson@worldwide.com','+49-89-5550-1505','German','1983-07-30','Agent'),
(16,'Charlotte','Walker','charlotte.walker@trips.com','+33-1-5550-1606','French','1979-01-14','Agent'),
(17,'Henry','Hall','henry.hall@adventours.com','+39-02-5550-1707','Italian','1977-06-28','Agent'),
(18,'Harper','Young','harper.young@trekmate.com','+27-21-555-1808','South African','1984-10-05','Agent'),
(19,'Alexander','King','alex.king@elitetravel.com','+81-3-5550-1909','Japanese','1981-04-16','Agent'),
(20,'Evelyn','Scott','evelyn.scott@nomadic.com','+1-604-555-2010','Canadian','1986-08-23','Agent');
/*!40000 ALTER TABLE `User` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-05-19 13:47:28
