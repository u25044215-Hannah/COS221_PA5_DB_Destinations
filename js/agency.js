/**
 * agency.js — Tripistry Agency Frontend
 * Uses one shared login page for Traveller + Agent.
 */

const PACKAGE_CONTROLLER = "../packages.php";
const AGENCY_CONTROLLER  = "../agency.php";
const LOGOUT_CONTROLLER  = "../logout.php";
const LOGIN_PAGE         = "../traveller ui/login.html";

let csrfTokens = {};
let _packages = [];
let _deletingPackageID = null;

/* =========================
   CORE API
========================= */

async function apiRequest(file, action, method = "GET", data = null, needsCsrf = false) {
  const url = `${file}?action=${action}`;

  const options = {
    method,
    headers: {}
  };

  if (needsCsrf) {
    if (!csrfTokens[file]) {
      await loadCsrfToken(file);
    }

    if (csrfTokens[file]) {
      options.headers["X-CSRF-Token"] = csrfTokens[file];
    }
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
      return {
        success: false,
        message: text || "Invalid JSON from server."
      };
    }
  } catch (err) {
    return {
      success: false,
      message: "Network error: " + err.message
    };
  }
}

/* =========================
   CSRF
========================= */

async function loadCsrfToken(file = PACKAGE_CONTROLLER) {
  try {
    const response = await fetch(`${file}?action=get_csrf_token`);
    const result = await response.json();

    if (result.success && result.data && result.data.csrf_token) {
      csrfTokens[file] = result.data.csrf_token;
    }
  } catch (err) {
    console.warn("CSRF load failed:", err.message);
  }

  return csrfTokens[file] || null;
}

/* =========================
   UI HELPERS
========================= */

function showMessage(message, type = "success") {
  let box = document.getElementById("messageBox");

  if (!box) {
    box = document.createElement("div");
    box.id = "messageBox";
    document.body.prepend(box);
  }

  box.textContent = message;
  box.className = type === "success" ? "success-message" : "error-message";

  clearTimeout(box._timer);

  box._timer = setTimeout(function () {
    box.textContent = "";
    box.className = "";
  }, 3500);
}

