Tripistry – Travel Booking & Agency Management System
Hannah Diedrick
Shelby Bodenstein
Michael Harding
Idene Smit
Danel Steyn

Overview:
Tripistry is a full-stack web-based travel management platform. The system allows travellers to browse and compare travel packages, while travel agencies can manage destinations, packages, bookings, and group trips through a dedicated dashboard based off your user type.

The application was built using:
Frontend: HTML5, CSS3, JavaScript
Backend: PHP
Database: MariaDB & MySQL
API Communication: Fetch API with JSON calls
Version Control: Git & GitHub

Database
The system uses a MariaDB database containing tables such as:
Users
Agencies
Packages
Bookings
Reviews
Destinations
GroupTrips

The database is populated using:
Manual SQL inserts
Sample package data
Test traveller and agency accounts
Installation & Setup
1. Clone the Repository
2. Import the Database
  Import the provided SQL file into MariaDB/MySQL:
  mysql -u root -p < Destination_DB.sql
3. Configure Database Connection
Update config.php with your database credentials pulled from an environment variable.
4. Run the Project
Using PHP Local Servers
php -S localhost:8000
php -S localhosst:3000
Then open:
http://localhost:8000

Test Login Accounts
1)Traveller Account
  Role: Taveller
  Email: lucas.moore@email.com
  Password: lucas123
2) Agency Account
  Role: Agent
  Email: agent@gmail.com	
  Password: agent123

API Endpoints
  Authentication (created by Hannah)
  login.php (created by Hannah)
  signup.php (created by Michael & Hannah)
  Packages (created by Shelby)
  packages.php (created by Shelby)
  api.php?action=getPackages (created by Shelby)
  Agency Management (created by Shelby)
  agency.php (created by Shelby)
  Reviews (created by Michael)
  submit_review.php (created by Michael)
  Security Features 
    1) CSRF protection
    2) prepare statements to prevent SQL injection
    3) enironment variable to prevent database leakages
    4) hashed user password
    5) Audit logs
    6) Validation of log in and sign up
  
Technologies Used:
  Technology	Purpose:
    HTML5	Page structure
    CSS3	Styling and responsive design
    JavaScript	Frontend interactivity
    PHP	Backend logic
    MariaDB/MySQL	Database management
    GitHub	Version control

Team Responsibilities:
We divided the work amongst all of us by front end development and back end development and linking between the 2 states:
  Backend development: (development of all the php files)
    Hannah Diedrick
    Shebly Bodenstein
    Michael Harding
  Frontend development: (development of all the html files)
    Idene Smit
    Danel Steyn
  Linking: (development of all js files)
    Hannah Diedrick
    Shebly Bodenstein
    Michael Harding
    Idene Smit
    Danel Steyn
  Hosting server: (php -S localhost:8000)
    Hannah Diedrick
  Testing and Debugging with live data:
    Hannah Diedrick
    Shelby Bodenstein
    Michael Harding
    
License
This project was created for educational purposes only.
