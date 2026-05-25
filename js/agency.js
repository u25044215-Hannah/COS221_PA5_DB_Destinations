/**
 * agency.js — Tripistry Agency Frontend
 * All data pulled from the database via PHP controllers.
 * Schema: User, Traveller, Agent, Package, GroupTrip, PackageComponent,
 *         Accommodation, Restaurant, Excursion, Booking, GroupMembership,
 *         Review, Payment
 */

const PACKAGE_CONTROLLER = "../packages.php";
const AGENCY_CONTROLLER  = "../agency.php";

let csrfTokens = {};

/* ─── CORE API HELPER ─────────────────────────────────────────────── */

async function apiRequest(file, action, method = "GET", data = null, needsCsrf = false) {
  const url = `${file}?action=${action}`;
  const options = { method, headers: {} };

  if (needsCsrf) {
    if (!csrfTokens[file]) await loadCsrfToken(file);
    if (csrfTokens[file]) options.headers["X-CSRF-Token"] = csrfTokens[file];
  }

  if (data !== null) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, message: text || "Invalid JSON from server." };
    }
  } catch (err) {
    return { success: false, message: "Network error: " + err.message };
  }
}

/* ─── CSRF ────────────────────────────────────────────────────────── */

async function loadCsrfToken(file = PACKAGE_CONTROLLER) {
  try {
    const res  = await fetch(`${file}?action=get_csrf_token`);
    const json = await res.json();
    if (json.success && json.data && json.data.csrf_token) {
      csrfTokens[file] = json.data.csrf_token;
    }
  } catch (e) {
    console.warn("CSRF load failed:", e.message);
  }
  return csrfTokens[file] || null;
}

/* ─── MESSAGE BOX ─────────────────────────────────────────────────── */

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
  box._timer = setTimeout(() => { box.textContent = ""; box.className = ""; }, 3500);
}