function fmtDate(dateValue) {
  if (!dateValue) return "—";

  return new Date(dateValue).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function fmtMoney(amount, currency) {
  const curr = currency || "ZAR";

  return `${curr} ${Number(amount || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/* =========================
   PACKAGE OPTIONS
========================= */

async function loadPackageOptions() {
  const selects = document.querySelectorAll(
    "#trip-package, select[name='packageID'], #packageID"
  );

  if (!selects.length) return;

  const result = await apiRequest(PACKAGE_CONTROLLER, "list_packages");

  if (!result.success) return;

  const packages = result.data || [];

  selects.forEach(function (select) {
    select.innerHTML =
      `<option value="">Select package…</option>` +
      packages.map(function (pkg) {
        return `
          <option value="${pkg.packageID}">
            ${pkg.title}${pkg.destinationCity ? " — " + pkg.destinationCity : ""}
          </option>
        `;
      }).join("");
  });
}

/* =========================
   PACKAGES
========================= */

async function loadAgencyPackages() {
  const grid = document.getElementById("packages-manage-grid");

  if (!grid) return;

  grid.innerHTML = `<p style="color:var(--grey-text);padding:2rem 0;">Loading packages...</p>`;

  const result = await apiRequest(PACKAGE_CONTROLLER, "list_packages");

  console.log("Packages result:", result);

  if (!result.success) {
    grid.innerHTML = `<p class="empty-state">${result.message || "Could not load packages."}</p>`;
    showMessage(result.message || "Could not load packages.", "error");
    return;
  }

  _packages = result.data || [];
  renderPackageGrid(_packages);
}
function renderPackageGrid(packages) {
  const grid = document.getElementById("packages-manage-grid");

  if (!grid) return;

  const search = (document.getElementById("pkg-search")?.value || "")
    .trim()
    .toLowerCase();

  const statusFilter = (document.getElementById("pkg-status-filter")?.value || "")
    .trim()
    .toLowerCase();

  const filtered = packages.filter(function (pkg) {
    const title = (pkg.title || "").toLowerCase();
    const city = (pkg.destinationCity || "").toLowerCase();
    const country = (pkg.destinationCountry || "").toLowerCase();
    const packageStatus = (pkg.status || "").trim().toLowerCase();

    const matchesSearch =
      !search ||
      title.includes(search) ||
      city.includes(search) ||
      country.includes(search);

    const matchesStatus =
      !statusFilter || packageStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <p>No packages found.</p>
        <button class="btn btn-primary" onclick="openAddModal()">+ Add Package</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(function (pkg) {
    const statusText = pkg.status || "Active";
    const statusClass = statusText.trim().toLowerCase();

    const destination = [pkg.destinationCity, pkg.destinationCountry]
      .filter(Boolean)
      .join(", ");

    const dates = pkg.startDate || pkg.endDate
      ? `${fmtDate(pkg.startDate)} → ${fmtDate(pkg.endDate)}`
      : "Dates TBD";

    return `
      <div class="pkg-manage-card">
        <div class="pkg-manage-top">
          <div class="pkg-manage-cat">✈️ ${destination || "General"}</div>
          <span class="status-badge status-badge--${statusClass}">
            ${statusText}
          </span>
        </div>

        <h3 class="pkg-manage-name">${pkg.title || "Untitled Package"}</h3>
        <p class="pkg-manage-dest">📍 ${destination || "—"}</p>
        <p class="pkg-manage-desc">${pkg.description || ""}</p>

        <div class="pkg-manage-meta">
          <div class="pkg-meta-item">${dates}</div>
          <div class="pkg-meta-item">Max ${pkg.maxCapacity || "—"}</div>
        </div>

        <div class="pkg-manage-price">
          ${fmtMoney(pkg.pricePerPerson, pkg.currency)}
          <span> / person</span>
        </div>

        <div class="pkg-manage-actions">
          <button class="btn btn-sm" style="background:var(--sky-light);color:var(--dark);" onclick="openEditModal(${pkg.packageID})">
            ✏️ Edit
          </button>
          <button class="btn btn-sm" style="background:#fde8e8;color:#c0392b;" onclick="openDeleteModal(${pkg.packageID})">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
  }).join("");
}

/* =========================
   PACKAGE MODALS
========================= */

function openAddModal() {
  const form = document.getElementById("pkg-form");

  document.getElementById("modal-title").textContent = "Add New Package";
  document.getElementById("edit-id").value = "";

  if (form) form.reset();

  clearPkgErrors();
  document.getElementById("pkg-modal").style.display = "flex";
}

function openEditModal(packageID) {
  const pkg = _packages.find(function (item) {
    return item.packageID == packageID;
  });

  if (!pkg) return;

  document.getElementById("modal-title").textContent = "Edit Package";
  document.getElementById("edit-id").value = pkg.packageID;
  document.getElementById("pkg-name").value = pkg.title || "";
  document.getElementById("pkg-destination").value =
    [pkg.destinationCity, pkg.destinationCountry].filter(Boolean).join(", ");
  document.getElementById("pkg-price").value = pkg.pricePerPerson || "";
  document.getElementById("pkg-currency").value = pkg.currency || "ZAR";
  document.getElementById("pkg-max").value = pkg.maxCapacity || "";
  document.getElementById("pkg-start").value = pkg.startDate || "";
  document.getElementById("pkg-end").value = pkg.endDate || "";
  document.getElementById("pkg-description").value = pkg.description || "";
  document.getElementById("pkg-status").value = pkg.status || "Active";

  clearPkgErrors();
  document.getElementById("pkg-modal").style.display = "flex";
}

function openDeleteModal(packageID) {
  _deletingPackageID = packageID;

  const pkg = _packages.find(function (item) {
    return item.packageID == packageID;
  });

  document.getElementById("delete-pkg-name").textContent = pkg ? pkg.title : "";
  document.getElementById("delete-modal").style.display = "flex";
}

