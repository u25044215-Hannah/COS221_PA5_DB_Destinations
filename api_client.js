const API_BASE = "";

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("tripistryUser") || "null");
  } catch {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem("tripistryUser", JSON.stringify(user));
}

function requireLogin() {
  const user = getCurrentUser();

  if (!user || !user.userID) {
    alert("Please log in first.");
    window.location.href = "login.html";
    return null;
  }

  return user;
}

async function apiGet(path, params = {}) {
  const qs = new URLSearchParams(params).toString();

  const response = await fetch(`${API_BASE}${path}${qs ? "?" + qs : ""}`, {
    credentials: "include"
  });

  return response.json();
}

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

function money(value, currency = "ZAR") {
  const number = Number(value || 0);
  return `${currency} ${number.toLocaleString()}`;
}

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