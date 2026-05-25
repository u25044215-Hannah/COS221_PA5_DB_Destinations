/**
 * agency.js — Tripistry Agency Frontend
 * Handles all fetch calls to packages.php and agency.php
 */

const PACKAGE_CONTROLLER = "packages.php";
const AGENCY_CONTROLLER  = "agency.php";

let csrfToken = null;

/* ════════════════════════════════════════════
   CORE API HELPER
   ════════════════════════════════════════════ */

/**
 * Makes a fetch request to a backend PHP controller.
 *
 * @param {string}  file       - PHP file (e.g. "packages.php")
 * @param {string}  action     - ?action= value
 * @param {string}  method     - "GET" or "POST"
 * @param {object|null} data   - JSON body for POST requests
 * @param {boolean} needsCsrf  - Whether to attach the CSRF token header
 * @returns {object}           - Parsed JSON response { success, message, data }
 */
async function apiRequest(file, action, method = "GET", data = null, needsCsrf = false) {
  const url = `${file}?action=${action}`;

  const options = {
    method,
    headers: {}
  };

  if (needsCsrf) {
    if (!csrfToken) await loadCsrfToken(file);
    options.headers["X-CSRF-Token"] = csrfToken;
  }

  if (data !== null) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const text     = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, message: text || "Invalid JSON response from backend." };
    }
  } catch (err) {
    return { success: false, message: "Network error: " + err.message };
  }
}

/* ════════════════════════════════════════════
   CSRF TOKEN
   ════════════════════════════════════════════ */

async function loadCsrfToken(file = PACKAGE_CONTROLLER) {
  try {
    const response = await fetch(`${file}?action=get_csrf_token`);
    const result   = await response.json();
    if (result.success && result.data && result.data.csrf_token) {
      csrfToken = result.data.csrf_token;
    }
  } catch (err) {
    console.warn("Could not load CSRF token:", err.message);
  }
  return csrfToken;
}

function showMessage(message, type = "success") {
  let box = document.getElementById("messageBox");
  if (!box) {
    box = document.createElement("div");
    box.id = "messageBox";
    document.body.prepend(box);
  }
  box.textContent = message;
  box.className   = type === "success" ? "success-message" : "error-message";
  clearTimeout(box._timer);
  box._timer = setTimeout(() => {
    box.textContent = "";
    box.className   = "";
  }, 3500);
}

/* ════════════════════════════════════════════
   PACKAGE OPTIONS (for dropdowns)
   Populates #trip-package select on group trips page
   ════════════════════════════════════════════ */

async function loadPackageOptions() {
  const select = document.getElementById("trip-package");
  if (!select) return;

  const result = await apiRequest(PACKAGE_CONTROLLER, "list_packages");
  if (!result.success) return;

  const packages = result.data || [];

  select.innerHTML = `
    <option value="">Select package…</option>
    ${packages.map(pkg => `
      <option value="${pkg.packageID}">
        ${pkg.title}${pkg.destinationCity ? " — " + pkg.destinationCity : ""}
      </option>
    `).join("")}
  `;
}

/* ════════════════════════════════════════════
   DASHBOARD
   ════════════════════════════════════════════ */


 //Populates the stat cards on agency-dashboard.html
async function loadDashboardStats() {
  const packageCountEl   = document.getElementById("packageCount");
  const bookingCountEl   = document.getElementById("bookingCount");
  const componentCountEl = document.getElementById("componentCount");
  const revenueTotalEl = document.getElementById("stat-revenue");
 const avgRatingEl    = document.getElementById("stat-rating");

  if (!packageCountEl && !bookingCountEl && !componentCountEl 
      && !revenueTotalEl && !avgRatingEl) return;

  const [packagesResult, bookingsResult, componentsResult, statsResult] = await Promise.all([
    apiRequest(PACKAGE_CONTROLLER, "list_packages"),
    apiRequest(AGENCY_CONTROLLER,  "list_bookings"),
    apiRequest(AGENCY_CONTROLLER,  "list_components"),
    apiRequest(AGENCY_CONTROLLER,  "get_dashboard_stats")
  ]);

  if (packageCountEl && packagesResult.success) {
    packageCountEl.textContent = packagesResult.data.length;
  }
  if (bookingCountEl && bookingsResult.success) {
    bookingCountEl.textContent = bookingsResult.data.length;
  }
  if (componentCountEl && componentsResult.success) {
    componentCountEl.textContent = componentsResult.data.length;
  }
  if (statsResult.success && statsResult.data) {
    if (revenueTotalEl) {
      const rev = parseFloat(statsResult.data.totalRevenue || 0);
      revenueTotalEl.textContent = rev > 0
        ? "R " + rev.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "—";
    }
    if (avgRatingEl) {
      const rating = parseFloat(statsResult.data.avgRating || 0);
      avgRatingEl.textContent = rating > 0 ? rating.toFixed(1) + " / 5" : "—";
    }
  }
}


/* Packages sidebar summary */
async function loadPackagesSummary() {
  const list = document.getElementById("packages-summary");
  if (!list) return;

  const result = await apiRequest(PACKAGE_CONTROLLER, "list_packages");
  if (!result.success) return;

  const packages = result.data || [];

  list.innerHTML = packages.slice(0, 5).map(pkg => `
    <li>
      <strong>${pkg.title}</strong><br/>
      <small>${pkg.destinationCity || ""}${pkg.destinationCountry ? ", " + pkg.destinationCountry : ""}</small>
    </li>
  `).join("") || "<li>No packages yet.</li>";
}

/* Dashboard: Recent Bookings table */
async function loadBookings() {
  const tbody = document.getElementById("bookings-tbody");
  if (!tbody) return;

  const result = await apiRequest(AGENCY_CONTROLLER, "list_bookings");

  if (!result.success) {
    showMessage("Failed to load bookings.", "error");
    return;
  }

  const bookings = result.data || [];

  if (!bookings.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--grey-text);">No bookings yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = bookings.map(b => `
    <tr>
      <td>${b.bookingID}</td>
      <td>${b.firstName} ${b.lastName}</td>
      <td>${b.title}</td>
      <td>${b.bookedAt}</td>
      <td>${b.totalPrice}</td>
      <td><span class="status-badge status-badge--${(b.status || "").toLowerCase()}">${b.status}</span></td>
      <td>—</td>
    </tr>
  `).join("");

  // Update booking stat count
  const bookingCount = document.getElementById("bookingCount");
  if (bookingCount) bookingCount.textContent = bookings.length;
}


async function loadReviewsSnapshot() {
  const list = document.getElementById("reviews-snapshot");
  if (!list) return;

  const result = await apiRequest(AGENCY_CONTROLLER, "get_dashboard_stats");
  if (!result.success || !result.data || !result.data.recentReviews) {
    list.innerHTML = `<li style="color:var(--grey-text);font-size:0.85rem;">No reviews yet.</li>`;
    return;
  }

  const reviews = result.data.recentReviews;
  if (!reviews.length) {
    list.innerHTML = `<li style="color:var(--grey-text);font-size:0.85rem;">No reviews yet.</li>`;
    return;
  }

  list.innerHTML = reviews.map(r => `
    <li style="margin-bottom:10px;">
      <strong>${r.travellerName || "Traveller"}</strong>
      <span style="float:right;color:#f59e0b;">${"★".repeat(parseInt(r.overallScore))}${"☆".repeat(5 - parseInt(r.overallScore))}</span><br/>
      <small style="color:var(--grey-text);">${r.packageTitle || ""}</small><br/>
      <span style="font-size:0.85rem;">${r.comment || ""}</span>
    </li>
  `).join("");
}


async function loadGroupTrips() {
  if (typeof loadGroupTripsPage === "function") {
    return loadGroupTripsPage();
  }

  // Fallback: render into #trips-grid if it exists
  const container = document.getElementById("trips-grid");
  if (!container) return;

  const result = await apiRequest(AGENCY_CONTROLLER, "list_group_trips");
  if (!result.success) {
    showMessage(result.message || "Could not load group trips.", "error");
    return;
  }

  const trips = result.data || [];

  container.innerHTML = trips.map(trip => `
    <div class="trip-card">
      <div class="trip-card-top">
        <div>
          <h3>${trip.groupName}</h3>
          <small>${trip.title || ("Package #" + trip.packageID)}</small>
        </div>
      </div>
      <div class="trip-info">
        <p><strong>Members:</strong> ${trip.currentMembers}</p>
      </div>
      <div class="trip-actions">
        <button onclick="confirmDeleteTrip(${trip.groupTripID})">Delete</button>
      </div>
    </div>
  `).join("") || `<p class="empty-state">No group trips yet.</p>`;
}

/*   Enrollees modal   */
async function openEnrolleesModal(groupTripID) {
  const modal = document.getElementById("enrollees-modal");
  const list  = document.getElementById("enrollees-list");
  const title = document.getElementById("enrollees-title");
  if (!modal) return;

  modal.style.display = "flex";
  list.innerHTML = "Loading…";

  const result = await apiRequest(
    AGENCY_CONTROLLER,
    `get_group_trip_enrollees&groupTripID=${groupTripID}`,
    "GET",
    null
  );

  if (!result.success) {
    list.innerHTML = "<p>Failed to load enrollees.</p>";
    return;
  }

  const travellers = result.data || [];
  title.textContent = `Enrolled Travellers (${travellers.length})`;

  list.innerHTML = travellers.length
    ? travellers.map(t => `
        <div class="enrollee-card">
          <strong>${t.firstName} ${t.lastName}</strong><br/>
          <small>${t.emailAddress}</small>
        </div>`).join("")
    : "<p>No travellers enrolled yet.</p>";
}

/* ════════════════════════════════════════════
   PACKAGES  (cross-page utility)
   agency-packages.html handles its own full
   CRUD inline.  These are lightweight helpers
   for other pages that just need to read data.
   ════════════════════════════════════════════ */

/**
 * Renders packages into #packagesContainer or #packagesTableBody
 * if those elements exist (legacy/simple pages).
 */
async function loadAgencyPackages() {
  const table     = document.getElementById("packagesTableBody");
  const container = document.getElementById("packagesContainer");
  if (!table && !container) return;

  const result = await apiRequest(PACKAGE_CONTROLLER, "list_packages");
  if (!result.success) {
    showMessage(result.message || "Could not load packages.", "error");
    return;
  }

  const packages = result.data || [];

  if (table) {
    table.innerHTML = packages.map(pkg => `
      <tr>
        <td>${pkg.packageID}</td>
        <td>${pkg.title}</td>
        <td>${pkg.destinationCity || ""}${pkg.destinationCountry ? ", " + pkg.destinationCountry : ""}</td>
        <td>${pkg.currency} ${pkg.pricePerPerson}</td>
        <td>${pkg.maxCapacity}</td>
        <td>${pkg.status}</td>
        <td>
          <button onclick="editPackage(${pkg.packageID})">Edit</button>
          <button class="danger-btn" onclick="deletePackageById(${pkg.packageID})">Delete</button>
        </td>
      </tr>
    `).join("");
  }

  if (container) {
    container.innerHTML = packages.map(pkg => `
      <div class="agency-card">
        <h3>${pkg.title}</h3>
        <p>${pkg.description || ""}</p>
        <p><strong>Destination:</strong> ${pkg.destinationCity || ""}, ${pkg.destinationCountry || ""}</p>
        <p><strong>Dates:</strong> ${pkg.startDate || "—"} to ${pkg.endDate || "—"}</p>
        <p><strong>Price:</strong> ${pkg.currency} ${pkg.pricePerPerson}</p>
        <p><strong>Capacity:</strong> ${pkg.maxCapacity}</p>
        <p><strong>Status:</strong> ${pkg.status}</p>
        <button onclick="editPackage(${pkg.packageID})">Edit</button>
        <button class="danger-btn" onclick="deletePackageById(${pkg.packageID})">Delete</button>
      </div>
    `).join("");
  }
}

/** Soft-delete a package by ID */
async function deletePackageById(packageID) {
  if (!confirm("Mark this package as inactive?")) return;

  const result = await apiRequest(
    PACKAGE_CONTROLLER,
    "delete_package",
    "POST",
    { packageID },
    true
  );

  if (result.success) {
    showMessage("Package marked inactive.");
    loadAgencyPackages();
  } else {
    showMessage(result.message || "Could not delete package.", "error");
  }
}

/* ════════════════════════════════════════════
   PAGE STARTUP
   Only hooks up elements/forms that actually
   exist on the current page.
   ════════════════════════════════════════════ */

 document.addEventListener("DOMContentLoaded", function () {
  //   Logout  
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function(e) {
      e.preventDefault();
      await fetch("logout.php");
      window.location.href = "Simple_Agent_Login.html";
    });
  }

  // Fetch a CSRF token from both controllers so any page is covered
  loadCsrfToken(PACKAGE_CONTROLLER);
  loadCsrfToken(AGENCY_CONTROLLER);

  // Dashboard page
  loadDashboardStats();
  loadPackagesSummary();
  loadBookings();
  loadReviewsSnapshot();

  // Simple list/container pages
  loadAgencyPackages();

  // Booking status filter on dashboard
  const bookingFilter = document.getElementById("booking-status-filter");
  if (bookingFilter) {
    bookingFilter.addEventListener("change", function () {
      const status = this.value.toLowerCase();
      document.querySelectorAll("#bookings-tbody tr").forEach(row => {
        const rowStatus = (row.querySelector(".status-badge")?.textContent || "").toLowerCase();
        row.style.display = !status || rowStatus === status ? "" : "none";
      });
    });
  }
});