function closeModals() {
  const pkgModal = document.getElementById("pkg-modal");
  const deleteModal = document.getElementById("delete-modal");

  if (pkgModal) pkgModal.style.display = "none";
  if (deleteModal) deleteModal.style.display = "none";
}

function clearPkgErrors() {
  ["name", "destination", "price", "description"].forEach(function (field) {
    const el = document.getElementById("err-" + field);
    if (el) el.textContent = "";
  });
}

/* =========================
   CREATE / UPDATE PACKAGE
========================= */

async function handlePkgFormSubmit(event) {
  event.preventDefault();
  clearPkgErrors();

  let valid = true;

  const title = document.getElementById("pkg-name").value.trim();
  const destination = document.getElementById("pkg-destination").value.trim();
  const price = parseFloat(document.getElementById("pkg-price").value);
  const description = document.getElementById("pkg-description").value.trim();

  if (!title) {
    document.getElementById("err-name").textContent = "Package name is required.";
    valid = false;
  }

  if (!destination) {
    document.getElementById("err-destination").textContent = "Destination is required.";
    valid = false;
  }

  if (!price || price <= 0) {
    document.getElementById("err-price").textContent = "Enter a valid price.";
    valid = false;
  }

  if (!description) {
    document.getElementById("err-description").textContent = "Description is required.";
    valid = false;
  }

  if (!valid) return;

  const parts = destination.split(",").map(function (part) {
    return part.trim();
  });

  const city = parts[0] || "";
  const country = parts.slice(1).join(", ") || "";

  const packageID = document.getElementById("edit-id").value;

  const data = {
    title: title,
    description: description,
    pricePerPerson: price,
    currency: document.getElementById("pkg-currency").value || "ZAR",
    maxCapacity: parseInt(document.getElementById("pkg-max").value) || 1,
    startDate: document.getElementById("pkg-start").value || "",
    endDate: document.getElementById("pkg-end").value || "",
    destinationCity: city,
    destinationCountry: country,
    status: document.getElementById("pkg-status").value || "Active"
  };

  let action = "create_package";

  if (packageID) {
    data.packageID = packageID;
    action = "update_package";
  }

  const result = await apiRequest(
    PACKAGE_CONTROLLER,
    action,
    "POST",
    data,
    true
  );

  if (result.success) {
    showMessage(packageID ? "Package updated." : "Package created.");
    closeModals();

    await loadAgencyPackages();
    await loadPackageOptions();
    await loadDashboardStats();
  } else {
    showMessage(result.message || "Could not save package.", "error");
  }
}

async function confirmDeletePackage() {
  if (!_deletingPackageID) return;

  const result = await apiRequest(
    PACKAGE_CONTROLLER,
    "delete_package",
    "POST",
    { packageID: _deletingPackageID },
    true
  );

  if (result.success) {
    showMessage("Package deleted.");
    closeModals();

    _deletingPackageID = null;

    await loadAgencyPackages();
    await loadPackageOptions();
    await loadDashboardStats();
  } else {
    showMessage(result.message || "Could not delete package.", "error");
  }
}