/* ─── FORMAT HELPERS ──────────────────────────────────────────────── */

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function fmtMoney(amount, currency) {
  const sym = currency || "R";
  return `${sym} ${Number(amount || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ─── PACKAGE DROPDOWN LOADER ─────────────────────────────────────── */
/* Targets #trip-package and any select[name='packageID'] / #packageID  */

async function loadPackageOptions() {
  const selects = document.querySelectorAll("#trip-package, select[name='packageID'], #packageID");
  if (!selects.length) return;

  const result = await apiRequest(PACKAGE_CONTROLLER, "list_packages");
  if (!result.success) return;

  const packages = result.data || [];
  selects.forEach(sel => {
    sel.innerHTML =
      `<option value="">Select package…</option>` +
      packages.map(p =>
        `<option value="${p.packageID}">${p.title}${p.destinationCity ? " — " + p.destinationCity : ""}</option>`
      ).join("");
  });
}

/* ─── PACKAGES PAGE ───────────────────────────────────────────────── */
/*
 * DB fields from Package table:
 *   packageID, agentID, title, description, pricePerPerson, currency,
 *   maxCapacity, startDate, endDate, destinationCity, destinationCountry, status
 */

let _packages = [];

async function loadAgencyPackages() {
  const grid = document.getElementById("packages-manage-grid");
  const table = document.getElementById("packagesTableBody");
  if (!grid && !table) return;

  const result = await apiRequest(PACKAGE_CONTROLLER, "list_packages");
  if (!result.success) { showMessage(result.message || "Could not load packages.", "error"); return; }

  _packages = result.data || [];
  renderPackageGrid(_packages);
}

const CAT_EMOJI = { accommodation: "🏨", restaurant: "🍽️", excursion: "🧭", adventure: "🏔️", beach: "🏖️", cultural: "🏛️", luxury: "💎", family: "👨‍👩‍👧", honeymoon: "💑" };

function renderPackageGrid(packages) {
  const grid = document.getElementById("packages-manage-grid");
  if (!grid) return;

  const search  = (document.getElementById("pkg-search")?.value || "").toLowerCase();
  const statusF = (document.getElementById("pkg-status-filter")?.value || "").toLowerCase();

  const filtered = packages.filter(p =>
    (!search  || (p.title || "").toLowerCase().includes(search) ||
                 (p.destinationCity || "").toLowerCase().includes(search) ||
                 (p.destinationCountry || "").toLowerCase().includes(search)) &&
    (!statusF || (p.status || "").toLowerCase() === statusF)
  );

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state"><p>No packages found.</p><button class="btn btn-primary" onclick="openAddModal()">+ Add Package</button></div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const status = (p.status || "Active").toLowerCase();
    const price  = fmtMoney(p.pricePerPerson, p.currency);
    const dest   = [p.destinationCity, p.destinationCountry].filter(Boolean).join(", ");
    const dates  = (p.startDate || p.endDate)
      ? `${fmtDate(p.startDate)} → ${fmtDate(p.endDate)}`
      : "Dates TBD";

    return `
      <div class="pkg-manage-card">
        <div class="pkg-manage-top">
          <div class="pkg-manage-cat">✈️ ${dest || "General"}</div>
          <span class="status-badge status-badge--${status}">${p.status || "Active"}</span>
        </div>
        <h3 class="pkg-manage-name">${p.title}</h3>
        <p class="pkg-manage-dest">📍 ${dest || "—"}</p>
        <p class="pkg-manage-desc">${p.description || ""}</p>
        <div class="pkg-manage-meta">
          <div class="pkg-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${dates}
          </div>
          <div class="pkg-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            Max ${p.maxCapacity || "—"}
          </div>
        </div>
        <div class="pkg-manage-price">${price}<span> / person</span></div>
        <div class="pkg-manage-actions">
          <button class="btn btn-sm" style="background:var(--sky-light);color:var(--dark);" onclick="openEditModal(${p.packageID})">✏️ Edit</button>
          <button class="btn btn-sm" style="background:#fde8e8;color:#c0392b;" onclick="openDeleteModal(${p.packageID})">🗑️ Delete</button>
        </div>
      </div>`;
  }).join("");
}

/* Package modal open/close */
let _deletingPackageID = null;

function openAddModal() {
  document.getElementById("modal-title").textContent = "Add New Package";
  document.getElementById("edit-id").value = "";
  document.getElementById("pkg-form").reset();
  clearPkgErrors();
  document.getElementById("pkg-modal").style.display = "flex";
}

function openEditModal(packageID) {
  const p = _packages.find(x => x.packageID == packageID);
  if (!p) return;
  document.getElementById("modal-title").textContent = "Edit Package";
  document.getElementById("edit-id").value      = p.packageID;
  document.getElementById("pkg-name").value      = p.title || "";
  document.getElementById("pkg-destination").value = [p.destinationCity, p.destinationCountry].filter(Boolean).join(", ");
  document.getElementById("pkg-price").value     = p.pricePerPerson || "";
  document.getElementById("pkg-currency").value  = p.currency || "ZAR";
  document.getElementById("pkg-max").value       = p.maxCapacity || "";
  document.getElementById("pkg-start").value     = p.startDate || "";
  document.getElementById("pkg-end").value       = p.endDate || "";
  document.getElementById("pkg-description").value = p.description || "";
  document.getElementById("pkg-status").value    = p.status || "Active";
  clearPkgErrors();
  document.getElementById("pkg-modal").style.display = "flex";
}

function openDeleteModal(packageID) {
  _deletingPackageID = packageID;
  const p = _packages.find(x => x.packageID == packageID);
  document.getElementById("delete-pkg-name").textContent = p ? p.title : "";
  document.getElementById("delete-modal").style.display = "flex";
}

function closeModals() {
  document.getElementById("pkg-modal").style.display   = "none";
  document.getElementById("delete-modal").style.display = "none";
}

function clearPkgErrors() {
  ["name","destination","price","description"].forEach(f => {
    const el = document.getElementById("err-" + f);
    if (el) el.textContent = "";
  });
}

/* Package form submit → create or update via API */
async function handlePkgFormSubmit(e) {
  e.preventDefault();
  clearPkgErrors();
  let valid = true;

  const name  = document.getElementById("pkg-name").value.trim();
  const dest  = document.getElementById("pkg-destination").value.trim();
  const price = parseFloat(document.getElementById("pkg-price").value);
  const desc  = document.getElementById("pkg-description").value.trim();

  if (!name)           { document.getElementById("err-name").textContent = "Package name is required."; valid = false; }
  if (!dest)           { document.getElementById("err-destination").textContent = "Destination is required."; valid = false; }
  if (!price || price <= 0) { document.getElementById("err-price").textContent = "Enter a valid price."; valid = false; }
  if (!desc)           { document.getElementById("err-description").textContent = "Description is required."; valid = false; }
  if (!valid) return;

  /* Split "City, Country" into separate fields matching Package schema */
  const parts  = dest.split(",").map(s => s.trim());
  const city   = parts[0] || "";
  const country = parts.slice(1).join(", ") || "";

  const id = document.getElementById("edit-id").value;
  const data = {
    title:              name,
    description:        desc,
    pricePerPerson:     price,
    currency:           document.getElementById("pkg-currency").value || "ZAR",
    maxCapacity:        parseInt(document.getElementById("pkg-max").value) || null,
    startDate:          document.getElementById("pkg-start").value || null,
    endDate:            document.getElementById("pkg-end").value   || null,
    destinationCity:    city,
    destinationCountry: country,
    status:             document.getElementById("pkg-status").value || "Active"
  };

  let result;
  if (id) {
    data.packageID = id;
    result = await apiRequest(PACKAGE_CONTROLLER, "update_package", "POST", data, true);
    if (result.success) { showMessage("Package updated."); closeModals(); loadAgencyPackages(); loadPackageOptions(); loadDashboardStats(); }
    else showMessage(result.message || "Could not update package.", "error");
  } else {
    result = await apiRequest(PACKAGE_CONTROLLER, "create_package", "POST", data, true);
    if (result.success) { showMessage("Package created."); closeModals(); loadAgencyPackages(); loadPackageOptions(); loadDashboardStats(); }
    else showMessage(result.message || "Could not create package.", "error");
  }
}

async function confirmDeletePackage() {
  if (!_deletingPackageID) return;
  const result = await apiRequest(PACKAGE_CONTROLLER, "delete_package", "POST", { packageID: _deletingPackageID }, true);
  if (result.success) {
    showMessage("Package deleted.");
    closeModals();
    _deletingPackageID = null;
    loadAgencyPackages();
    loadPackageOptions();
    loadDashboardStats();
  } else {
    showMessage(result.message || "Could not delete package.", "error");
  }
}

/* ─── DASHBOARD STATS ─────────────────────────────────────────────── */
/*
 * Reads from:
 *   packageCount   (Package table count)
 *   bookingCount   (Booking table count)
 *   stat-revenue   (SUM of Booking.totalPrice — from get_dashboard_stats)
 *   stat-rating    (AVG of Review.overallScore — from get_dashboard_stats)
 *   stat-pending   (COUNT Booking WHERE status='Pending')
 */

async function loadDashboardStats() {
  const [pkgRes, bkgRes, tripsRes, statsRes] = await Promise.all([
    apiRequest(PACKAGE_CONTROLLER, "list_packages"),
    apiRequest(AGENCY_CONTROLLER,  "list_bookings"),
    apiRequest(AGENCY_CONTROLLER,  "list_group_trips"),
    apiRequest(AGENCY_CONTROLLER,  "get_dashboard_stats")
  ]);

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  if (pkgRes.success)   set("packageCount",   (pkgRes.data || []).length);
  if (bkgRes.success) {
    const bookings = bkgRes.data || [];
    set("bookingCount", bookings.length);
    set("stat-pending", bookings.filter(b => (b.status || "").toLowerCase() === "pending").length);
  }
  if (tripsRes.success) set("groupTripCount", (tripsRes.data || []).length);

  if (statsRes.success && statsRes.data) {
    const s = statsRes.data;
    const revEl = document.getElementById("stat-revenue");
    if (revEl) {
      const rev = parseFloat(s.totalRevenue || 0);
      revEl.textContent = rev > 0 ? fmtMoney(rev, "R") : "—";
    }
    const ratEl = document.getElementById("stat-rating");
    if (ratEl) {
      const rating = parseFloat(s.avgRating || 0);
      ratEl.textContent = rating > 0 ? rating.toFixed(1) + " ★" : "—";
    }
  }
}

/* ─── PACKAGES SIDEBAR SUMMARY ────────────────────────────────────── */
/*
 * Uses Package fields: title, pricePerPerson, currency, destinationCity, destinationCountry
 */

async function loadPackagesSummary() {
  const list = document.getElementById("packages-summary");
  if (!list) return;

  const result = await apiRequest(PACKAGE_CONTROLLER, "list_packages");
  if (!result.success) return;

  const packages = result.data || [];
  list.innerHTML = packages.length
    ? packages.slice(0, 5).map(p => `
        <li class="pkg-summary-item">
          <div class="pkg-summary-info">
            <span class="pkg-summary-name">${p.title}</span>
            <span class="pkg-summary-price">${fmtMoney(p.pricePerPerson, p.currency)}</span>
          </div>
          <span class="pkg-summary-bookings">
            ${[p.destinationCity, p.destinationCountry].filter(Boolean).join(", ") || "—"}
          </span>
        </li>`).join("")
    : "<li>No packages yet.</li>";
}

/* ─── BOOKINGS ────────────────────────────────────────────────────── */
/*
 * Booking schema: bookingID, userID, agentID, packageID, groupTripID,
 *                 numGuests, totalPrice, status, bookedAt
 * Backend must JOIN User to get firstName + lastName,
 *             JOIN Package to get title (as packageTitle),
 *             and return currency from Package or Booking.
 */

async function loadBookings() {
  const tbody = document.getElementById("bookings-tbody");
  if (!tbody) return;

  const result = await apiRequest(AGENCY_CONTROLLER, "list_bookings");
  if (!result.success) { showMessage("Failed to load bookings.", "error"); return; }

  const bookings = result.data || [];
  if (!bookings.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--grey-text);">No bookings yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = bookings.map(b => {
    const status   = (b.status || "").toLowerCase();
    const traveller = [b.firstName, b.lastName].filter(Boolean).join(" ") || `User #${b.userID}`;
    const pkg      = b.packageTitle || b.title || `Package #${b.packageID}`;
    const amount   = fmtMoney(b.totalPrice, b.currency);
    const date     = b.bookedAt ? new Date(b.bookedAt).toLocaleDateString("en-ZA") : "—";

    return `
      <tr>
        <td><span class="booking-id">BK-${b.bookingID}</span></td>
        <td>${traveller}</td>
        <td>${pkg}</td>
        <td>${date}</td>
        <td><strong>${amount}</strong></td>
        <td><span class="status-badge status-badge--${status}">${b.status || ""}</span></td>
        <td>
          <div class="table-actions">
            <button class="tbl-btn tbl-btn--view" title="View">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
  }).join("");
}

/* ─── REVIEWS SNAPSHOT ────────────────────────────────────────────── */
/*
 * Review schema: reviewID, userID, packageID, comment, overallScore,
 *                cleanlinessScore, serviceScore
 * Backend must JOIN User to get travellerName (firstName + lastName)
 *             JOIN Package to get packageTitle
 */

async function loadReviewsSnapshot() {
  const list = document.getElementById("reviews-snapshot");
  if (!list) return;

  const result = await apiRequest(AGENCY_CONTROLLER, "get_dashboard_stats");
  if (!result.success || !result.data?.recentReviews) {
    list.innerHTML = `<li style="color:var(--grey-text);font-size:0.85rem;">No reviews yet.</li>`;
    return;
  }

  const reviews = result.data.recentReviews;
  if (!reviews.length) {
    list.innerHTML = `<li style="color:var(--grey-text);font-size:0.85rem;">No reviews yet.</li>`;
    return;
  }

  list.innerHTML = reviews.map(r => {
    const score = Math.min(5, Math.max(0, parseInt(r.overallScore || 0)));
    const name  = r.travellerName || [r.firstName, r.lastName].filter(Boolean).join(" ") || "Traveller";
    return `
      <li class="review-snap-item">
        <div class="review-snap-header">
          <span class="review-snap-name">${name}</span>
          <span class="review-snap-stars" style="color:#f59e0b;">${"★".repeat(score)}${"☆".repeat(5 - score)}</span>
        </div>
        <p class="review-snap-text">${r.comment || ""}</p>
        <span class="review-snap-pkg">${r.packageTitle || ""}</span>
      </li>`;
  }).join("");
}

/* ─── GROUP TRIPS ─────────────────────────────────────────────────── */
/*
 * GroupTrip schema: groupTripID, groupName, currentMembers, packageID
 * Backend list_group_trips should JOIN Package to get:
 *   packageTitle (Package.title), destinationCity, destinationCountry,
 *   startDate, endDate, maxCapacity, currency, pricePerPerson
 * There is NO status, departureDate, returnDate, maxGroupSize on GroupTrip itself.
 */

async function loadGroupTrips() {
  if (typeof loadGroupTripsPage === "function") return loadGroupTripsPage();

  const grid = document.getElementById("trips-grid");
  if (!grid) return;

  const result = await apiRequest(AGENCY_CONTROLLER, "list_group_trips");
  if (!result.success) { showMessage(result.message || "Could not load group trips.", "error"); return; }

  renderGroupTripsGrid(result.data || []);
}

function renderGroupTripsGrid(trips) {
  const grid = document.getElementById("trips-grid");
  if (!grid) return;

  if (!trips.length) {
    grid.innerHTML = `<p class="empty-state">No group trips yet.</p>`;
    return;
  }

  grid.innerHTML = trips.map(t => {
    const enrolled  = parseInt(t.currentMembers || 0);
    const max       = parseInt(t.maxCapacity || 0);
    const spotsLeft = max > 0 ? Math.max(0, max - enrolled) : "—";
    const pct       = max > 0 ? Math.round((enrolled / max) * 100) : 0;
    const pkgLabel  = t.packageTitle || `Package #${t.packageID}`;
    const dest      = [t.destinationCity, t.destinationCountry].filter(Boolean).join(", ");

    return `
      <div class="trip-card">
        <div class="trip-card-top">
          <div>
            <span class="trip-pkg-label">${pkgLabel}</span>
            <h3 class="trip-card-name">${t.groupName}</h3>
          </div>
        </div>
        ${dest ? `<p style="color:var(--grey-text);font-size:0.85rem;margin:4px 0 8px;">📍 ${dest}</p>` : ""}
        ${(t.startDate || t.endDate) ? `
        <div class="trip-dates">
          <div class="trip-date-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>${fmtDate(t.startDate)} → ${fmtDate(t.endDate)}</span>
          </div>
        </div>` : ""}
        ${max > 0 ? `
        <div class="trip-capacity">
          <div class="capacity-labels">
            <span>${enrolled} enrolled</span>
            <span>${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left</span>
          </div>
          <div class="capacity-bar">
            <div class="capacity-fill capacity-fill--${pct >= 100 ? "full" : pct > 70 ? "high" : "low"}" style="width:${pct}%"></div>
          </div>
          <div class="capacity-max">Max ${max} travellers</div>
        </div>` : `<p style="margin:8px 0;"><strong>${enrolled}</strong> members</p>`}
        <div class="trip-actions">
          <button class="btn btn-sm" style="background:var(--sky-light);color:var(--dark);flex:1;" onclick="openEnrolleesModal(${t.groupTripID})">
            👥 Enrollees (${enrolled})
          </button>
          <button class="btn btn-sm" style="background:#fde8e8;color:#c0392b;" onclick="deleteGroupTrip(${t.groupTripID})" title="Delete">🗑️</button>
        </div>
      </div>`;
  }).join("");
}

