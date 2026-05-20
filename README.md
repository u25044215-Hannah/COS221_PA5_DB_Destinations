# Agency API README

## Overview

The Agency API is the backend controller responsible for all agency-side functionality in the Tripistry travel booking system. It allows travel agents to manage travel packages, group trips, and package components securely through PHP and MySQL.

The API uses:

* PHP
* MySQL / MariaDB
* JSON responses
* Prepared statements for SQL injection prevention
* Session authentication
* CSRF protection
* Audit logging

---

# Features

## Package Management

Agents can:

* Create packages
* View their packages
* Update packages
* Soft delete packages (mark inactive)

## Group Trip Management

Agents can:

* Create group trips
* View group trips
* Delete group trips

## Package Components

Agents can manage:

* Accommodation
* Restaurants
* Excursions

## Security Features

The API includes:

* Prepared SQL statements
* Session authentication
* Role-based access control
* CSRF token validation
* Audit logging

---

# File Structure

```text
Tripistry/
│
├── agency.php
├── packages.php
├── config/
│   └── database.php
├── includes/
│   └── auth_check.php
├── js/
│   └── agency.js
├── css/
│   └── agency.css
├── database/
│   └── database.sql
```

---

# Technologies Used

* PHP
* MySQL / MariaDB
* JavaScript
* HTML5
* CSS3
* phpMyAdmin
* XAMPP

---

# Database Requirements

Import the SQL database file:

```text
database/database.sql
```

into phpMyAdmin before running the project.

---

# Running the Project

## Using XAMPP

1. Install XAMPP
2. Start Apache and MySQL
3. Place the project inside:

```text
C:\xampp\htdocs\Tripistry
```

4. Open in browser:

```text
http://localhost/Tripistry/
```

---

# API Endpoints

## packages.php

### Health Check

```text
packages.php?action=health
```

### Get CSRF Token

```text
packages.php?action=get_csrf_token
```

### List Packages

```text
packages.php?action=list_packages
```

### Get Single Package

```text
packages.php?action=get_package&packageID=1
```

### Create Package

```text
packages.php?action=create_package
```

### Update Package

```text
packages.php?action=update_package
```

### Delete Package

```text
packages.php?action=delete_package
```

---

## agency.php

### List Group Trips

```text
agency.php?action=list_group_trips
```

### Create Group Trip

```text
agency.php?action=create_group_trip
```

### Delete Group Trip

```text
agency.php?action=delete_group_trip
```

### List Components

```text
agency.php?action=list_components
```

### Create Component

```text
agency.php?action=create_component
```

### Delete Component

```text
agency.php?action=delete_component
```

---

# Frontend Integration

The frontend communicates with the backend using:

```javascript
fetch()
```

requests inside:

```text
js/agency.js
```

The JavaScript dynamically:

* Loads packages
* Creates packages
* Updates packages
* Deletes packages
* Loads group trips
* Creates components
* Updates dashboard statistics

---

# Security

## SQL Injection Prevention

All database queries use:

```php
prepare()
bind_param()
```

to prevent SQL injection attacks.

## CSRF Protection

All create, update, and delete requests require a CSRF token.

## Session Authentication

Only authenticated agents can access agency API routes.

## Audit Logging

Important actions are stored in:

