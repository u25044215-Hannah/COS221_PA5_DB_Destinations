SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `Payment`;
DROP TABLE IF EXISTS `Review`;
DROP TABLE IF EXISTS `GroupMembership`;
DROP TABLE IF EXISTS `Booking`;
DROP TABLE IF EXISTS `Excursion`;
DROP TABLE IF EXISTS `Restaurant`;
DROP TABLE IF EXISTS `Accommodation`;
DROP TABLE IF EXISTS `PackageComponent`;
DROP TABLE IF EXISTS `GroupTrip`;
DROP TABLE IF EXISTS `Package`;
DROP TABLE IF EXISTS `Agent`;
DROP TABLE IF EXISTS `Traveller`;
DROP TABLE IF EXISTS `User`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `User` (
  `userID` INT AUTO_INCREMENT PRIMARY KEY,
  `firstName` VARCHAR(100) NOT NULL,
  `lastName` VARCHAR(100) NOT NULL,
  `emailAddress` VARCHAR(255) NOT NULL UNIQUE,
  `phoneNumber` VARCHAR(30),
  `nationality` VARCHAR(100),
  `DOB` DATE,
  `userType` ENUM('Traveller','Agent') NOT NULL,
  `PasswordHash` VARCHAR(255) NOT NULL
);

CREATE TABLE `Traveller` (
  `userID` INT PRIMARY KEY,
  `loyaltyTier` VARCHAR(50),
  `totalTrips` INT DEFAULT 0,
  CONSTRAINT `fk_traveller_user`
    FOREIGN KEY (`userID`) REFERENCES `User`(`userID`)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE `Agent` (
  `userID` INT PRIMARY KEY,
  `companyName` VARCHAR(255),
  `commissionRate` DECIMAL(5,2),
  `agentTier` VARCHAR(50),
  CONSTRAINT `fk_agent_user`
    FOREIGN KEY (`userID`) REFERENCES `User`(`userID`)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE `Package` (
  `packageID` INT AUTO_INCREMENT PRIMARY KEY,
  `agentID` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `pricePerPerson` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `maxCapacity` INT,
  `startDate` DATE,
  `endDate` DATE,
  `destinationCity` VARCHAR(100),
  `destinationCountry` VARCHAR(100),
  `status` VARCHAR(50),
  CONSTRAINT `fk_package_agent`
    FOREIGN KEY (`agentID`) REFERENCES `Agent`(`userID`)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE `GroupTrip` (
  `groupTripID` INT AUTO_INCREMENT PRIMARY KEY,
  `groupName` VARCHAR(255) NOT NULL,
  `currentMembers` INT DEFAULT 0,
  `packageID` INT NOT NULL,
  CONSTRAINT `fk_grouptrip_package`
    FOREIGN KEY (`packageID`) REFERENCES `Package`(`packageID`)
    ON UPDATE CASCADE
);

CREATE TABLE `PackageComponent` (
  `componentID` INT AUTO_INCREMENT PRIMARY KEY,
  `packageID` INT NOT NULL,
  `componentType` ENUM('Accommodation','Restaurant','Excursion') NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `city` VARCHAR(100),
  `country` VARCHAR(100),
  `description` TEXT,
  CONSTRAINT `fk_component_package`
    FOREIGN KEY (`packageID`) REFERENCES `Package`(`packageID`)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE `Accommodation` (
  `componentID` INT PRIMARY KEY,
  `propertyType` VARCHAR(100),
  `starRating` TINYINT,
  `address` VARCHAR(255),
  `amenities` TEXT,
  CONSTRAINT `fk_accommodation_component`
    FOREIGN KEY (`componentID`) REFERENCES `PackageComponent`(`componentID`)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE `Restaurant` (
  `componentID` INT PRIMARY KEY,
  `cuisineType` VARCHAR(100),
  `priceTier` VARCHAR(50),
  `address` VARCHAR(255),
  CONSTRAINT `fk_restaurant_component`
    FOREIGN KEY (`componentID`) REFERENCES `PackageComponent`(`componentID`)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE `Excursion` (
  `componentID` INT PRIMARY KEY,
  `duration` VARCHAR(100),
  `difficulty` VARCHAR(50),
  `meetingPoint` VARCHAR(255),
  `maxGroupSize` INT,
  CONSTRAINT `fk_excursion_component`
    FOREIGN KEY (`componentID`) REFERENCES `PackageComponent`(`componentID`)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE `Booking` (
  `bookingID` INT AUTO_INCREMENT PRIMARY KEY,
  `userID` INT NOT NULL,
  `agentID` INT,
  `packageID` INT NOT NULL,
  `groupTripID` INT,
  `numGuests` INT NOT NULL DEFAULT 1,
  `totalPrice` DECIMAL(10,2) NOT NULL,
  `status` VARCHAR(50),
  `bookedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_booking_traveller`
    FOREIGN KEY (`userID`) REFERENCES `Traveller`(`userID`)
    ON UPDATE CASCADE,
  CONSTRAINT `fk_booking_agent`
    FOREIGN KEY (`agentID`) REFERENCES `Agent`(`userID`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_booking_package`
    FOREIGN KEY (`packageID`) REFERENCES `Package`(`packageID`)
    ON UPDATE CASCADE,
  CONSTRAINT `fk_booking_grouptrip`
    FOREIGN KEY (`groupTripID`) REFERENCES `GroupTrip`(`groupTripID`)
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE `GroupMembership` (
  `membershipID` INT AUTO_INCREMENT PRIMARY KEY,
  `userID` INT NOT NULL,
  `groupTripID` INT NOT NULL,
  `role` VARCHAR(100),
  `joinedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `paymentStatus` VARCHAR(50),
  CONSTRAINT `fk_membership_traveller`
    FOREIGN KEY (`userID`) REFERENCES `Traveller`(`userID`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_membership_grouptrip`
    FOREIGN KEY (`groupTripID`) REFERENCES `GroupTrip`(`groupTripID`)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE `Review` (
  `reviewID` INT AUTO_INCREMENT PRIMARY KEY,
  `userID` INT NOT NULL,
  `packageID` INT NOT NULL,
  `comment` TEXT,
  `overallScore` TINYINT,
  `cleanlinessScore` TINYINT,
  `serviceScore` TINYINT,
  CONSTRAINT `fk_review_traveller`
    FOREIGN KEY (`userID`) REFERENCES `Traveller`(`userID`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_review_package`
    FOREIGN KEY (`packageID`) REFERENCES `Package`(`packageID`)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE `Payment` (
  `paymentID` INT AUTO_INCREMENT PRIMARY KEY,
  `bookingID` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `method` VARCHAR(50),
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `status` VARCHAR(50),
  `transactionRef` VARCHAR(255),
  CONSTRAINT `fk_payment_booking`
    FOREIGN KEY (`bookingID`) REFERENCES `Booking`(`bookingID`)
    ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO `User` VALUES
(1,'Liam','Anderson','liam.anderson@email.com','+1-202-555-0101','American','1990-03-15','Traveller','$2y$12$WciDkSUTzREOsBk20vKXm.MlQDk8fbAQtc7fANUtdhLNadmEuxIdu'),
(2,'Sophia','Martinez','sophia.martinez@email.com','+1-305-555-0182','Mexican','1985-07-22','Traveller','$2y$12$Bau20F8S/sedmyx98gEMKuQAFOYybVlBuGOKMecYvkumy1hxv/UVa'),
(3,'Noah','Williams','noah.williams@email.com','+44-20-7946-0301','British','1992-11-08','Traveller','$2y$12$PCS4Zjld/3AfwU/ukBxFx.0.vh56H19Jh0bIRL6RXU.gATgcExWka'),
(4,'Olivia','Johnson','olivia.johnson@email.com','+61-2-5550-0412','Australian','1988-01-30','Traveller','$2y$12$p.pG8L3Z3PahG117xFTR2uugYw0kD.3U24iHCf3.j5a4y5XSZAI72'),
(5,'Ethan','Brown','ethan.brown@email.com','+1-416-555-0523','Canadian','1995-06-14','Traveller','$2y$12$4AJVD6cQkf6LH597HOQYCOGUtn1Epxwat6vl0KUOrvLbTwY3HD/yG'),
(6,'Ava','Taylor','ava.taylor@email.com','+49-30-5550-0634','German','1993-09-27','Traveller','$2y$12$djrGjbtUQGYhl0/vd/5.V.Diwlwstt1QY7AD9T2dgPTdLuHn8p7ee'),
(7,'James','Davis','james.davis@email.com','+33-1-5550-0745','French','1987-04-03','Traveller','$2y$12$LIYlwPCB0nQ3VZlXBNEnhunUmrOzXE3Wg/4iI3XlbBNWuDeKnN6VW'),
(8,'Isabella','Wilson','isabella.wilson@email.com','+39-06-5550-0856','Italian','1991-12-19','Traveller','$2y$12$scShhvghjx1unG/uxE4EvO7ZZDELCXUQlAHE6q9e8dt8vKd6KjRVa'),
(9,'Lucas','Moore','lucas.moore@email.com','+27-11-555-0967','South African','1996-08-11','Traveller','$2y$12$f5R46mhelquhpWVKT62YtuGLlhcccDyoRQHTHN85Qdk5.zUdS0lMy'),
(10,'Mia','Jackson','mia.jackson@email.com','+81-3-5550-1078','Japanese','1989-02-25','Traveller','$2y$12$jXrdEV8gdQrvC0qLV8qwVeRMRhoXbSWc5RZ.6A/8mF5fHgnAUq3Nq'),
(11,'Oliver','White','oliver.white@travelco.com','+1-212-555-1101','American','1980-05-10','Agent','$2y$12$9rrEH0Rq9xPC3isoCj7dauWVk4ubeoLMZ7EE2.ns6fipXKvWh55.m'),
(12,'Emma','Harris','emma.harris@voyages.com','+44-20-7946-1202','British','1978-09-18','Agent','$2y$12$KTDruuNRXlcEtE.znxcu3.8df9L79QqEC/nOcXF9vLrHdOW1/6pM2'),
(13,'William','Clark','william.clark@globetrip.com','+1-310-555-1303','American','1982-03-22','Agent','$2y$12$osO7BnDeMpxkK20amhes/OThOvnsLjTcAOCOyq9MhZ3Ctkjzna812'),
(14,'Amelia','Lewis','amelia.lewis@luxtravel.com','+61-2-5550-1404','Australian','1975-11-07','Agent','$2y$12$Ow/dJ56TARMdIIcv.H/A7uDYsO0bIr/VNLVr1znaRVAxZprY2GyJm'),
(15,'Test', 'Agent', 'agent@gmail.com', '+27-82-555-0000', 'South African', '1990-01-01', 'Agent','$2y$12$.aG/XLsupfxnIdLO1XWYQu6iYKSPm06knqdFtCL1vnn.gM7dyU63O');

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

INSERT INTO `Agent` VALUES
(11,'TravelCo Inc.',8.50,'Senior'),
(12,'Voyages Ltd.',7.00,'Junior'),
(13,'GlobeTrip Agency',9.00,'Senior'),
(14,'Lux Travel Group',10.00,'Elite'),
(15, 'Tripistry Test Agency', 8.50, 'Senior');

INSERT INTO `Package` VALUES
(9,11,'Cape Town Coastal Escape','A scenic beach and mountain getaway in Cape Town.',18500.00,'ZAR',25,'2026-06-12','2026-06-18','Cape Town','South Africa','Active'),
(10,12,'Dubai Luxury Stopover','Luxury shopping, desert safari and skyline views.',29000.00,'ZAR',20,'2026-06-20','2026-06-26','Dubai','UAE','Active'),
(11,13,'Rome History Tour','Ancient ruins, museums and Italian cuisine.',26000.00,'ZAR',18,'2026-07-01','2026-07-08','Rome','Italy','Active'),
(12,14,'Barcelona Summer Break','Architecture, beaches and food markets.',24000.00,'ZAR',22,'2026-07-10','2026-07-17','Barcelona','Spain','Active'),
(13,11,'Bangkok Food Adventure','Street food, temples and floating markets.',21000.00,'ZAR',30,'2026-07-18','2026-07-25','Bangkok','Thailand','Active'),
(14,12,'New York City Lights','Broadway, museums and city sightseeing.',35000.00,'ZAR',16,'2026-08-01','2026-08-08','New York','USA','Active'),
(15,13,'Bali Wellness Retreat','Relaxing beaches, yoga and cultural temples.',27500.00,'ZAR',20,'2026-08-12','2026-08-19','Bali','Indonesia','Active'),
(16,14,'Istanbul Culture Trail','Markets, mosques and Bosphorus views.',23000.00,'ZAR',24,'2026-08-22','2026-08-29','Istanbul','Turkey','Active'),
(17,11,'Sydney Harbour Escape','Harbour views, beaches and city attractions.',33000.00,'ZAR',18,'2026-09-05','2026-09-12','Sydney','Australia','Active'),
(18,12,'Maldives Island Relaxation','Private beaches, snorkelling and resort living.',52000.00,'ZAR',12,'2026-09-15','2026-09-22','Male','Maldives','Active'),
(19,11,'Vienna Discovery Package','A curated travel package for Vienna with accommodation, dining and activities.',15000.00,'ZAR',12,'2026-06-05','2026-06-10','Vienna','Austria','Active'),
(20,12,'Lisbon Discovery Package','A curated travel package for Lisbon with accommodation, dining and activities.',16250.00,'ZAR',13,'2026-06-08','2026-06-14','Lisbon','Portugal','Active'),
(21,13,'Prague Discovery Package','A curated travel package for Prague with accommodation, dining and activities.',17500.00,'ZAR',14,'2026-06-11','2026-06-18','Prague','Czech Republic','Active'),
(22,14,'Amsterdam Discovery Package','A curated travel package for Amsterdam with accommodation, dining and activities.',18750.00,'ZAR',15,'2026-06-14','2026-06-22','Amsterdam','Netherlands','Active'),
(23,11,'Cairo Discovery Package','A curated travel package for Cairo with accommodation, dining and activities.',20000.00,'ZAR',16,'2026-06-17','2026-06-22','Cairo','Egypt','Active'),
(24,12,'Marrakesh Discovery Package','A curated travel package for Marrakesh with accommodation, dining and activities.',21250.00,'ZAR',17,'2026-06-20','2026-06-26','Marrakesh','Morocco','Active'),
(25,13,'Seoul Discovery Package','A curated travel package for Seoul with accommodation, dining and activities.',22500.00,'ZAR',18,'2026-06-23','2026-06-30','Seoul','South Korea','Active'),
(26,14,'Singapore Discovery Package','A curated travel package for Singapore with accommodation, dining and activities.',23750.00,'ZAR',19,'2026-06-26','2026-07-04','Singapore','Singapore','Active'),
(27,11,'Doha Discovery Package','A curated travel package for Doha with accommodation, dining and activities.',25000.00,'ZAR',20,'2026-06-29','2026-07-04','Doha','Qatar','Active'),
(28,12,'Reykjavik Discovery Package','A curated travel package for Reykjavik with accommodation, dining and activities.',26250.00,'ZAR',21,'2026-07-02','2026-07-08','Reykjavik','Iceland','Active'),
(29,13,'Edinburgh Discovery Package','A curated travel package for Edinburgh with accommodation, dining and activities.',27500.00,'ZAR',22,'2026-07-05','2026-07-12','Edinburgh','Scotland','Active'),
(30,14,'Dublin Discovery Package','A curated travel package for Dublin with accommodation, dining and activities.',28750.00,'ZAR',23,'2026-07-08','2026-07-16','Dublin','Ireland','Active'),
(31,11,'Munich Discovery Package','A curated travel package for Munich with accommodation, dining and activities.',30000.00,'ZAR',24,'2026-07-11','2026-07-16','Munich','Germany','Active'),
(32,12,'Venice Discovery Package','A curated travel package for Venice with accommodation, dining and activities.',31250.00,'ZAR',25,'2026-07-14','2026-07-20','Venice','Italy','Active'),
(33,13,'Florence Discovery Package','A curated travel package for Florence with accommodation, dining and activities.',32500.00,'ZAR',26,'2026-07-17','2026-07-24','Florence','Italy','Active'),
(34,14,'Nice Discovery Package','A curated travel package for Nice with accommodation, dining and activities.',33750.00,'ZAR',27,'2026-07-20','2026-07-28','Nice','France','Active'),
(35,11,'Queenstown Discovery Package','A curated travel package for Queenstown with accommodation, dining and activities.',35000.00,'ZAR',28,'2026-07-23','2026-07-28','Queenstown','New Zealand','Active'),
(36,12,'Auckland Discovery Package','A curated travel package for Auckland with accommodation, dining and activities.',36250.00,'ZAR',29,'2026-07-26','2026-08-01','Auckland','New Zealand','Active'),
(37,13,'Rio de Janeiro Discovery Package','A curated travel package for Rio de Janeiro with accommodation, dining and activities.',37500.00,'ZAR',30,'2026-07-29','2026-08-05','Rio de Janeiro','Brazil','Active'),
(38,14,'Buenos Aires Discovery Package','A curated travel package for Buenos Aires with accommodation, dining and activities.',38750.00,'ZAR',31,'2026-08-01','2026-08-09','Buenos Aires','Argentina','Active'),
(39,11,'Toronto Discovery Package','A curated travel package for Toronto with accommodation, dining and activities.',40000.00,'ZAR',12,'2026-08-04','2026-08-09','Toronto','Canada','Active'),
(40,12,'Vancouver Discovery Package','A curated travel package for Vancouver with accommodation, dining and activities.',41250.00,'ZAR',13,'2026-08-07','2026-08-13','Vancouver','Canada','Active'),
(41,13,'Los Angeles Discovery Package','A curated travel package for Los Angeles with accommodation, dining and activities.',42500.00,'ZAR',14,'2026-08-10','2026-08-17','Los Angeles','USA','Active'),
(42,14,'San Francisco Discovery Package','A curated travel package for San Francisco with accommodation, dining and activities.',43750.00,'ZAR',15,'2026-08-13','2026-08-21','San Francisco','USA','Active'),
(43,11,'Miami Discovery Package','A curated travel package for Miami with accommodation, dining and activities.',45000.00,'ZAR',16,'2026-08-16','2026-08-21','Miami','USA','Active'),
(44,12,'Honolulu Discovery Package','A curated travel package for Honolulu with accommodation, dining and activities.',46250.00,'ZAR',17,'2026-08-19','2026-08-25','Honolulu','USA','Active'),
(45,13,'Phuket Discovery Package','A curated travel package for Phuket with accommodation, dining and activities.',47500.00,'ZAR',18,'2026-08-22','2026-08-29','Phuket','Thailand','Active'),
(46,14,'Hanoi Discovery Package','A curated travel package for Hanoi with accommodation, dining and activities.',48750.00,'ZAR',19,'2026-08-25','2026-09-02','Hanoi','Vietnam','Active'),
(47,11,'Singapore Discovery Package','A curated travel package for Singapore with accommodation, dining and activities.',50000.00,'ZAR',20,'2026-08-28','2026-09-02','Singapore','Singapore','Active'),
(48,12,'Kuala Lumpur Discovery Package','A curated travel package for Kuala Lumpur with accommodation, dining and activities.',51250.00,'ZAR',21,'2026-08-31','2026-09-06','Kuala Lumpur','Malaysia','Active'),
(49,13,'Milan Discovery Package','A curated travel package for Milan with accommodation, dining and activities.',52500.00,'ZAR',22,'2026-09-03','2026-09-10','Milan','Italy','Active'),
(50,14,'Budapest Discovery Package','A curated travel package for Budapest with accommodation, dining and activities.',53750.00,'ZAR',23,'2026-09-06','2026-09-14','Budapest','Hungary','Active'),
(51,11,'Warsaw Discovery Package','A curated travel package for Warsaw with accommodation, dining and activities.',55000.00,'ZAR',24,'2026-09-09','2026-09-14','Warsaw','Poland','Active'),
(52,12,'Stockholm Discovery Package','A curated travel package for Stockholm with accommodation, dining and activities.',56250.00,'ZAR',25,'2026-09-12','2026-09-18','Stockholm','Sweden','Active'),
(53,13,'Oslo Discovery Package','A curated travel package for Oslo with accommodation, dining and activities.',57500.00,'ZAR',26,'2026-09-15','2026-09-22','Oslo','Norway','Active'),
(54,14,'Copenhagen Discovery Package','A curated travel package for Copenhagen with accommodation, dining and activities.',58750.00,'ZAR',27,'2026-09-18','2026-09-26','Copenhagen','Denmark','Active'),
(55,11,'Brussels Discovery Package','A curated travel package for Brussels with accommodation, dining and activities.',15000.00,'ZAR',28,'2026-09-21','2026-09-26','Brussels','Belgium','Active'),
(56,12,'Zurich Discovery Package','A curated travel package for Zurich with accommodation, dining and activities.',16250.00,'ZAR',29,'2026-09-24','2026-09-30','Zurich','Switzerland','Active'),
(57,13,'Geneva Discovery Package','A curated travel package for Geneva with accommodation, dining and activities.',17500.00,'ZAR',30,'2026-09-27','2026-10-04','Geneva','Switzerland','Active'),
(58,14,'Doha Discovery Package','A curated travel package for Doha with accommodation, dining and activities.',18750.00,'ZAR',31,'2026-09-30','2026-10-08','Doha','Qatar','Active'),
(59,11,'Abu Dhabi Discovery Package','A curated travel package for Abu Dhabi with accommodation, dining and activities.',20000.00,'ZAR',12,'2026-10-03','2026-10-08','Abu Dhabi','UAE','Active'),
(60,12,'Mauritius Discovery Package','A curated travel package for Mauritius with accommodation, dining and activities.',21250.00,'ZAR',13,'2026-10-06','2026-10-12','Mauritius','Mauritius','Active');

INSERT INTO `GroupTrip` VALUES
(9,'Cape Town Coastal Crew',9,9),
(10,'Dubai Luxury Travellers',7,10),
(11,'Rome History Group',8,11),
(12,'Barcelona Summer Squad',10,12),
(13,'Bangkok Foodies',12,13),
(14,'New York Explorers',6,14),
(15,'Bali Wellness Group',9,15),
(16,'Istanbul Culture Club',11,16),
(17,'Sydney Harbour Friends',7,17),
(18,'Maldives Island Group',5,18),
(19,'Vienna Travel Group',4,19),
(20,'Lisbon Travel Group',5,20),
(21,'Prague Travel Group',6,21),
(22,'Amsterdam Travel Group',7,22),
(23,'Cairo Travel Group',8,23),
(24,'Marrakesh Travel Group',9,24),
(25,'Seoul Travel Group',10,25),
(26,'Singapore Travel Group',11,26),
(27,'Doha Travel Group',12,27),
(28,'Reykjavik Travel Group',13,28),
(29,'Edinburgh Travel Group',14,29),
(30,'Dublin Travel Group',15,30),
(31,'Munich Travel Group',16,31),
(32,'Venice Travel Group',17,32),
(33,'Florence Travel Group',18,33),
(34,'Nice Travel Group',4,34),
(35,'Queenstown Travel Group',5,35),
(36,'Auckland Travel Group',6,36),
(37,'Rio de Janeiro Travel Group',7,37),
(38,'Buenos Aires Travel Group',8,38),
(39,'Toronto Travel Group',9,39),
(40,'Vancouver Travel Group',10,40),
(41,'Los Angeles Travel Group',11,41),
(42,'San Francisco Travel Group',12,42),
(43,'Miami Travel Group',13,43),
(44,'Honolulu Travel Group',14,44),
(45,'Phuket Travel Group',15,45),
(46,'Hanoi Travel Group',16,46),
(47,'Singapore Travel Group',17,47),
(48,'Kuala Lumpur Travel Group',18,48),
(49,'Milan Travel Group',4,49),
(50,'Budapest Travel Group',5,50),
(51,'Warsaw Travel Group',6,51),
(52,'Stockholm Travel Group',7,52),
(53,'Oslo Travel Group',8,53),
(54,'Copenhagen Travel Group',9,54),
(55,'Brussels Travel Group',10,55),
(56,'Zurich Travel Group',11,56),
(57,'Geneva Travel Group',12,57),
(58,'Doha Travel Group',13,58),
(59,'Abu Dhabi Travel Group',14,59),
(60,'Mauritius Travel Group',15,60);

INSERT INTO `PackageComponent` VALUES
(25,9,'Accommodation','Sea Point Ocean Hotel','Cape Town','South Africa','Hotel close to the beach and promenade.'),
(26,9,'Restaurant','Table Mountain Bistro','Cape Town','South Africa','Local dishes with mountain views.'),
(27,9,'Excursion','Cape Peninsula Tour','Cape Town','South Africa','Full-day guided tour around the peninsula.'),
(28,10,'Accommodation','Dubai Marina Suites','Dubai','UAE','Luxury hotel near Dubai Marina.'),
(29,10,'Restaurant','Desert Rose Dining','Dubai','UAE','Middle Eastern dining experience.'),
(30,10,'Excursion','Dubai Desert Safari','Dubai','UAE','Evening desert safari with dinner.'),
(31,11,'Accommodation','Roma Central Hotel','Rome','Italy','Hotel near the Colosseum.'),
(32,11,'Restaurant','Trattoria Antica Roma','Rome','Italy','Traditional Italian restaurant.'),
(33,11,'Excursion','Colosseum Guided Walk','Rome','Italy','Guided tour of ancient Roman landmarks.'),
(34,12,'Accommodation','Barcelona Beach Hotel','Barcelona','Spain','Beachfront hotel with city access.'),
(35,12,'Restaurant','Gaudi Tapas House','Barcelona','Spain','Spanish tapas and seafood.'),
(36,12,'Excursion','Sagrada Familia Tour','Barcelona','Spain','Tour of Gaudi architecture.'),
(37,13,'Accommodation','Bangkok Riverside Inn','Bangkok','Thailand','Hotel near the river and night markets.'),
(38,13,'Restaurant','Thai Street Kitchen','Bangkok','Thailand','Authentic Thai street food experience.'),
(39,13,'Excursion','Floating Market Visit','Bangkok','Thailand','Boat tour through floating markets.'),
(40,14,'Accommodation','Manhattan View Hotel','New York','USA','City hotel near Times Square.'),
(41,14,'Restaurant','Broadway Grill','New York','USA','American dining near theatre district.'),
(42,14,'Excursion','Statue of Liberty Tour','New York','USA','Ferry and guided landmark tour.'),
(43,15,'Accommodation','Bali Garden Resort','Bali','Indonesia','Resort with gardens and spa facilities.'),
(44,15,'Restaurant','Ubud Vegan Cafe','Bali','Indonesia','Healthy local and vegan meals.'),
(45,15,'Excursion','Ubud Temple Walk','Bali','Indonesia','Cultural walk through temples and rice fields.'),
(46,16,'Accommodation','Istanbul Heritage Hotel','Istanbul','Turkey','Hotel near historic district.'),
(47,16,'Restaurant','Bosphorus Kebab House','Istanbul','Turkey','Traditional Turkish cuisine.'),
(48,16,'Excursion','Grand Bazaar Tour','Istanbul','Turkey','Guided shopping and culture tour.'),
(49,17,'Accommodation','Sydney Harbour Hotel','Sydney','Australia','Hotel with harbour views.'),
(50,17,'Restaurant','Opera Quay Dining','Sydney','Australia','Seafood restaurant near the opera house.'),
(51,17,'Excursion','Harbour Bridge Climb','Sydney','Australia','Guided bridge climb experience.'),
(52,18,'Accommodation','Maldives Lagoon Resort','Male','Maldives','Island resort with beach villas.'),
(53,18,'Restaurant','Coral Reef Restaurant','Male','Maldives','Seafood dining near the lagoon.'),
(54,18,'Excursion','Snorkelling Reef Trip','Male','Maldives','Guided snorkelling trip.'),
(55,19,'Accommodation','Vienna Central Hotel','Vienna','Austria','Comfortable accommodation close to main attractions.'),
(56,19,'Restaurant','Vienna Local Kitchen','Vienna','Austria','Popular restaurant offering local cuisine.'),
(57,19,'Excursion','Vienna Highlights Tour','Vienna','Austria','Guided sightseeing excursion around major attractions.'),
(58,20,'Accommodation','Lisbon Central Hotel','Lisbon','Portugal','Comfortable accommodation close to main attractions.'),
(59,20,'Restaurant','Lisbon Local Kitchen','Lisbon','Portugal','Popular restaurant offering local cuisine.'),
(60,20,'Excursion','Lisbon Highlights Tour','Lisbon','Portugal','Guided sightseeing excursion around major attractions.'),
(61,21,'Accommodation','Prague Central Hotel','Prague','Czech Republic','Comfortable accommodation close to main attractions.'),
(62,21,'Restaurant','Prague Local Kitchen','Prague','Czech Republic','Popular restaurant offering local cuisine.'),
(63,21,'Excursion','Prague Highlights Tour','Prague','Czech Republic','Guided sightseeing excursion around major attractions.'),
(64,22,'Accommodation','Amsterdam Central Hotel','Amsterdam','Netherlands','Comfortable accommodation close to main attractions.'),
(65,22,'Restaurant','Amsterdam Local Kitchen','Amsterdam','Netherlands','Popular restaurant offering local cuisine.'),
(66,22,'Excursion','Amsterdam Highlights Tour','Amsterdam','Netherlands','Guided sightseeing excursion around major attractions.'),
(67,23,'Accommodation','Cairo Central Hotel','Cairo','Egypt','Comfortable accommodation close to main attractions.'),
(68,23,'Restaurant','Cairo Local Kitchen','Cairo','Egypt','Popular restaurant offering local cuisine.'),
(69,23,'Excursion','Cairo Highlights Tour','Cairo','Egypt','Guided sightseeing excursion around major attractions.'),
(70,24,'Accommodation','Marrakesh Central Hotel','Marrakesh','Morocco','Comfortable accommodation close to main attractions.'),
(71,24,'Restaurant','Marrakesh Local Kitchen','Marrakesh','Morocco','Popular restaurant offering local cuisine.'),
(72,24,'Excursion','Marrakesh Highlights Tour','Marrakesh','Morocco','Guided sightseeing excursion around major attractions.'),
(73,25,'Accommodation','Seoul Central Hotel','Seoul','South Korea','Comfortable accommodation close to main attractions.'),
(74,25,'Restaurant','Seoul Local Kitchen','Seoul','South Korea','Popular restaurant offering local cuisine.'),
(75,25,'Excursion','Seoul Highlights Tour','Seoul','South Korea','Guided sightseeing excursion around major attractions.'),
(76,26,'Accommodation','Singapore Central Hotel','Singapore','Singapore','Comfortable accommodation close to main attractions.'),
(77,26,'Restaurant','Singapore Local Kitchen','Singapore','Singapore','Popular restaurant offering local cuisine.'),
(78,26,'Excursion','Singapore Highlights Tour','Singapore','Singapore','Guided sightseeing excursion around major attractions.'),
(79,27,'Accommodation','Doha Central Hotel','Doha','Qatar','Comfortable accommodation close to main attractions.'),
(80,27,'Restaurant','Doha Local Kitchen','Doha','Qatar','Popular restaurant offering local cuisine.'),
(81,27,'Excursion','Doha Highlights Tour','Doha','Qatar','Guided sightseeing excursion around major attractions.'),
(82,28,'Accommodation','Reykjavik Central Hotel','Reykjavik','Iceland','Comfortable accommodation close to main attractions.'),
(83,28,'Restaurant','Reykjavik Local Kitchen','Reykjavik','Iceland','Popular restaurant offering local cuisine.'),
(84,28,'Excursion','Reykjavik Highlights Tour','Reykjavik','Iceland','Guided sightseeing excursion around major attractions.'),
(85,29,'Accommodation','Edinburgh Central Hotel','Edinburgh','Scotland','Comfortable accommodation close to main attractions.'),
(86,29,'Restaurant','Edinburgh Local Kitchen','Edinburgh','Scotland','Popular restaurant offering local cuisine.'),
(87,29,'Excursion','Edinburgh Highlights Tour','Edinburgh','Scotland','Guided sightseeing excursion around major attractions.'),
(88,30,'Accommodation','Dublin Central Hotel','Dublin','Ireland','Comfortable accommodation close to main attractions.'),
(89,30,'Restaurant','Dublin Local Kitchen','Dublin','Ireland','Popular restaurant offering local cuisine.'),
(90,30,'Excursion','Dublin Highlights Tour','Dublin','Ireland','Guided sightseeing excursion around major attractions.'),
(91,31,'Accommodation','Munich Central Hotel','Munich','Germany','Comfortable accommodation close to main attractions.'),
(92,31,'Restaurant','Munich Local Kitchen','Munich','Germany','Popular restaurant offering local cuisine.'),
(93,31,'Excursion','Munich Highlights Tour','Munich','Germany','Guided sightseeing excursion around major attractions.'),
(94,32,'Accommodation','Venice Central Hotel','Venice','Italy','Comfortable accommodation close to main attractions.'),
(95,32,'Restaurant','Venice Local Kitchen','Venice','Italy','Popular restaurant offering local cuisine.'),
(96,32,'Excursion','Venice Highlights Tour','Venice','Italy','Guided sightseeing excursion around major attractions.'),
(97,33,'Accommodation','Florence Central Hotel','Florence','Italy','Comfortable accommodation close to main attractions.'),
(98,33,'Restaurant','Florence Local Kitchen','Florence','Italy','Popular restaurant offering local cuisine.'),
(99,33,'Excursion','Florence Highlights Tour','Florence','Italy','Guided sightseeing excursion around major attractions.'),
(100,34,'Accommodation','Nice Central Hotel','Nice','France','Comfortable accommodation close to main attractions.'),
(101,34,'Restaurant','Nice Local Kitchen','Nice','France','Popular restaurant offering local cuisine.'),
(102,34,'Excursion','Nice Highlights Tour','Nice','France','Guided sightseeing excursion around major attractions.'),
(103,35,'Accommodation','Queenstown Central Hotel','Queenstown','New Zealand','Comfortable accommodation close to main attractions.'),
(104,35,'Restaurant','Queenstown Local Kitchen','Queenstown','New Zealand','Popular restaurant offering local cuisine.'),
(105,35,'Excursion','Queenstown Highlights Tour','Queenstown','New Zealand','Guided sightseeing excursion around major attractions.'),
(106,36,'Accommodation','Auckland Central Hotel','Auckland','New Zealand','Comfortable accommodation close to main attractions.'),
(107,36,'Restaurant','Auckland Local Kitchen','Auckland','New Zealand','Popular restaurant offering local cuisine.'),
(108,36,'Excursion','Auckland Highlights Tour','Auckland','New Zealand','Guided sightseeing excursion around major attractions.'),
(109,37,'Accommodation','Rio de Janeiro Central Hotel','Rio de Janeiro','Brazil','Comfortable accommodation close to main attractions.'),
(110,37,'Restaurant','Rio de Janeiro Local Kitchen','Rio de Janeiro','Brazil','Popular restaurant offering local cuisine.'),
(111,37,'Excursion','Rio de Janeiro Highlights Tour','Rio de Janeiro','Brazil','Guided sightseeing excursion around major attractions.'),
(112,38,'Accommodation','Buenos Aires Central Hotel','Buenos Aires','Argentina','Comfortable accommodation close to main attractions.'),
(113,38,'Restaurant','Buenos Aires Local Kitchen','Buenos Aires','Argentina','Popular restaurant offering local cuisine.'),
(114,38,'Excursion','Buenos Aires Highlights Tour','Buenos Aires','Argentina','Guided sightseeing excursion around major attractions.'),
(115,39,'Accommodation','Toronto Central Hotel','Toronto','Canada','Comfortable accommodation close to main attractions.'),
(116,39,'Restaurant','Toronto Local Kitchen','Toronto','Canada','Popular restaurant offering local cuisine.'),
(117,39,'Excursion','Toronto Highlights Tour','Toronto','Canada','Guided sightseeing excursion around major attractions.'),
(118,40,'Accommodation','Vancouver Central Hotel','Vancouver','Canada','Comfortable accommodation close to main attractions.'),
(119,40,'Restaurant','Vancouver Local Kitchen','Vancouver','Canada','Popular restaurant offering local cuisine.'),
(120,40,'Excursion','Vancouver Highlights Tour','Vancouver','Canada','Guided sightseeing excursion around major attractions.'),
(121,41,'Accommodation','Los Angeles Central Hotel','Los Angeles','USA','Comfortable accommodation close to main attractions.'),
(122,41,'Restaurant','Los Angeles Local Kitchen','Los Angeles','USA','Popular restaurant offering local cuisine.'),
(123,41,'Excursion','Los Angeles Highlights Tour','Los Angeles','USA','Guided sightseeing excursion around major attractions.'),
(124,42,'Accommodation','San Francisco Central Hotel','San Francisco','USA','Comfortable accommodation close to main attractions.'),
(125,42,'Restaurant','San Francisco Local Kitchen','San Francisco','USA','Popular restaurant offering local cuisine.'),
(126,42,'Excursion','San Francisco Highlights Tour','San Francisco','USA','Guided sightseeing excursion around major attractions.'),
(127,43,'Accommodation','Miami Central Hotel','Miami','USA','Comfortable accommodation close to main attractions.'),
(128,43,'Restaurant','Miami Local Kitchen','Miami','USA','Popular restaurant offering local cuisine.'),
(129,43,'Excursion','Miami Highlights Tour','Miami','USA','Guided sightseeing excursion around major attractions.'),
(130,44,'Accommodation','Honolulu Central Hotel','Honolulu','USA','Comfortable accommodation close to main attractions.'),
(131,44,'Restaurant','Honolulu Local Kitchen','Honolulu','USA','Popular restaurant offering local cuisine.'),
(132,44,'Excursion','Honolulu Highlights Tour','Honolulu','USA','Guided sightseeing excursion around major attractions.'),
(133,45,'Accommodation','Phuket Central Hotel','Phuket','Thailand','Comfortable accommodation close to main attractions.'),
(134,45,'Restaurant','Phuket Local Kitchen','Phuket','Thailand','Popular restaurant offering local cuisine.'),
(135,45,'Excursion','Phuket Highlights Tour','Phuket','Thailand','Guided sightseeing excursion around major attractions.'),
(136,46,'Accommodation','Hanoi Central Hotel','Hanoi','Vietnam','Comfortable accommodation close to main attractions.'),
(137,46,'Restaurant','Hanoi Local Kitchen','Hanoi','Vietnam','Popular restaurant offering local cuisine.'),
(138,46,'Excursion','Hanoi Highlights Tour','Hanoi','Vietnam','Guided sightseeing excursion around major attractions.'),
(139,47,'Accommodation','Singapore Central Hotel','Singapore','Singapore','Comfortable accommodation close to main attractions.'),
(140,47,'Restaurant','Singapore Local Kitchen','Singapore','Singapore','Popular restaurant offering local cuisine.'),
(141,47,'Excursion','Singapore Highlights Tour','Singapore','Singapore','Guided sightseeing excursion around major attractions.'),
(142,48,'Accommodation','Kuala Lumpur Central Hotel','Kuala Lumpur','Malaysia','Comfortable accommodation close to main attractions.'),
(143,48,'Restaurant','Kuala Lumpur Local Kitchen','Kuala Lumpur','Malaysia','Popular restaurant offering local cuisine.'),
(144,48,'Excursion','Kuala Lumpur Highlights Tour','Kuala Lumpur','Malaysia','Guided sightseeing excursion around major attractions.'),
(145,49,'Accommodation','Milan Central Hotel','Milan','Italy','Comfortable accommodation close to main attractions.'),
(146,49,'Restaurant','Milan Local Kitchen','Milan','Italy','Popular restaurant offering local cuisine.'),
(147,49,'Excursion','Milan Highlights Tour','Milan','Italy','Guided sightseeing excursion around major attractions.'),
(148,50,'Accommodation','Budapest Central Hotel','Budapest','Hungary','Comfortable accommodation close to main attractions.'),
(149,50,'Restaurant','Budapest Local Kitchen','Budapest','Hungary','Popular restaurant offering local cuisine.'),
(150,50,'Excursion','Budapest Highlights Tour','Budapest','Hungary','Guided sightseeing excursion around major attractions.'),
(151,51,'Accommodation','Warsaw Central Hotel','Warsaw','Poland','Comfortable accommodation close to main attractions.'),
(152,51,'Restaurant','Warsaw Local Kitchen','Warsaw','Poland','Popular restaurant offering local cuisine.'),
(153,51,'Excursion','Warsaw Highlights Tour','Warsaw','Poland','Guided sightseeing excursion around major attractions.'),
(154,52,'Accommodation','Stockholm Central Hotel','Stockholm','Sweden','Comfortable accommodation close to main attractions.'),
(155,52,'Restaurant','Stockholm Local Kitchen','Stockholm','Sweden','Popular restaurant offering local cuisine.'),
(156,52,'Excursion','Stockholm Highlights Tour','Stockholm','Sweden','Guided sightseeing excursion around major attractions.'),
(157,53,'Accommodation','Oslo Central Hotel','Oslo','Norway','Comfortable accommodation close to main attractions.'),
(158,53,'Restaurant','Oslo Local Kitchen','Oslo','Norway','Popular restaurant offering local cuisine.'),
(159,53,'Excursion','Oslo Highlights Tour','Oslo','Norway','Guided sightseeing excursion around major attractions.'),
(160,54,'Accommodation','Copenhagen Central Hotel','Copenhagen','Denmark','Comfortable accommodation close to main attractions.'),
(161,54,'Restaurant','Copenhagen Local Kitchen','Copenhagen','Denmark','Popular restaurant offering local cuisine.'),
(162,54,'Excursion','Copenhagen Highlights Tour','Copenhagen','Denmark','Guided sightseeing excursion around major attractions.'),
(163,55,'Accommodation','Brussels Central Hotel','Brussels','Belgium','Comfortable accommodation close to main attractions.'),
(164,55,'Restaurant','Brussels Local Kitchen','Brussels','Belgium','Popular restaurant offering local cuisine.'),
(165,55,'Excursion','Brussels Highlights Tour','Brussels','Belgium','Guided sightseeing excursion around major attractions.'),
(166,56,'Accommodation','Zurich Central Hotel','Zurich','Switzerland','Comfortable accommodation close to main attractions.'),
(167,56,'Restaurant','Zurich Local Kitchen','Zurich','Switzerland','Popular restaurant offering local cuisine.'),
(168,56,'Excursion','Zurich Highlights Tour','Zurich','Switzerland','Guided sightseeing excursion around major attractions.'),
(169,57,'Accommodation','Geneva Central Hotel','Geneva','Switzerland','Comfortable accommodation close to main attractions.'),
(170,57,'Restaurant','Geneva Local Kitchen','Geneva','Switzerland','Popular restaurant offering local cuisine.'),
(171,57,'Excursion','Geneva Highlights Tour','Geneva','Switzerland','Guided sightseeing excursion around major attractions.'),
(172,58,'Accommodation','Doha Central Hotel','Doha','Qatar','Comfortable accommodation close to main attractions.'),
(173,58,'Restaurant','Doha Local Kitchen','Doha','Qatar','Popular restaurant offering local cuisine.'),
(174,58,'Excursion','Doha Highlights Tour','Doha','Qatar','Guided sightseeing excursion around major attractions.'),
(175,59,'Accommodation','Abu Dhabi Central Hotel','Abu Dhabi','UAE','Comfortable accommodation close to main attractions.'),
(176,59,'Restaurant','Abu Dhabi Local Kitchen','Abu Dhabi','UAE','Popular restaurant offering local cuisine.'),
(177,59,'Excursion','Abu Dhabi Highlights Tour','Abu Dhabi','UAE','Guided sightseeing excursion around major attractions.'),
(178,60,'Accommodation','Mauritius Central Hotel','Mauritius','Mauritius','Comfortable accommodation close to main attractions.'),
(179,60,'Restaurant','Mauritius Local Kitchen','Mauritius','Mauritius','Popular restaurant offering local cuisine.'),
(180,60,'Excursion','Mauritius Highlights Tour','Mauritius','Mauritius','Guided sightseeing excursion around major attractions.');

INSERT INTO `Accommodation` VALUES
(25,'Hotel',4,'Beach Road, Sea Point','WiFi, Pool, Breakfast, Ocean View'),
(28,'Hotel',5,'Dubai Marina Walk','WiFi, Spa, Gym, Rooftop Pool'),
(31,'Hotel',4,'Via Roma Centrale','WiFi, Breakfast, City View'),
(34,'Hotel',4,'Barcelona Beachfront Avenue','WiFi, Pool, Beach Access'),
(37,'Inn',3,'Riverside Road, Bangkok','WiFi, Breakfast, Market Access'),
(40,'Hotel',4,'Times Square, Manhattan','WiFi, Gym, City View'),
(43,'Resort',5,'Ubud Garden Road','Spa, Pool, Yoga, WiFi'),
(46,'Hotel',4,'Sultanahmet District','WiFi, Breakfast, Rooftop View'),
(49,'Hotel',4,'Harbour Street, Sydney','WiFi, Harbour View, Breakfast'),
(52,'Resort',5,'Lagoon Island, Male','Beach Access, Spa, Snorkelling, WiFi'),
(55,'Hotel',4,'19 Central Avenue, Vienna','WiFi, Breakfast, Pool, Parking'),
(58,'Hotel',5,'20 Central Avenue, Lisbon','WiFi, Breakfast, Pool, Parking'),
(61,'Hotel',3,'21 Central Avenue, Prague','WiFi, Breakfast, Pool, Parking'),
(64,'Hotel',4,'22 Central Avenue, Amsterdam','WiFi, Breakfast, Pool, Parking'),
(67,'Hotel',5,'23 Central Avenue, Cairo','WiFi, Breakfast, Pool, Parking'),
(70,'Hotel',3,'24 Central Avenue, Marrakesh','WiFi, Breakfast, Pool, Parking'),
(73,'Hotel',4,'25 Central Avenue, Seoul','WiFi, Breakfast, Pool, Parking'),
(76,'Hotel',5,'26 Central Avenue, Singapore','WiFi, Breakfast, Pool, Parking'),
(79,'Hotel',3,'27 Central Avenue, Doha','WiFi, Breakfast, Pool, Parking'),
(82,'Hotel',4,'28 Central Avenue, Reykjavik','WiFi, Breakfast, Pool, Parking'),
(85,'Hotel',5,'29 Central Avenue, Edinburgh','WiFi, Breakfast, Pool, Parking'),
(88,'Hotel',3,'30 Central Avenue, Dublin','WiFi, Breakfast, Pool, Parking'),
(91,'Hotel',4,'31 Central Avenue, Munich','WiFi, Breakfast, Pool, Parking'),
(94,'Hotel',5,'32 Central Avenue, Venice','WiFi, Breakfast, Pool, Parking'),
(97,'Hotel',3,'33 Central Avenue, Florence','WiFi, Breakfast, Pool, Parking'),
(100,'Hotel',4,'34 Central Avenue, Nice','WiFi, Breakfast, Pool, Parking'),
(103,'Hotel',5,'35 Central Avenue, Queenstown','WiFi, Breakfast, Pool, Parking'),
(106,'Hotel',3,'36 Central Avenue, Auckland','WiFi, Breakfast, Pool, Parking'),
(109,'Hotel',4,'37 Central Avenue, Rio de Janeiro','WiFi, Breakfast, Pool, Parking'),
(112,'Hotel',5,'38 Central Avenue, Buenos Aires','WiFi, Breakfast, Pool, Parking'),
(115,'Hotel',3,'39 Central Avenue, Toronto','WiFi, Breakfast, Pool, Parking'),
(118,'Hotel',4,'40 Central Avenue, Vancouver','WiFi, Breakfast, Pool, Parking'),
(121,'Hotel',5,'41 Central Avenue, Los Angeles','WiFi, Breakfast, Pool, Parking'),
(124,'Hotel',3,'42 Central Avenue, San Francisco','WiFi, Breakfast, Pool, Parking'),
(127,'Hotel',4,'43 Central Avenue, Miami','WiFi, Breakfast, Pool, Parking'),
(130,'Hotel',5,'44 Central Avenue, Honolulu','WiFi, Breakfast, Pool, Parking'),
(133,'Hotel',3,'45 Central Avenue, Phuket','WiFi, Breakfast, Pool, Parking'),
(136,'Hotel',4,'46 Central Avenue, Hanoi','WiFi, Breakfast, Pool, Parking'),
(139,'Hotel',5,'47 Central Avenue, Singapore','WiFi, Breakfast, Pool, Parking'),
(142,'Hotel',3,'48 Central Avenue, Kuala Lumpur','WiFi, Breakfast, Pool, Parking'),
(145,'Hotel',4,'49 Central Avenue, Milan','WiFi, Breakfast, Pool, Parking'),
(148,'Hotel',5,'50 Central Avenue, Budapest','WiFi, Breakfast, Pool, Parking'),
(151,'Hotel',3,'51 Central Avenue, Warsaw','WiFi, Breakfast, Pool, Parking'),
(154,'Hotel',4,'52 Central Avenue, Stockholm','WiFi, Breakfast, Pool, Parking'),
(157,'Hotel',5,'53 Central Avenue, Oslo','WiFi, Breakfast, Pool, Parking'),
(160,'Hotel',3,'54 Central Avenue, Copenhagen','WiFi, Breakfast, Pool, Parking'),
(163,'Hotel',4,'55 Central Avenue, Brussels','WiFi, Breakfast, Pool, Parking'),
(166,'Hotel',5,'56 Central Avenue, Zurich','WiFi, Breakfast, Pool, Parking'),
(169,'Hotel',3,'57 Central Avenue, Geneva','WiFi, Breakfast, Pool, Parking'),
(172,'Hotel',4,'58 Central Avenue, Doha','WiFi, Breakfast, Pool, Parking'),
(175,'Hotel',5,'59 Central Avenue, Abu Dhabi','WiFi, Breakfast, Pool, Parking'),
(178,'Hotel',3,'60 Central Avenue, Mauritius','WiFi, Breakfast, Pool, Parking');

INSERT INTO `Restaurant` VALUES
(26,'South African','Mid-range','Table Mountain Road'),
(29,'Middle Eastern','High-end','Dubai Marina Boulevard'),
(32,'Italian','Mid-range','Colosseum Street'),
(35,'Spanish Tapas','Mid-range','Gaudi Avenue'),
(38,'Thai','Budget','Night Market Lane'),
(41,'American','High-end','Broadway Street'),
(44,'Vegan','Mid-range','Ubud Central Road'),
(47,'Turkish','Mid-range','Bosphorus Avenue'),
(50,'Seafood','High-end','Opera Quay'),
(53,'Seafood','Luxury','Lagoon Beachfront'),
(56,'Local Cuisine','Budget','19 Food Street, Vienna'),
(59,'Local Cuisine','Mid-range','20 Food Street, Lisbon'),
(62,'Local Cuisine','High-end','21 Food Street, Prague'),
(65,'Local Cuisine','Luxury','22 Food Street, Amsterdam'),
(68,'Local Cuisine','Budget','23 Food Street, Cairo'),
(71,'Local Cuisine','Mid-range','24 Food Street, Marrakesh'),
(74,'Local Cuisine','High-end','25 Food Street, Seoul'),
(77,'Local Cuisine','Luxury','26 Food Street, Singapore'),
(80,'Local Cuisine','Budget','27 Food Street, Doha'),
(83,'Local Cuisine','Mid-range','28 Food Street, Reykjavik'),
(86,'Local Cuisine','High-end','29 Food Street, Edinburgh'),
(89,'Local Cuisine','Luxury','30 Food Street, Dublin'),
(92,'Local Cuisine','Budget','31 Food Street, Munich'),
(95,'Local Cuisine','Mid-range','32 Food Street, Venice'),
(98,'Local Cuisine','High-end','33 Food Street, Florence'),
(101,'Local Cuisine','Luxury','34 Food Street, Nice'),
(104,'Local Cuisine','Budget','35 Food Street, Queenstown'),
(107,'Local Cuisine','Mid-range','36 Food Street, Auckland'),
(110,'Local Cuisine','High-end','37 Food Street, Rio de Janeiro'),
(113,'Local Cuisine','Luxury','38 Food Street, Buenos Aires'),
(116,'Local Cuisine','Budget','39 Food Street, Toronto'),
(119,'Local Cuisine','Mid-range','40 Food Street, Vancouver'),
(122,'Local Cuisine','High-end','41 Food Street, Los Angeles'),
(125,'Local Cuisine','Luxury','42 Food Street, San Francisco'),
(128,'Local Cuisine','Budget','43 Food Street, Miami'),
(131,'Local Cuisine','Mid-range','44 Food Street, Honolulu'),
(134,'Local Cuisine','High-end','45 Food Street, Phuket'),
(137,'Local Cuisine','Luxury','46 Food Street, Hanoi'),
(140,'Local Cuisine','Budget','47 Food Street, Singapore'),
(143,'Local Cuisine','Mid-range','48 Food Street, Kuala Lumpur'),
(146,'Local Cuisine','High-end','49 Food Street, Milan'),
(149,'Local Cuisine','Luxury','50 Food Street, Budapest'),
(152,'Local Cuisine','Budget','51 Food Street, Warsaw'),
(155,'Local Cuisine','Mid-range','52 Food Street, Stockholm'),
(158,'Local Cuisine','High-end','53 Food Street, Oslo'),
(161,'Local Cuisine','Luxury','54 Food Street, Copenhagen'),
(164,'Local Cuisine','Budget','55 Food Street, Brussels'),
(167,'Local Cuisine','Mid-range','56 Food Street, Zurich'),
(170,'Local Cuisine','High-end','57 Food Street, Geneva'),
(173,'Local Cuisine','Luxury','58 Food Street, Doha'),
(176,'Local Cuisine','Budget','59 Food Street, Abu Dhabi'),
(179,'Local Cuisine','Mid-range','60 Food Street, Mauritius');

INSERT INTO `Excursion` VALUES
(27,'Full day','Easy','V&A Waterfront',20),
(30,'6 hours','Moderate','Dubai Hotel Lobby',18),
(33,'4 hours','Easy','Colosseum Entrance',25),
(36,'3 hours','Easy','Sagrada Familia Main Gate',20),
(39,'Half day','Easy','Bangkok Pier',15),
(42,'5 hours','Easy','Battery Park Ferry Terminal',25),
(45,'4 hours','Moderate','Ubud Palace',16),
(48,'3 hours','Easy','Grand Bazaar Gate',20),
(51,'3 hours','Challenging','Bridge Climb Office',12),
(54,'Half day','Easy','Resort Jetty',14),
(57,'2 hours','Easy','Main Square, Vienna',12),
(60,'4 hours','Moderate','Main Square, Lisbon',13),
(63,'Half day','Challenging','Main Square, Prague',14),
(66,'Full day','Easy','Main Square, Amsterdam',15),
(69,'2 hours','Moderate','Main Square, Cairo',16),
(72,'4 hours','Challenging','Main Square, Marrakesh',17),
(75,'Half day','Easy','Main Square, Seoul',18),
(78,'Full day','Moderate','Main Square, Singapore',19),
(81,'2 hours','Challenging','Main Square, Doha',20),
(84,'4 hours','Easy','Main Square, Reykjavik',21),
(87,'Half day','Moderate','Main Square, Edinburgh',22),
(90,'Full day','Challenging','Main Square, Dublin',23),
(93,'2 hours','Easy','Main Square, Munich',24),
(96,'4 hours','Moderate','Main Square, Venice',25),
(99,'Half day','Challenging','Main Square, Florence',12),
(102,'Full day','Easy','Main Square, Nice',13),
(105,'2 hours','Moderate','Main Square, Queenstown',14),
(108,'4 hours','Challenging','Main Square, Auckland',15),
(111,'Half day','Easy','Main Square, Rio de Janeiro',16),
(114,'Full day','Moderate','Main Square, Buenos Aires',17),
(117,'2 hours','Challenging','Main Square, Toronto',18),
(120,'4 hours','Easy','Main Square, Vancouver',19),
(123,'Half day','Moderate','Main Square, Los Angeles',20),
(126,'Full day','Challenging','Main Square, San Francisco',21),
(129,'2 hours','Easy','Main Square, Miami',22),
(132,'4 hours','Moderate','Main Square, Honolulu',23),
(135,'Half day','Challenging','Main Square, Phuket',24),
(138,'Full day','Easy','Main Square, Hanoi',25),
(141,'2 hours','Moderate','Main Square, Singapore',12),
(144,'4 hours','Challenging','Main Square, Kuala Lumpur',13),
(147,'Half day','Easy','Main Square, Milan',14),
(150,'Full day','Moderate','Main Square, Budapest',15),
(153,'2 hours','Challenging','Main Square, Warsaw',16),
(156,'4 hours','Easy','Main Square, Stockholm',17),
(159,'Half day','Moderate','Main Square, Oslo',18),
(162,'Full day','Challenging','Main Square, Copenhagen',19),
(165,'2 hours','Easy','Main Square, Brussels',20),
(168,'4 hours','Moderate','Main Square, Zurich',21),
(171,'Half day','Challenging','Main Square, Geneva',22),
(174,'Full day','Easy','Main Square, Doha',23),
(177,'2 hours','Moderate','Main Square, Abu Dhabi',24),
(180,'4 hours','Challenging','Main Square, Mauritius',25);

INSERT INTO `Booking` VALUES
(9,9,11,9,9,2,37000.00,'Confirmed','2026-05-10 09:00:00'),
(10,10,12,10,10,1,29000.00,'Pending','2026-05-11 10:15:00'),
(11,1,13,11,11,2,52000.00,'Confirmed','2026-05-12 11:30:00'),
(12,2,14,12,12,3,72000.00,'Confirmed','2026-05-13 12:45:00'),
(13,3,11,13,13,1,21000.00,'Pending','2026-05-14 14:00:00'),
(14,4,12,14,14,2,70000.00,'Confirmed','2026-05-15 15:15:00'),
(15,5,13,15,15,1,27500.00,'Confirmed','2026-05-16 16:30:00'),
(16,6,14,16,16,2,46000.00,'Pending','2026-05-17 17:45:00'),
(17,7,11,17,17,1,33000.00,'Confirmed','2026-05-18 18:00:00'),
(18,8,12,18,18,2,104000.00,'Confirmed','2026-05-19 19:15:00'),
(19,1,11,19,19,1,15000.00,'Confirmed','2026-05-01 09:00:00'),
(20,2,12,20,20,2,32500.00,'Pending','2026-05-02 10:00:00'),
(21,3,13,21,21,3,52500.00,'Confirmed','2026-05-03 11:00:00'),
(22,4,14,22,22,4,75000.00,'Confirmed','2026-05-04 12:00:00'),
(23,5,11,23,23,1,20000.00,'Confirmed','2026-05-05 13:00:00'),
(24,6,12,24,24,2,42500.00,'Pending','2026-05-06 14:00:00'),
(25,7,13,25,25,3,67500.00,'Confirmed','2026-05-07 15:00:00'),
(26,8,14,26,26,4,95000.00,'Confirmed','2026-05-08 16:00:00'),
(27,9,11,27,27,1,25000.00,'Confirmed','2026-05-09 17:00:00'),
(28,10,12,28,28,2,52500.00,'Pending','2026-05-10 18:00:00'),
(29,1,13,29,29,3,82500.00,'Confirmed','2026-05-11 09:00:00'),
(30,2,14,30,30,4,115000.00,'Confirmed','2026-05-12 10:00:00'),
(31,3,11,31,31,1,30000.00,'Confirmed','2026-05-13 11:00:00'),
(32,4,12,32,32,2,62500.00,'Pending','2026-05-14 12:00:00'),
(33,5,13,33,33,3,97500.00,'Confirmed','2026-05-15 13:00:00'),
(34,6,14,34,34,4,135000.00,'Confirmed','2026-05-16 14:00:00'),
(35,7,11,35,35,1,35000.00,'Confirmed','2026-05-17 15:00:00'),
(36,8,12,36,36,2,72500.00,'Pending','2026-05-18 16:00:00'),
(37,9,13,37,37,3,112500.00,'Confirmed','2026-05-19 17:00:00'),
(38,10,14,38,38,4,155000.00,'Confirmed','2026-05-20 18:00:00'),
(39,1,11,39,39,1,40000.00,'Confirmed','2026-05-21 09:00:00'),
(40,2,12,40,40,2,82500.00,'Pending','2026-05-22 10:00:00'),
(41,3,13,41,41,3,127500.00,'Confirmed','2026-05-23 11:00:00'),
(42,4,14,42,42,4,175000.00,'Confirmed','2026-05-24 12:00:00'),
(43,5,11,43,43,1,45000.00,'Confirmed','2026-05-25 13:00:00'),
(44,6,12,44,44,2,92500.00,'Pending','2026-05-26 14:00:00'),
(45,7,13,45,45,3,142500.00,'Confirmed','2026-05-27 15:00:00'),
(46,8,14,46,46,4,195000.00,'Confirmed','2026-05-28 16:00:00'),
(47,9,11,47,47,1,50000.00,'Confirmed','2026-05-29 17:00:00'),
(48,10,12,48,48,2,102500.00,'Pending','2026-05-30 18:00:00'),
(49,1,13,49,49,3,157500.00,'Confirmed','2026-05-31 09:00:00'),
(50,2,14,50,50,4,215000.00,'Confirmed','2026-06-01 10:00:00'),
(51,3,11,51,51,1,55000.00,'Confirmed','2026-06-02 11:00:00'),
(52,4,12,52,52,2,112500.00,'Pending','2026-06-03 12:00:00'),
(53,5,13,53,53,3,172500.00,'Confirmed','2026-06-04 13:00:00'),
(54,6,14,54,54,4,235000.00,'Confirmed','2026-06-05 14:00:00'),
(55,7,11,55,55,1,15000.00,'Confirmed','2026-06-06 15:00:00'),
(56,8,12,56,56,2,32500.00,'Pending','2026-06-07 16:00:00'),
(57,9,13,57,57,3,52500.00,'Confirmed','2026-06-08 17:00:00'),
(58,10,14,58,58,4,75000.00,'Confirmed','2026-06-09 18:00:00'),
(59,1,11,59,59,1,20000.00,'Confirmed','2026-06-10 09:00:00'),
(60,2,12,60,60,2,42500.00,'Pending','2026-06-11 10:00:00');

INSERT INTO `GroupMembership` VALUES
(9,9,9,'Leader','2026-05-10 09:30:00','Paid'),
(10,10,10,'Member','2026-05-11 10:45:00','Pending'),
(11,1,11,'Member','2026-05-12 12:00:00','Paid'),
(12,2,12,'Leader','2026-05-13 13:15:00','Paid'),
(13,3,13,'Member','2026-05-14 14:30:00','Pending'),
(14,4,14,'Leader','2026-05-15 15:45:00','Paid'),
(15,5,15,'Member','2026-05-16 17:00:00','Paid'),
(16,6,16,'Member','2026-05-17 18:15:00','Pending'),
(17,7,17,'Leader','2026-05-18 18:30:00','Paid'),
(18,8,18,'Member','2026-05-19 19:45:00','Paid'),
(19,1,19,'Leader','2026-05-01 09:00:00','Paid'),
(20,2,20,'Member','2026-05-02 10:00:00','Pending'),
(21,3,21,'Leader','2026-05-03 11:00:00','Paid'),
(22,4,22,'Member','2026-05-04 12:00:00','Paid'),
(23,5,23,'Leader','2026-05-05 13:00:00','Paid'),
(24,6,24,'Member','2026-05-06 14:00:00','Pending'),
(25,7,25,'Leader','2026-05-07 15:00:00','Paid'),
(26,8,26,'Member','2026-05-08 16:00:00','Paid'),
(27,9,27,'Leader','2026-05-09 17:00:00','Paid'),
(28,10,28,'Member','2026-05-10 18:00:00','Pending'),
(29,1,29,'Leader','2026-05-11 09:00:00','Paid'),
(30,2,30,'Member','2026-05-12 10:00:00','Paid'),
(31,3,31,'Leader','2026-05-13 11:00:00','Paid'),
(32,4,32,'Member','2026-05-14 12:00:00','Pending'),
(33,5,33,'Leader','2026-05-15 13:00:00','Paid'),
(34,6,34,'Member','2026-05-16 14:00:00','Paid'),
(35,7,35,'Leader','2026-05-17 15:00:00','Paid'),
(36,8,36,'Member','2026-05-18 16:00:00','Pending'),
(37,9,37,'Leader','2026-05-19 17:00:00','Paid'),
(38,10,38,'Member','2026-05-20 18:00:00','Paid'),
(39,1,39,'Leader','2026-05-21 09:00:00','Paid'),
(40,2,40,'Member','2026-05-22 10:00:00','Pending'),
(41,3,41,'Leader','2026-05-23 11:00:00','Paid'),
(42,4,42,'Member','2026-05-24 12:00:00','Paid'),
(43,5,43,'Leader','2026-05-25 13:00:00','Paid'),
(44,6,44,'Member','2026-05-26 14:00:00','Pending'),
(45,7,45,'Leader','2026-05-27 15:00:00','Paid'),
(46,8,46,'Member','2026-05-28 16:00:00','Paid'),
(47,9,47,'Leader','2026-05-29 17:00:00','Paid'),
(48,10,48,'Member','2026-05-30 18:00:00','Pending'),
(49,1,49,'Leader','2026-05-31 09:00:00','Paid'),
(50,2,50,'Member','2026-06-01 10:00:00','Paid'),
(51,3,51,'Leader','2026-06-02 11:00:00','Paid'),
(52,4,52,'Member','2026-06-03 12:00:00','Pending'),
(53,5,53,'Leader','2026-06-04 13:00:00','Paid'),
(54,6,54,'Member','2026-06-05 14:00:00','Paid'),
(55,7,55,'Leader','2026-06-06 15:00:00','Paid'),
(56,8,56,'Member','2026-06-07 16:00:00','Pending'),
(57,9,57,'Leader','2026-06-08 17:00:00','Paid'),
(58,10,58,'Member','2026-06-09 18:00:00','Paid'),
(59,1,59,'Leader','2026-06-10 09:00:00','Paid'),
(60,2,60,'Member','2026-06-11 10:00:00','Pending');

INSERT INTO `Review` VALUES
(9,9,9,'Cape Town was beautiful and the hotel location was perfect.',5,5,4),
(10,10,10,'Dubai was exciting, but the schedule felt a bit rushed.',4,4,4),
(11,1,11,'Rome had amazing history and the guide was excellent.',5,4,5),
(12,2,12,'Barcelona was sunny, fun and very well organised.',5,5,5),
(13,3,13,'Bangkok food tour was fantastic and affordable.',4,4,5),
(14,4,14,'New York was busy but unforgettable.',4,4,4),
(15,5,15,'Bali was peaceful and the resort was beautiful.',5,5,5),
(16,6,16,'Istanbul had rich culture and friendly guides.',5,4,5),
(17,7,17,'Sydney harbour views were amazing.',4,5,4),
(18,8,18,'The Maldives package was relaxing and luxurious.',5,5,5),
(19,1,19,'Vienna was well organised and enjoyable for travellers.',3,3,4),
(20,2,20,'Lisbon was well organised and enjoyable for travellers.',4,4,5),
(21,3,21,'Prague was well organised and enjoyable for travellers.',5,5,5),
(22,4,22,'Amsterdam was well organised and enjoyable for travellers.',3,3,4),
(23,5,23,'Cairo was well organised and enjoyable for travellers.',4,4,5),
(24,6,24,'Marrakesh was well organised and enjoyable for travellers.',5,5,5),
(25,7,25,'Seoul was well organised and enjoyable for travellers.',3,3,4),
(26,8,26,'Singapore was well organised and enjoyable for travellers.',4,4,5),
(27,9,27,'Doha was well organised and enjoyable for travellers.',5,5,5),
(28,10,28,'Reykjavik was well organised and enjoyable for travellers.',3,3,4),
(29,1,29,'Edinburgh was well organised and enjoyable for travellers.',4,4,5),
(30,2,30,'Dublin was well organised and enjoyable for travellers.',5,5,5),
(31,3,31,'Munich was well organised and enjoyable for travellers.',3,3,4),
(32,4,32,'Venice was well organised and enjoyable for travellers.',4,4,5),
(33,5,33,'Florence was well organised and enjoyable for travellers.',5,5,5),
(34,6,34,'Nice was well organised and enjoyable for travellers.',3,3,4),
(35,7,35,'Queenstown was well organised and enjoyable for travellers.',4,4,5),
(36,8,36,'Auckland was well organised and enjoyable for travellers.',5,5,5),
(37,9,37,'Rio de Janeiro was well organised and enjoyable for travellers.',3,3,4),
(38,10,38,'Buenos Aires was well organised and enjoyable for travellers.',4,4,5),
(39,1,39,'Toronto was well organised and enjoyable for travellers.',5,5,5),
(40,2,40,'Vancouver was well organised and enjoyable for travellers.',3,3,4),
(41,3,41,'Los Angeles was well organised and enjoyable for travellers.',4,4,5),
(42,4,42,'San Francisco was well organised and enjoyable for travellers.',5,5,5),
(43,5,43,'Miami was well organised and enjoyable for travellers.',3,3,4),
(44,6,44,'Honolulu was well organised and enjoyable for travellers.',4,4,5),
(45,7,45,'Phuket was well organised and enjoyable for travellers.',5,5,5),
(46,8,46,'Hanoi was well organised and enjoyable for travellers.',3,3,4),
(47,9,47,'Singapore was well organised and enjoyable for travellers.',4,4,5),
(48,10,48,'Kuala Lumpur was well organised and enjoyable for travellers.',5,5,5),
(49,1,49,'Milan was well organised and enjoyable for travellers.',3,3,4),
(50,2,50,'Budapest was well organised and enjoyable for travellers.',4,4,5),
(51,3,51,'Warsaw was well organised and enjoyable for travellers.',5,5,5),
(52,4,52,'Stockholm was well organised and enjoyable for travellers.',3,3,4),
(53,5,53,'Oslo was well organised and enjoyable for travellers.',4,4,5),
(54,6,54,'Copenhagen was well organised and enjoyable for travellers.',5,5,5),
(55,7,55,'Brussels was well organised and enjoyable for travellers.',3,3,4),
(56,8,56,'Zurich was well organised and enjoyable for travellers.',4,4,5),
(57,9,57,'Geneva was well organised and enjoyable for travellers.',5,5,5),
(58,10,58,'Doha was well organised and enjoyable for travellers.',3,3,4),
(59,1,59,'Abu Dhabi was well organised and enjoyable for travellers.',4,4,5),
(60,2,60,'Mauritius was well organised and enjoyable for travellers.',5,5,5);

INSERT INTO `Payment` VALUES
(9,9,37000.00,'Credit Card','ZAR','Completed','TXN-009-2026'),
(10,10,29000.00,'Bank Transfer','ZAR','Pending','TXN-010-2026'),
(11,11,52000.00,'Debit Card','ZAR','Completed','TXN-011-2026'),
(12,12,72000.00,'Credit Card','ZAR','Completed','TXN-012-2026'),
(13,13,21000.00,'PayPal','ZAR','Pending','TXN-013-2026'),
(14,14,70000.00,'Credit Card','ZAR','Completed','TXN-014-2026'),
(15,15,27500.00,'Debit Card','ZAR','Completed','TXN-015-2026'),
(16,16,46000.00,'Bank Transfer','ZAR','Pending','TXN-016-2026'),
(17,17,33000.00,'Credit Card','ZAR','Completed','TXN-017-2026'),
(18,18,104000.00,'PayPal','ZAR','Completed','TXN-018-2026'),
(19,19,15000.00,'Credit Card','ZAR','Completed','TXN-019-2026'),
(20,20,32500.00,'Debit Card','ZAR','Pending','TXN-020-2026'),
(21,21,52500.00,'PayPal','ZAR','Completed','TXN-021-2026'),
(22,22,75000.00,'Bank Transfer','ZAR','Completed','TXN-022-2026'),
(23,23,20000.00,'Credit Card','ZAR','Completed','TXN-023-2026'),
(24,24,42500.00,'Debit Card','ZAR','Pending','TXN-024-2026'),
(25,25,67500.00,'PayPal','ZAR','Completed','TXN-025-2026'),
(26,26,95000.00,'Bank Transfer','ZAR','Completed','TXN-026-2026'),
(27,27,25000.00,'Credit Card','ZAR','Completed','TXN-027-2026'),
(28,28,52500.00,'Debit Card','ZAR','Pending','TXN-028-2026'),
(29,29,82500.00,'PayPal','ZAR','Completed','TXN-029-2026'),
(30,30,115000.00,'Bank Transfer','ZAR','Completed','TXN-030-2026'),
(31,31,30000.00,'Credit Card','ZAR','Completed','TXN-031-2026'),
(32,32,62500.00,'Debit Card','ZAR','Pending','TXN-032-2026'),
(33,33,97500.00,'PayPal','ZAR','Completed','TXN-033-2026'),
(34,34,135000.00,'Bank Transfer','ZAR','Completed','TXN-034-2026'),
(35,35,35000.00,'Credit Card','ZAR','Completed','TXN-035-2026'),
(36,36,72500.00,'Debit Card','ZAR','Pending','TXN-036-2026'),
(37,37,112500.00,'PayPal','ZAR','Completed','TXN-037-2026'),
(38,38,155000.00,'Bank Transfer','ZAR','Completed','TXN-038-2026'),
(39,39,40000.00,'Credit Card','ZAR','Completed','TXN-039-2026'),
(40,40,82500.00,'Debit Card','ZAR','Pending','TXN-040-2026'),
(41,41,127500.00,'PayPal','ZAR','Completed','TXN-041-2026'),
(42,42,175000.00,'Bank Transfer','ZAR','Completed','TXN-042-2026'),
(43,43,45000.00,'Credit Card','ZAR','Completed','TXN-043-2026'),
(44,44,92500.00,'Debit Card','ZAR','Pending','TXN-044-2026'),
(45,45,142500.00,'PayPal','ZAR','Completed','TXN-045-2026'),
(46,46,195000.00,'Bank Transfer','ZAR','Completed','TXN-046-2026'),
(47,47,50000.00,'Credit Card','ZAR','Completed','TXN-047-2026'),
(48,48,102500.00,'Debit Card','ZAR','Pending','TXN-048-2026'),
(49,49,157500.00,'PayPal','ZAR','Completed','TXN-049-2026'),
(50,50,215000.00,'Bank Transfer','ZAR','Completed','TXN-050-2026'),
(51,51,55000.00,'Credit Card','ZAR','Completed','TXN-051-2026'),
(52,52,112500.00,'Debit Card','ZAR','Pending','TXN-052-2026'),
(53,53,172500.00,'PayPal','ZAR','Completed','TXN-053-2026'),
(54,54,235000.00,'Bank Transfer','ZAR','Completed','TXN-054-2026'),
(55,55,15000.00,'Credit Card','ZAR','Completed','TXN-055-2026'),
(56,56,32500.00,'Debit Card','ZAR','Pending','TXN-056-2026'),
(57,57,52500.00,'PayPal','ZAR','Completed','TXN-057-2026'),
(58,58,75000.00,'Bank Transfer','ZAR','Completed','TXN-058-2026'),
(59,59,20000.00,'Credit Card','ZAR','Completed','TXN-059-2026'),
(60,60,42500.00,'Debit Card','ZAR','Pending','TXN-060-2026');


CREATE INDEX `idx_package_filter`
ON `Package`(`destinationCountry`, `destinationCity`, `pricePerPerson`, `startDate`, `endDate`, `status`);

CREATE INDEX `idx_review_package`
ON `Review`(`packageID`, `overallScore`);

CREATE INDEX `idx_booking_user_package`
ON `Booking`(`userID`, `packageID`);

CREATE INDEX `idx_package_agent`
ON `Package`(`agentID`);

CREATE INDEX `idx_grouptrip_package`
ON `GroupTrip`(`packageID`);


INSERT INTO `Package`
(`agentID`, `title`, `description`, `pricePerPerson`, `currency`, `maxCapacity`, `startDate`, `endDate`, `destinationCity`, `destinationCountry`, `status`)
VALUES
(15, 'Cape Town Test Escape', 'A test package for the agent@gmail.com account.', 18500.00, 'ZAR', 20, '2026-07-01', '2026-07-07', 'Cape Town', 'South Africa', 'Active'),
(15, 'Durban Beach Holiday', 'A relaxing coastal package for testing agency package management.', 14500.00, 'ZAR', 25, '2026-07-10', '2026-07-16', 'Durban', 'South Africa', 'Active'),
(15, 'Kruger Safari Adventure', 'A wildlife safari package created for agent ID 15.', 22000.00, 'ZAR', 18, '2026-08-05', '2026-08-11', 'Kruger National Park', 'South Africa', 'Active'),
(15, 'Garden Route Road Trip', 'A scenic travel package along the Garden Route.', 19500.00, 'ZAR', 16, '2026-08-20', '2026-08-27', 'Knysna', 'South Africa', 'Active'),
(15, 'Johannesburg City Experience', 'A city and culture package for local travellers.', 12000.00, 'ZAR', 30, '2026-09-01', '2026-09-05', 'Johannesburg', 'South Africa', 'Active');

INSERT INTO `GroupTrip` (`groupName`, `currentMembers`, `packageID`)
SELECT CONCAT(p.title, ' Group'), 2, p.packageID
FROM `Package` p
LEFT JOIN `GroupTrip` gt ON gt.packageID = p.packageID
WHERE p.agentID = 15
  AND gt.groupTripID IS NULL;

INSERT INTO `Booking`
(`userID`, `agentID`, `packageID`, `groupTripID`, `numGuests`, `totalPrice`, `status`, `bookedAt`)
SELECT
  1,
  15,
  p.packageID,
  gt.groupTripID,
  2,
  p.pricePerPerson * 2,
  'Confirmed',
  NOW()
FROM `Package` p
JOIN `GroupTrip` gt ON gt.packageID = p.packageID
WHERE p.agentID = 15;

INSERT INTO `Review`
(`userID`, `packageID`, `comment`, `overallScore`, `cleanlinessScore`, `serviceScore`)
SELECT
  1,
  p.packageID,
  CONCAT('Great package: ', p.title, '. Everything was well organised.'),
  5,
  5,
  5
FROM `Package` p
LEFT JOIN `Review` r 
  ON r.packageID = p.packageID 
 AND r.userID = 1
WHERE p.agentID = 15
  AND r.reviewID IS NULL;

INSERT INTO `Review`
(`userID`, `packageID`, `comment`, `overallScore`, `cleanlinessScore`, `serviceScore`)
SELECT
  2,
  p.packageID,
  CONCAT('Good experience in ', p.destinationCity, '. The trip was enjoyable.'),
  4,
  4,
  4
FROM `Package` p
LEFT JOIN `Review` r 
  ON r.packageID = p.packageID 
 AND r.userID = 2
WHERE p.agentID = 15
  AND r.reviewID IS NULL;