async function createGroupTrip(event) {
  event.preventDefault();
  const form = event.target;

  /* GroupTrip schema only has: groupName, currentMembers, packageID */
  const data = {
    groupName:      form.groupName.value,
    currentMembers: parseInt(form.currentMembers?.value || 0),
    packageID:      form.packageID.value
  };

  const result = await apiRequest(AGENCY_CONTROLLER, "create_group_trip", "POST", data, true);
  if (result.success) {
    showMessage("Group trip created.");
    form.reset();
    loadGroupTrips();
    loadDashboardStats();
  } else {
    showMessage(result.message || "Could not create group trip.", "error");
  }
}

async function deleteGroupTrip(groupTripID) {
  if (!confirm("Delete this group trip?")) return;
  const result = await apiRequest(AGENCY_CONTROLLER, "delete_group_trip", "POST", { groupTripID }, true);
  if (result.success) {
    showMessage("Group trip deleted.");
    loadGroupTrips();
    loadDashboardStats();
  } else {
    showMessage(result.message || "Could not delete group trip.", "error");
  }
}

/* ─── ENROLLEES MODAL ─────────────────────────────────────────────── */
/*
 * GroupMembership schema: membershipID, userID, groupTripID, role, joinedAt, paymentStatus
 * Backend get_group_trip_enrollees must JOIN User to return:
 *   firstName, lastName, emailAddress, role, paymentStatus
 */