/* =========================
   GROUP TRIPS
========================= */
async function loadGroupTrips() {
  const grid = document.getElementById("trips-grid");

  const result = await apiRequest(AGENCY_CONTROLLER, "list_group_trips");

  if (!result.success) {
    showMessage(result.message || "Could not load group trips.", "error");
    return;
  }

  const trips = result.data || [];

  updateGroupTripStats(trips);

  if (!grid) return;

  if (!trips.length) {
    grid.innerHTML = `<p class="empty-state">No group trips yet.</p>`;
    return;
  }

  grid.innerHTML = trips.map(function (trip) {
    const packageTitle = trip.packageTitle || `Package #${trip.packageID}`;
    const destination = [trip.destinationCity, trip.destinationCountry].filter(Boolean).join(", ");

    return `
      <div class="trip-card">
        <div class="trip-card-top">
          <div>
            <span class="trip-pkg-label">${packageTitle}</span>
            <h3 class="trip-card-name">${trip.groupName}</h3>
          </div>
        </div>

        ${destination ? `<p style="color:var(--grey-text);font-size:0.85rem;">📍 ${destination}</p>` : ""}

        <p><strong>${trip.currentMembers || 0}</strong> members</p>

        <div class="trip-actions">
          <button class="btn btn-sm" style="background:#fde8e8;color:#c0392b;" onclick="deleteGroupTrip(${trip.groupTripID})">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
  }).join("");
}

async function deleteGroupTrip(groupTripID) {
  if (!confirm("Delete this group trip?")) return;

  const result = await apiRequest(
    AGENCY_CONTROLLER,
    "delete_group_trip",
    "POST",
    { groupTripID },
    true
  );

  if (result.success) {
    showMessage("Group trip deleted.");

    await loadGroupTrips();
    await loadDashboardStats();
  } else {
    showMessage(result.message || "Could not delete group trip.", "error");
  }
}

function updateGroupTripStats(trips) {
  const totalTrips = trips.length;
  const totalMembers = trips.reduce(function (sum, trip) {
    return sum + parseInt(trip.currentMembers || 0);
  }, 0);

  const avgMembers = totalTrips > 0
    ? (totalMembers / totalTrips).toFixed(1)
    : "0";

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  setText("groupTripCount", totalTrips);
  setText("tripCount", totalTrips);
  setText("stat-trips", totalTrips);

  setText("groupMemberCount", totalMembers);
  setText("stat-group-members", totalMembers);

  setText("avgGroupSize", avgMembers);
  setText("stat-average-group-size", avgMembers);
}

function renderGroupTripsGrid(trips) {
  const grid = document.getElementById("trips-grid");

  if (!grid) return;

  if (!trips.length) {
    grid.innerHTML = `<p class="empty-state">No group trips yet.</p>`;
    return;
  }

  grid.innerHTML = trips.map(function (trip) {
    const packageTitle = trip.packageTitle || `Package #${trip.packageID}`;
    const destination = [trip.destinationCity, trip.destinationCountry]
      .filter(Boolean)
      .join(", ");

    return `
      <div class="trip-card">
        <div class="trip-card-top">
          <div>
            <span class="trip-pkg-label">${packageTitle}</span>
            <h3 class="trip-card-name">${trip.groupName}</h3>
          </div>
        </div>

        ${destination ? `<p style="color:var(--grey-text);font-size:0.85rem;">📍 ${destination}</p>` : ""}

        <p><strong>${trip.currentMembers || 0}</strong> members</p>

        <div class="trip-actions">
          <button class="btn btn-sm" style="background:#fde8e8;color:#c0392b;" onclick="deleteGroupTrip(${trip.groupTripID})">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
  }).join("");
}

/* =========================
   DASHBOARD
========================= */

async function loadDashboardStats() {
  const [pkgRes, bookingRes, tripRes, statsRes] = await Promise.all([
    apiRequest(PACKAGE_CONTROLLER, "list_packages"),
    apiRequest(AGENCY_CONTROLLER, "list_bookings"),
    apiRequest(AGENCY_CONTROLLER, "list_group_trips"),
    apiRequest(AGENCY_CONTROLLER, "get_dashboard_stats")
  ]);

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  if (pkgRes.success) {
    setText("packageCount", (pkgRes.data || []).length);
  }

  if (bookingRes.success) {
    const bookings = bookingRes.data || [];
    setText("bookingCount", bookings.length);
    setText(
      "stat-pending",
      bookings.filter(b => (b.status || "").toLowerCase() === "pending").length
    );
  }

  if (tripRes.success) {
  const tripCount = (tripRes.data || []).length;

  setText("groupTripCount", tripCount);
  setText("tripCount", tripCount);
  setText("stat-trips", tripCount);
}

  if (statsRes.success && statsRes.data) {
    const revenue = parseFloat(statsRes.data.totalRevenue || 0);
    const rating = parseFloat(statsRes.data.avgRating || 0);

    setText(
      "stat-revenue",
      revenue > 0
        ? "R " + revenue.toLocaleString("en-ZA", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })
        : "—"
    );

    setText(
      "stat-rating",
      rating > 0 ? rating.toFixed(1) + " ★" : "—"
    );
  }
}

async function loadPackagesSummary() {
  const list = document.getElementById("packages-summary");

  if (!list) return;

  const result = await apiRequest(PACKAGE_CONTROLLER, "list_packages");

  if (!result.success) return;

  const packages = result.data || [];

  list.innerHTML = packages.length
    ? packages.slice(0, 5).map(function (pkg) {
        return `
          <li class="pkg-summary-item">
            <div class="pkg-summary-info">
              <span class="pkg-summary-name">${pkg.title}</span>
              <span class="pkg-summary-price">${fmtMoney(pkg.pricePerPerson, pkg.currency)}</span>
            </div>
          </li>
        `;
      }).join("")
    : "<li>No packages yet.</li>";
}

async function loadBookings() {
  const tbody = document.getElementById("bookings-tbody");
  if (!tbody) return;

  const result = await apiRequest(AGENCY_CONTROLLER, "list_bookings");

  if (!result.success) {
    showMessage(result.message || "Could not load bookings.", "error");
    return;
  }

  const bookings = result.data || [];

  tbody.innerHTML = bookings.length
    ? bookings.map(b => `
        <tr>
          <td>${b.bookingID}</td>
          <td>${b.firstName || ""} ${b.lastName || ""}</td>
          <td>${b.packageTitle || ""}</td>
          <td>${b.bookedAt || ""}</td>
          <td>${b.currency || "ZAR"} ${b.totalPrice || "0.00"}</td>
          <td><span class="status-badge status-badge--${(b.status || "").toLowerCase()}">${b.status || ""}</span></td>
        </tr>
      `).join("")
    : `<tr><td colspan="6" style="text-align:center;">No bookings yet.</td></tr>`;
}

/* =========================
   LOGOUT
========================= */

function setupLogout() {
  const btn = document.getElementById("logout-btn");

  if (!btn) return;

  btn.addEventListener("click", async function (event) {
    event.preventDefault();

    try {
      await fetch(LOGOUT_CONTROLLER);
    } catch (err) {
      console.warn("Logout failed:", err.message);
    }

    window.location.href = LOGIN_PAGE;
  });
}

/* =========================
   SETUP
========================= */

function setupPackagePage() {
  document.getElementById("pkg-search")?.addEventListener("input", function () {
    renderPackageGrid(_packages);
  });

  document.getElementById("pkg-status-filter")?.addEventListener("change", function () {
    renderPackageGrid(_packages);
  });

  document.getElementById("add-pkg-btn")?.addEventListener("click", openAddModal);

  document.getElementById("pkg-form")?.addEventListener("submit", handlePkgFormSubmit);

  document.getElementById("close-modal")?.addEventListener("click", closeModals);
  document.getElementById("cancel-modal")?.addEventListener("click", closeModals);

  document.getElementById("pkg-modal")?.addEventListener("click", function (event) {
    if (event.target === event.currentTarget) {
      closeModals();
    }
  });

  document.getElementById("confirm-delete")?.addEventListener("click", confirmDeletePackage);
  document.getElementById("close-delete-modal")?.addEventListener("click", closeModals);
  document.getElementById("cancel-delete")?.addEventListener("click", closeModals);

  document.getElementById("delete-modal")?.addEventListener("click", function (event) {
    if (event.target === event.currentTarget) {
      closeModals();
    }
  });
}

function setupOtherForms() {
  document.getElementById("createGroupTripForm")?.addEventListener("submit", createGroupTrip);
}

/* =========================
   PAGE STARTUP
========================= */

document.addEventListener("DOMContentLoaded", async function () {
  await Promise.all([
    loadCsrfToken(PACKAGE_CONTROLLER),
    loadCsrfToken(AGENCY_CONTROLLER)
  ]);

  setupLogout();
  setupPackagePage();
  setupOtherForms();

  loadDashboardStats();
  loadBookings();
  loadPackageOptions();
  loadAgencyPackages();
  loadGroupTrips();
  loadDashboardStats();
  loadPackagesSummary();
});
