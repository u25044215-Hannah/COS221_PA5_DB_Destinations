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
  `componentType` ENUM('Accommodation','Restaurant','Excursion','Flight') NOT NULL,
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

CREATE TABLE `Flight` (
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
(14,'Amelia','Lewis','amelia.lewis@luxtravel.com','+61-2-5550-1404','Australian','1975-11-07','Agent','$2y$12$Ow/dJ56TARMdIIcv.H/A7uDYsO0bIr/VNLVr1znaRVAxZprY2GyJm');

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
(14,'Lux Travel Group',10.00,'Elite');

INSERT INTO `Package` VALUES
(1,11,'Paris Romantic Getaway','A 7-day romantic escape in the City of Light.',1200.00,'USD',20,'2026-06-01','2026-06-07','Paris','France','Active'),
(2,12,'Tokyo Cultural Immersion','Explore temples, cuisine and tradition in Tokyo.',1800.00,'USD',15,'2026-07-10','2026-07-20','Tokyo','Japan','Active'),
(3,13,'Safari Adventure Kenya','Witness the Great Migration on the Maasai Mara.',3500.00,'USD',12,'2026-08-05','2026-08-15','Nairobi','Kenya','Active'),
(4,14,'Greek Islands Cruise','Sail through Santorini, Mykonos and Rhodes.',2200.00,'EUR',30,'2026-09-01','2026-09-10','Athens','Greece','Active'),
(5,11,'Swiss Alps Adventure','Epic alpine scenery, cable cars and adrenaline activities in Interlaken.',45200.00,'ZAR',15,'2026-07-28','2026-08-04','Interlaken','Switzerland','Active'),
(6,12,'London City Explorer','Iconic landmarks, world-class museums and West End theatre in 8 days.',32000.00,'ZAR',25,'2026-09-02','2026-09-10','London','United Kingdom','Active'),
(7,13,'Zanzibar Beach Escape','Crystal waters, white sand beaches and Stone Town history in 5 days.',19800.00,'ZAR',30,'2026-08-20','2026-08-25','Zanzibar','Tanzania','Active'),
(8,14,'Paris Romantic Getaway 4D','Romance, art, cuisine and the City of Light in a luxury long weekend.',38000.00,'ZAR',20,'2026-10-10','2026-10-14','Paris','France','Draft');

INSERT INTO `GroupTrip` VALUES
(1,'Paris Lovers 2026',8,1),
(2,'Tokyo Explorers',6,2),
(3,'Kenya Safari Squad',5,3),
(4,'Greek Island Hoppers',10,4),
(5,'Swiss Summit Crew',6,5),
(6,'London Theatre Group',10,6),
(7,'Zanzibar Beach Club',12,7),
(8,'Paris Luxury Weekend',4,8);

INSERT INTO `PackageComponent` VALUES
(1,1,'Accommodation','Hotel Le Marais','Paris','France','4-star boutique hotel in central Paris.'),
(2,1,'Restaurant','Le Jules Verne','Paris','France','Fine dining inside the Eiffel Tower.'),
(3,1,'Excursion','Louvre Museum Guided Tour','Paris','France','Skip-the-line guided tour of the Louvre.'),

(4,2,'Accommodation','Shinjuku Grand Hotel','Tokyo','Japan','Modern hotel near Shinjuku station.'),
(5,2,'Restaurant','Sukiyabashi Jiro','Tokyo','Japan','World-famous sushi restaurant.'),
(6,2,'Excursion','Mt Fuji Day Trip','Tokyo','Japan','Full-day trip to Mount Fuji and Hakone.'),

(7,3,'Accommodation','Maasai Mara Safari Camp','Nairobi','Kenya','Luxury tented camp on the savannah.'),
(8,3,'Restaurant','Carnivore Restaurant','Nairobi','Kenya','Renowned game meat dining experience.'),
(9,3,'Excursion','Great Migration Game Drive','Nairobi','Kenya','Sunrise game drive to see the migration.'),

(10,4,'Accommodation','Santorini Clifftop Suites','Athens','Greece','Clifftop suites with caldera views.'),
(11,4,'Restaurant','Ambrosia Santorini','Athens','Greece','Seafood with sunset caldera views.'),
(12,4,'Excursion','Sailing around Santorini','Athens','Greece','Private catamaran tour of the islands.'),

(13,5,'Accommodation','Interlaken Riverside Hotel','Interlaken','Switzerland','4-star hotel on the Aare River with mountain views.'),
(14,5,'Restaurant','Restaurant Schuh','Interlaken','Switzerland','Classic Swiss cuisine with panoramic alpine views.'),
(15,5,'Excursion','Jungfraujoch Top of Europe','Interlaken','Switzerland','Train ride to Europes highest railway station.'),

(16,6,'Accommodation','The Strand Palace Hotel','London','United Kingdom','Classic hotel steps from Covent Garden and the West End.'),
(17,6,'Restaurant','Rules Restaurant','London','United Kingdom','Londons oldest restaurant, famous for British dishes.'),
(18,6,'Excursion','Tower of London Tour','London','United Kingdom','Guided tour of the historic Tower and iconic bridge.'),

(19,7,'Accommodation','Zanzibar Beach Resort','Zanzibar','Tanzania','5-star beachfront resort on the east coast.'),
(20,7,'Restaurant','The Rock Restaurant','Zanzibar','Tanzania','Iconic restaurant built on a rock in the Indian Ocean.'),
(21,7,'Excursion','Spice Farm and Snorkel Tour','Zanzibar','Tanzania','Morning spice farm visit and afternoon reef snorkelling.'),

(22,8,'Accommodation','Hotel Plaza Athenee','Paris','France','5-star palace hotel on Avenue Montaigne.'),
(23,8,'Restaurant','Alain Ducasse au Plaza','Paris','France','Three Michelin star dining in iconic surroundings.'),
(24,8,'Excursion','Versailles Palace Day Trip','Paris','France','Guided visit to the Palace of Versailles and gardens.'),
(25,1,'Flight','Paris Return Flight','Paris','France','Return flights included for the Paris package.'),
(26,5,'Flight','Swiss Alps Return Flight','Interlaken','Switzerland','Return flights included for the Swiss Alps package.'),
(27,7,'Flight','Zanzibar Return Flight','Zanzibar','Tanzania','Return flights included for the beach escape.');

INSERT INTO `Accommodation` VALUES
(1,'Hotel',4,'6 Rue de Bretagne, Paris','WiFi, Spa, Restaurant, Bar'),
(4,'Hotel',4,'2-1 Kabukicho, Shinjuku, Tokyo','WiFi, Gym, Onsen, Restaurant'),
(7,'Camp',5,'Maasai Mara National Reserve','Pool, WiFi, Game Drives, Bar'),
(10,'Resort',5,'Oia, Santorini','Infinity Pool, Spa, WiFi, Bar'),
(13,'Hotel',4,'Aare River Road, Interlaken','WiFi, Mountain View, Breakfast, Spa'),
(16,'Hotel',4,'Strand, London','WiFi, Breakfast, Theatre Desk, Bar'),
(19,'Resort',5,'East Coast Beach, Zanzibar','Pool, Beach Access, Spa, WiFi'),
(22,'Hotel',5,'Avenue Montaigne, Paris','Spa, Fine Dining, WiFi, Concierge');

INSERT INTO `Restaurant` VALUES
(2,'French Fine Dining','Luxury','Champ de Mars, Paris'),
(5,'Japanese Sushi','Luxury','4-2-15 Ginza, Chuo-ku, Tokyo'),
(8,'African Game Meat','Mid-range','Langata Road, Nairobi'),
(11,'Greek Seafood','High-end','Oia, Santorini'),
(14,'Swiss Cuisine','Mid-range','Hoheweg, Interlaken'),
(17,'British Cuisine','High-end','Maiden Lane, London'),
(20,'Seafood','High-end','Michamvi Pingwe, Zanzibar'),
(23,'French Fine Dining','Luxury','Avenue Montaigne, Paris');

INSERT INTO `Excursion` VALUES
(3,'4 hours','Easy','Louvre Pyramid Main Entrance',25),
(6,'Full day','Moderate','Shinjuku Station South Exit',20),
(9,'6 hours','Easy','Safari Camp Main Gate',12),
(12,'8 hours','Easy','Athinios Ferry Port, Santorini',20),
(15,'Full day','Moderate','Interlaken Ost Station',20),
(18,'5 hours','Easy','Tower Hill Station',25),
(21,'Full day','Easy','Stone Town Main Square',18),
(24,'Full day','Easy','Hotel Lobby',20);

INSERT INTO `Flight` VALUES
(25,'Air France','AF995','JNB','CDG','2026-06-01 19:50:00','2026-06-02 06:10:00','Economy','1 checked bag included'),
(26,'Swiss International Air Lines','LX283','JNB','ZRH','2026-07-28 19:35:00','2026-07-29 06:15:00','Economy','1 checked bag included'),
(27,'Air Tanzania','TC209','JNB','ZNZ','2026-08-20 09:10:00','2026-08-20 15:40:00','Economy','1 checked bag included');

INSERT INTO `Booking` VALUES
(1,1,11,1,1,2,2400.00,'Confirmed','2026-01-10 09:15:00'),
(2,2,11,1,1,1,1200.00,'Confirmed','2026-01-12 11:45:00'),
(3,3,12,2,2,2,3600.00,'Confirmed','2026-02-05 10:20:00'),
(4,4,13,3,3,1,3500.00,'Pending','2026-03-01 08:30:00'),
(5,5,14,4,4,2,4400.00,'Confirmed','2026-03-15 16:20:00'),
(6,6,11,5,5,2,90400.00,'Pending','2026-05-01 10:00:00'),
(7,7,12,6,6,1,32000.00,'Confirmed','2026-05-02 11:00:00'),
(8,8,13,7,7,2,39600.00,'Confirmed','2026-05-03 12:00:00');

INSERT INTO `GroupMembership` VALUES
(1,1,1,'Leader','2026-01-10 09:00:00','Paid'),
(2,2,1,'Member','2026-01-12 11:30:00','Paid'),
(3,3,2,'Leader','2026-02-05 10:00:00','Paid'),
(4,4,3,'Leader','2026-03-01 08:00:00','Pending'),
(5,5,4,'Leader','2026-03-15 16:00:00','Paid'),
(6,6,5,'Leader','2026-05-01 10:00:00','Pending'),
(7,7,6,'Leader','2026-05-02 11:00:00','Paid'),
(8,8,7,'Leader','2026-05-03 12:00:00','Paid');

INSERT INTO `Review` VALUES
(1,1,1,'Absolutely magical trip! Paris exceeded all expectations.',5,5,5),
(2,2,1,'Beautiful city, the hotel was a little noisy but overall great.',4,3,4),
(3,3,2,'Tokyo is incredible. The food tour was the highlight.',5,5,5),
(4,4,3,'The safari was life-changing. Saw the Big Five on day one!',5,4,5),
(5,5,4,'Greece was stunning. Catamaran tour was the best part.',5,5,4),
(6,6,5,'The Swiss Alps package looks amazing and very organised.',5,5,5),
(7,7,6,'London was exciting and the theatre experience was excellent.',4,4,5),
(8,8,7,'Zanzibar beaches were beautiful and relaxing.',5,5,4);

INSERT INTO `Payment` VALUES
(1,1,2400.00,'Credit Card','USD','Completed','TXN-001-2026'),
(2,2,1200.00,'PayPal','USD','Completed','TXN-002-2026'),
(3,3,3600.00,'Credit Card','USD','Completed','TXN-003-2026'),
(4,4,3500.00,'Bank Transfer','USD','Pending','TXN-004-2026'),
(5,5,4400.00,'Debit Card','EUR','Completed','TXN-005-2026'),
(6,6,90400.00,'Credit Card','ZAR','Pending','TXN-006-2026'),
(7,7,32000.00,'Bank Transfer','ZAR','Completed','TXN-007-2026'),
(8,8,39600.00,'Credit Card','ZAR','Completed','TXN-008-2026');


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