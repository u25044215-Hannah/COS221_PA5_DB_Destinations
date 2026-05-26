//Hannah Diedrick
// Base URL for API requests.
// Empty means the API files are in the same folder/server location as the frontend.
const API_BASE = "";

// Gets the currently logged-in user from localStorage.
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("tripistryUser") || "null");
  } catch {
    return null;
  }
}

// Saves the logged-in user object into localStorage.
function setCurrentUser(user) {
  localStorage.setItem("tripistryUser", JSON.stringify(user));
}

// Checks if a user is logged in.
// If not, redirects them to the login page.
function requireLogin() {
  const user = getCurrentUser();

  if (!user || !user.userID) {
    alert("Please log in first.");
    window.location.href = "login.html";
    return null;
  }

  return user;
}

// Sends a GET request to the backend API.
// params are converted into a query string.
async function apiGet(path, params = {}) {
  const qs = new URLSearchParams(params).toString();

  const response = await fetch(`${API_BASE}${path}${qs ? "?" + qs : ""}`, {
    credentials: "include"
  });

  return response.json();
}

// Sends a POST request to the backend API.
// data is sent as JSON in the request body.
async function apiPost(path, data = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  return response.json();
}

// Formats a number as a money value.
// Default currency is ZAR.
function money(value, currency = "ZAR") {
  const number = Number(value || 0);
  return `${currency} ${number.toLocaleString()}`;
}

// Converts package data from the backend into a consistent format
// that the frontend pages can easily use.
function normalisePackage(p) {
  return {
    ...p,
    id: Number(p.packageID),
    name: p.title,
    destination: `${p.destinationCity || ""}${p.destinationCountry ? ", " + p.destinationCountry : ""}`,
    price: Number(p.pricePerPerson || 0),
    rating: Number(p.avgRating || 0),
    duration: Number(p.durationDays || 0),
    agency: p.agencyName || "Tripistry Agency"
  };
}

// Gets the saved package comparison list from localStorage.
function getCompareList() {
  try {
    return JSON.parse(localStorage.getItem("tripistryCompare") || "[]");
  } catch {
    return [];
  }
}

// Saves the comparison list to localStorage.
// Removes duplicates and limits the list to 4 packages.
function setCompareList(list) {
  localStorage.setItem(
    "tripistryCompare",
    JSON.stringify([...new Set(list.map(Number))].slice(0, 4))
  );
}

// Adds a package ID to the comparison list.
function addToCompare(id) {
  const list = getCompareList();
  const packageID = Number(id);

  if (!list.includes(packageID)) {
    list.push(packageID);
  }

  setCompareList(list);
}
