================================================================================
  TRIPISTRY — AGENCY PORTAL
  COS221 Practical Assignment 5
================================================================================

--------------------------------------------------------------------------------
  FOLDER STRUCTURE
--------------------------------------------------------------------------------

  COS221_PA5_DB_Destinations-agency-api/
  |
  |-- config.php                  <- DB connection (edit password here)
  |-- db_test.php                 <- Quick DB connection test, open in browser
  |-- Destination_DB.sql          <- Full schema + seed data, import this first
  |
  |-- agency.php                  <- Main backend: bookings, components, group trips, stats
  |-- packages.php                <- Package CRUD backend
  |-- LoginAgent.php              <- Authentication endpoint (Will need to integrate Michaels Login part)
  |-- Logout.php                  <- logout
  |
  |-- get_packages.php            <- Public package search (traveller side not explicitly used here..)
  |
  |
  |
  |-- agency-dashboard.html       <- Dashboard: stats, bookings, reviews
  |-- agency-packages.html        <- Package management (CRUD)
  |-- agency-group-trips.html     <- Group trip management
  |-- Simple_Agent_Login.html     <- Login page
  |
  |-- css/
  |   |-- style.css
  |   +-- agency.css
  |
  +-- js/
      +-- agency.js               <- Shared JS: API helper, loaders, utilities

--------------------------------------------------------------------------------
  FILE REFERENCE
--------------------------------------------------------------------------------

  config.php
    Creates the $conn MySQLi connection used by every PHP file.
    Edit the $password field to match your local MariaDB setup.

  Destination_DB.sql
  NOTE for tetsing via Login page I used email address oliver.white@travelco.com with password agent123
  -----------------------------------------------------------------------------------------------------
    Complete schema and seed data. Creates all tables: User, Traveller, Agent,
    Package, PackageComponent, Accommodation, Restaurant, Excursion, GroupTrip,
    GroupMembership, Booking, Review, Payment — plus indexes and sample records
    for 4 agents, 10 travellers, 8 packages, and matching bookings and reviews.

  agency.php
    Main backend controller. Handles profile, bookings, components, group trips,
    and dashboard stats. Every function verifies the logged-in agent owns the
    data it is touching. Key functions:
      - getDashboardStats()    Returns total revenue, avg rating, recent reviews
      - listBookings()         All bookings for this agent
      - listComponents()       All package components across all packages
      - createComponent()      Inserts PackageComponent + correct subtype row
      - updateComponent()      Updates component and replaces subtype row
      - deleteComponent()      Deletes component (CASCADE removes subtype)
      - listGroupTrips()       All group trips linked to this agent's packages
      - writeAuditLog()        Records every write to agencyAuditLog table

  packages.php
    Handles Package table CRUD only. updatePackage() was fixed (see Fixes).
    deletePackage() soft-deletes by setting status = 'Inactive' to preserve
    booking history. NOTE: on localhost, if no session exists, it auto-sets
    userID = 11 for development. Comment this out to test real login flow.

  LoginAgent.php
    Accepts { email, password } as JSON POST. Verifies bcrypt hash, rejects
    non-Agent accounts, calls session_regenerate_id(true) on success, and
    stores userID, userType, firstName, companyName in $_SESSION.

  logout.php
    Destroys the PHP session. Called by the logout button in agency.js before
    redirecting back to the login page.

  js/agency.js
    Shared across all agency pages. All backend calls go through apiRequest().

    Function                  Purpose
    -------                   -------
    apiRequest()              Central fetch wrapper for all backend calls
    loadCsrfToken()           Fetches and stores the CSRF token
    showMessage()             Floating toast notification (success / error)
    loadDashboardStats()      Populates all 5 stat cards incl. revenue + rating
    loadReviewsSnapshot()     Renders recent reviews with stars in sidebar
    loadBookings()            Populates the bookings table
    loadPackageOptions()      Fills the package dropdown on Group Trips page

  agency-dashboard.html
    Loads agency.js then runs its own inline script that populates stat cards,
    the bookings table, package summary sidebar, and reviews sidebar.
    Stat card element IDs: packageCount, bookingCount, componentCount,
    stat-revenue, stat-rating.

  agency-packages.html
    Full package CRUD page. Packages load into a card grid. Add and Edit share
    one modal; the hidden edit-id field switches between create and update mode.
    After any save, loadPackagesPage() re-fetches from the backend. Currency
    select is set explicitly in openEditModal() with a ZAR fallback.

  agency-group-trips.html
    Group trip management. Package dropdown populated via loadPackageOptions().
    Stats row sums currentMembers client-side from tripsCache array.

  Simple_Agent_Login.html
    POSTs credentials to LoginAgent.php as JSON, redirects to dashboard on
    success, shows inline error box on failure. Enter key also triggers login.

--------------------------------------------------------------------------------
  HOW THE FRONTEND CONNECTS TO THE BACKEND