async function openEnrolleesModal(groupTripID) {
  const modal = document.getElementById("enrollees-modal");
  const list  = document.getElementById("enrollees-list");
  const title = document.getElementById("enrollees-title");
  if (!modal || !list) return;

  modal.style.display = "flex";
  list.innerHTML = "<p>Loading…</p>";

  const result = await apiRequest(AGENCY_CONTROLLER, `get_group_trip_enrollees&groupTripID=${groupTripID}`);
  if (!result.success) { list.innerHTML = "<p>Failed to load enrollees.</p>"; return; }

  const members = result.data || [];
  if (title) title.textContent = `Enrolled Travellers (${members.length})`;

  list.innerHTML = members.length
    ? `<table class="bookings-table" style="margin-top:8px;">
        <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Payment</th></tr></thead>
        <tbody>
          ${members.map((m, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${m.firstName || ""} ${m.lastName || ""}</td>
              <td><small>${m.emailAddress || "—"}</small></td>
              <td>${m.role || "Member"}</td>
              <td><span class="status-badge status-badge--${(m.paymentStatus || "pending").toLowerCase()}">${m.paymentStatus || "Pending"}</span></td>
            </tr>`).join("")}
        </tbody>
      </table>`
    : "<p style='color:var(--grey-text);padding:16px 0;'>No members enrolled yet.</p>";
}

/* ─── COMPONENTS ──────────────────────────────────────────────────── */
/*
 * PackageComponent schema: componentID, packageID, componentType (Accommodation/Restaurant/Excursion),
 *                          name, city, country, description
 * Backend list_components should JOIN Package to return packageTitle.
 */

async function loadComponents() {
  const table = document.getElementById("componentsTableBody");
  if (!table) return;

  const result = await apiRequest(AGENCY_CONTROLLER, "list_components");
  if (!result.success) { showMessage(result.message || "Could not load components.", "error"); return; }

  const components = result.data || [];
  table.innerHTML = components.length
    ? components.map(c => `
        <tr>
          <td>${c.componentID}</td>
          <td>${c.packageTitle || `Package #${c.packageID}`}</td>
          <td>${c.componentType}</td>
          <td>${c.name}</td>
          <td>${c.city || "—"}</td>
          <td>${c.country || "—"}</td>
          <td><button class="danger-btn" onclick="deleteComponent(${c.componentID})">Delete</button></td>
        </tr>`).join("")
    : `<tr><td colspan="7" style="text-align:center;">No components found.</td></tr>`;
}

async function createComponent(event) {
  event.preventDefault();
  const form = event.target;

  /* PackageComponent base fields + sub-type fields */
  const data = {
    packageID:     form.packageID.value,
    componentType: form.componentType.value,
    name:          form.name.value,
    city:          form.city?.value || "",
    country:       form.country?.value || "",
    description:   form.description?.value || "",
    /* Accommodation */
    propertyType:  form.propertyType?.value || "",
    starRating:    form.starRating?.value   || "",
    amenities:     form.amenities?.value    || "",
    address:       form.address?.value      || "",
    /* Restaurant */
    cuisineType:   form.cuisineType?.value  || "",
    priceTier:     form.priceTier?.value    || "",
    /* Excursion */
    duration:      form.duration?.value     || "",
    difficulty:    form.difficulty?.value   || "",
    meetingPoint:  form.meetingPoint?.value || "",
    maxGroupSize:  form.maxGroupSize?.value || ""
  };

  const result = await apiRequest(AGENCY_CONTROLLER, "create_component", "POST", data, true);
  if (result.success) {
    showMessage("Component created.");
    form.reset();
    loadComponents();
    loadDashboardStats();
  } else {
    showMessage(result.message || "Could not create component.", "error");
  }
}

async function deleteComponent(componentID) {
  if (!confirm("Delete this component?")) return;
  const result = await apiRequest(AGENCY_CONTROLLER, "delete_component", "POST", { componentID }, true);
  if (result.success) {
    showMessage("Component deleted.");
    loadComponents();
    loadDashboardStats();
  } else {
    showMessage(result.message || "Could not delete component.", "error");
  }
}

/* ─── LOGOUT ──────────────────────────────────────────────────────── */

function setupLogout() {
  const btn = document.getElementById("logout-btn");
  if (!btn) return;

  btn.addEventListener("click", async e => {
    e.preventDefault();

    try {
      await fetch("../logout.php");
    } catch (err) {
      console.warn("Logout failed:", err.message);
    }

    window.location.href = "../traveller ui/login.html";
  });
}

/* ─── BOOKING STATUS FILTER (dashboard) ──────────────────────────── */

function setupBookingStatusFilter() {
  const filter = document.getElementById("booking-status-filter");
  if (!filter) return;
  filter.addEventListener("change", function () {
    const val = this.value.toLowerCase();
    document.querySelectorAll("#bookings-tbody tr").forEach(row => {
      const badge = (row.querySelector(".status-badge")?.textContent || "").trim().toLowerCase();
      row.style.display = !val || badge === val ? "" : "none";
    });
  });
}

/* ─── PACKAGE PAGE SEARCH/FILTER ─────────────────────────────────── */

function setupPackageFilters() {
  document.getElementById("pkg-search")?.addEventListener("input", () => renderPackageGrid(_packages));
  document.getElementById("pkg-status-filter")?.addEventListener("change", () => renderPackageGrid(_packages));
  document.getElementById("add-pkg-btn")?.addEventListener("click", openAddModal);

  const pkgForm = document.getElementById("pkg-form");
  if (pkgForm) pkgForm.addEventListener("submit", handlePkgFormSubmit);

  document.getElementById("close-modal")?.addEventListener("click", closeModals);
  document.getElementById("cancel-modal")?.addEventListener("click", closeModals);
  document.getElementById("pkg-modal")?.addEventListener("click", e => { if (e.target === e.currentTarget) closeModals(); });

  document.getElementById("confirm-delete")?.addEventListener("click", confirmDeletePackage);
  document.getElementById("close-delete-modal")?.addEventListener("click", closeModals);
  document.getElementById("cancel-delete")?.addEventListener("click", closeModals);
  document.getElementById("delete-modal")?.addEventListener("click", e => { if (e.target === e.currentTarget) closeModals(); });
}

/* ─── LEGACY FORM LISTENERS (other pages) ────────────────────────── */

function setupForms() {
  document.getElementById("createPackageForm")?.addEventListener("submit", handlePkgFormSubmit);
  document.getElementById("createGroupTripForm")?.addEventListener("submit", createGroupTrip);
  document.getElementById("createComponentForm")?.addEventListener("submit", createComponent);
}

/* ─── PAGE STARTUP ────────────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", async function () {
  await Promise.all([
    loadCsrfToken(PACKAGE_CONTROLLER),
    loadCsrfToken(AGENCY_CONTROLLER)
  ]);

  setupLogout();
  setupForms();
  setupPackageFilters();
  setupBookingStatusFilter();

  loadPackageOptions();
  loadAgencyPackages();
  loadGroupTrips();
  loadComponents();
  loadDashboardStats();
  loadPackagesSummary();
  loadBookings();
  loadReviewsSnapshot();
});