--------------------------------------------------------------------------------

  Every data operation follows this pattern:

  HTML Page
     |
     +-- calls apiRequest() in agency.js
           |
           +-- fetch("packages.php?action=update_package",
                 { method: "POST", body: JSON, headers: { X-CSRF-Token } })
                 |
                 +-- PHP receives request
                       |-- validates session       (requireAgentLogin)
                       |-- validates CSRF token    (requireCsrfToken)
                       |-- validates input         (requiredString, requiredFloat, etc.)
                       |-- runs prepared statement against database
                       +-- returns JSON:  { success: true/false, message: "...", data: {} }
                 |
                 +-- JS reads result.success
                       |-- shows toast via showMessage()
                       +-- refreshes the relevant page section

  Read-only actions (list, get) skip the CSRF check.
  All write actions (create, update, delete) require it.

--------------------------------------------------------------------------------
  API ACTION REFERENCE
--------------------------------------------------------------------------------

  packages.php
  ------------
  Action                  Method  Auth  CSRF  Description
  ------                  ------  ----  ----  -----------
  health                  GET     No    No    Returns available actions
  get_csrf_token          GET     No    No    Returns a CSRF token for this session
  list_packages           GET     Yes   No    All packages for this agent
  get_package             GET     Yes   No    One package by packageID
  create_package          POST    Yes   Yes   Creates a new package
  update_package          POST    Yes   Yes   Updates an existing package
  delete_package          POST    Yes   Yes   Soft-deletes (sets Inactive)
  list_package_components GET     Yes   No    Components for one package

  agency.php
  ----------
  Action                  Method  Auth  CSRF  Description
  ------                  ------  ----  ----  -----------
  health                  GET     No    No    Returns available actions
  get_csrf_token          GET     No    No    Returns CSRF token
  get_agency_profile      GET     Yes   No    Agent + User profile
  update_agency_profile   POST    Yes   Yes   Updates profile
  list_bookings           GET     Yes   No    All bookings for this agent
  get_dashboard_stats     GET     Yes   No    Revenue, avg rating, recent reviews
  list_components         GET     Yes   No    All components across all packages
  get_component           GET     Yes   No    One component with subtype details
  create_component        POST    Yes   Yes   Creates component + subtype row
  update_component        POST    Yes   Yes   Updates component + replaces subtype
  delete_component        POST    Yes   Yes   Deletes component (CASCADE to subtype)
  list_group_trips        GET     Yes   No    All group trips for this agent
  get_group_trip          GET     Yes   No    One group trip
  create_group_trip       POST    Yes   Yes   Creates a group trip
  update_group_trip       POST    Yes   Yes   Updates a group trip
  delete_group_trip       POST    Yes   Yes   Deletes a group trip

--------------------------------------------------------------------------------
  SECURITY
--------------------------------------------------------------------------------

  SQL Injection    Every query uses MySQLi prepared statements with bind_param.
                   No user input is ever interpolated into SQL strings directly.

  CSRF             All write endpoints require an X-CSRF-Token header validated
                   server-side with hash_equals() (timing-attack safe).

  Session          session_regenerate_id(true) is called on login to prevent
                   session fixation attacks.

  Agent-Only       requireAgentLogin() checks both that a session exists and
                   that userType === "Agent". Traveller accounts are blocked.

  Audit Log        Every write action records to agencyAuditLog (auto-created)
                   with agent ID, action type, IP address, and user agent.

  Output           JSON responses use JSON_HEX_* flags to prevent XSS via
                   JSON injection.

--------------------------------------------------------------------------------
 Most important KEY FIXES APPLIED
--------------------------------------------------------------------------------

  FIX 1 — Package edit not saving to database  (packages.php)
  ------------------------------------------------------------
  updatePackage() had a bind_param type string with 11 characters for 12
  parameters. This silently shifted all bound values from currency onward,
  writing wrong data to the database on every edit.

    BEFORE (broken  — 11 chars):  "ssdsissssii"
    AFTER  (correct — 12 chars):  "ssdsisssssii"
                                      ^
                                   missing 's' for currency field added here

  FIX 2 — Revenue and rating always showing dash  (agency.js + agency.php)
  -------------------------------------------------------------------------
  loadDashboardStats() never fetched revenue or rating data. Added new function
  getDashboardStats() to agency.php which queries SUM(totalPrice) from confirmed
  bookings and AVG(overallScore) from reviews for this agent's packages. Updated
  loadDashboardStats() in agency.js to call get_dashboard_stats and populate
  stat-revenue and stat-rating elements on the dashboard.

  FIX 3 — Reviews sidebar always showed placeholder  (agency.js)
  --------------------------------------------------------------
  loadReviewsSnapshot() was hardcoded to display "Review data coming soon."
  regardless of database content. Updated to fetch from get_dashboard_stats and
  render real reviews with traveller name, star rating, package title, comment.

--------------------------------------------------------------------------------
Whats left
--------------------------------------------------------------------------------
Add flights logic
Maybe a bit more testing to ensure correct functionality
Will add some more css

================================================================================