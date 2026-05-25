//u25038967 Shelby Bodenstein 

const PACKAGE_CONTROLLER = "../packages.php";
const AGENCY_CONTROLLER = "../agency.php";

let csrfTokens = {};

//core api helper

async function apiRequest(file, action, method = "GET", data = null, needsCsrf = false) {
  const url = `${file}?action=${action}`;

  const options = {
    method: method,
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
    } catch (error) {
      return {
        success: false,
        message: text || "Invalid JSON response from backend."
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "Network error: " + error.message
    };
  }
}

//CSRF

async function loadCsrfToken(file = PACKAGE_CONTROLLER) {
  try {
    const response = await fetch(`${file}?action=get_csrf_token`);
    const result = await response.json();

    if (result.success && result.data && result.data.csrf_token) {
      csrfTokens[file] = result.data.csrf_token;
    }
  } catch (error) {
    console.warn("Could not load CSRF token:", error.message);
  }

  return csrfTokens[file] || null;
}

//message box

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

//package drop down options

async function loadPackageOptions() {
  const selects = document.querySelectorAll("#trip-package, select[name='packageID'], #packageID");

  if (!selects.length) return;

  const result = await apiRequest(PACKAGE_CONTROLLER, "list_packages");

  if (!result.success) return;

  const packages = result.data || [];

  selects.forEach(function (select) {
    if (!select) return;

    select.innerHTML = `
      <option value="">Select package...</option>
      ${packages.map(function (pkg) {
        return `
          <option value="${pkg.packageID}">
            ${pkg.title}${pkg.destinationCity ? " — " + pkg.destinationCity : ""}
          </option>
        `;
      }).join("")}
    `;
  });
}

//packages

async function loadAgencyPackages() {
  const table = document.getElementById("packagesTableBody");
  const container = document.getElementById("packagesContainer");

  if (!table && !container) return;

  const result = await apiRequest(PACKAGE_CONTROLLER, "list_packages");

  if (!result.success) {
    showMessage(result.message || "Could not load packages.", "error");
    return;
  }

  const packages = result.data || [];

  if (table) {
    table.innerHTML = packages.length
      ? packages.map(function (pkg) {
          return `
            <tr>
              <td>${pkg.packageID}</td>
              <td>${pkg.title}</td>
              <td>${pkg.destinationCity || ""}${pkg.destinationCountry ? ", " + pkg.destinationCountry : ""}</td>
              <td>${pkg.currency || "R"} ${pkg.pricePerPerson}</td>
              <td>${pkg.maxCapacity}</td>
              <td>${pkg.status}</td>
              <td>
                <button onclick="editPackage(${pkg.packageID})">Edit</button>
                <button class="danger-btn" onclick="deletePackage(${pkg.packageID})">Delete</button>
              </td>
            </tr>
          `;
        }).join("")
      : `<tr><td colspan="7" style="text-align:center;">No packages found.</td></tr>`;
  }

  if (container) {
    container.innerHTML = packages.length
      ? packages.map(function (pkg) {
          return `
            <div class="agency-card">
              <h3>${pkg.title}</h3>
              <p>${pkg.description || ""}</p>
              <p><strong>Destination:</strong> ${pkg.destinationCity || ""}, ${pkg.destinationCountry || ""}</p>
              <p><strong>Dates:</strong> ${pkg.startDate || "—"} to ${pkg.endDate || "—"}</p>
              <p><strong>Price:</strong> ${pkg.currency || "R"} ${pkg.pricePerPerson}</p>
              <p><strong>Capacity:</strong> ${pkg.maxCapacity}</p>
              <p><strong>Status:</strong> ${pkg.status}</p>
              <button onclick="editPackage(${pkg.packageID})">Edit</button>
              <button class="danger-btn" onclick="deletePackage(${pkg.packageID})">Delete</button>
            </div>
          `;
        }).join("")
      : `<p class="empty-state">No packages found.</p>`;
  }
}

async function createPackage(event) {
  event.preventDefault();

  const form = event.target;

  const data = {
    title: form.title.value,
    description: form.description.value,
    pricePerPerson: form.pricePerPerson.value,
    currency: form.currency.value,
    maxCapacity: form.maxCapacity.value,
    startDate: form.startDate.value,
    endDate: form.endDate.value,
    destinationCity: form.destinationCity.value,
    destinationCountry: form.destinationCountry.value,
    status: form.status.value
  };

  const result = await apiRequest(
    PACKAGE_CONTROLLER,
    "create_package",
    "POST",
    data,
    true
  );

  if (result.success) {
    showMessage("Package created successfully.");
    form.reset();
    loadAgencyPackages();
    loadPackageOptions();
    loadDashboardStats();
  } else {
    showMessage(result.message || "Could not create package.", "error");
  }
}

function editPackage(packageID) {
  localStorage.setItem("editPackageID", packageID);
  window.location.href = "edit-package.html";
}

async function loadEditPackage() {
  const form = document.getElementById("editPackageForm");

  if (!form) return;

  const packageID = localStorage.getItem("editPackageID");

  if (!packageID) {
    showMessage("No package selected.", "error");
    return;
  }

  const result = await apiRequest(
    PACKAGE_CONTROLLER,
    `get_package&packageID=${packageID}`
  );

  if (!result.success) {
    showMessage(result.message || "Could not load package.", "error");
    return;
  }

  const pkg = result.data;

  form.packageID.value = pkg.packageID;
  form.title.value = pkg.title;
  form.description.value = pkg.description || "";
  form.pricePerPerson.value = pkg.pricePerPerson;
  form.currency.value = pkg.currency;
  form.maxCapacity.value = pkg.maxCapacity;
  form.startDate.value = pkg.startDate || "";
  form.endDate.value = pkg.endDate || "";
  form.destinationCity.value = pkg.destinationCity || "";
  form.destinationCountry.value = pkg.destinationCountry || "";
  form.status.value = pkg.status || "Active";
}

async function updatePackage(event) {
  event.preventDefault();

  const form = event.target;

  const data = {
    packageID: form.packageID.value,
    title: form.title.value,
    description: form.description.value,
    pricePerPerson: form.pricePerPerson.value,
    currency: form.currency.value,
    maxCapacity: form.maxCapacity.value,
    startDate: form.startDate.value,
    endDate: form.endDate.value,
    destinationCity: form.destinationCity.value,
    destinationCountry: form.destinationCountry.value,
    status: form.status.value
  };

  const result = await apiRequest(
    PACKAGE_CONTROLLER,
    "update_package",
    "POST",
    data,
    true
  );

  if (result.success) {
    showMessage("Package updated successfully.");

    setTimeout(function () {
      window.location.href = "manage-packages.html";
    }, 800);
  } else {
    showMessage(result.message || "Could not update package.", "error");
  }
}

async function deletePackage(packageID) {
  if (!confirm("Mark this package as inactive?")) return;

  const result = await apiRequest(
    PACKAGE_CONTROLLER,
    "delete_package",
    "POST",
    { packageID: packageID },
    true
  );

  if (result.success) {
    showMessage("Package marked inactive.");
    loadAgencyPackages();
    loadPackageOptions();
    loadDashboardStats();
  } else {
    showMessage(result.message || "Could not delete package.", "error");
  }
}

//dashboard summary

async function loadPackagesSummary() {
  const list = document.getElementById("packages-summary");

  if (!list) return;

  const result = await apiRequest(PACKAGE_CONTROLLER, "list_packages");

  if (!result.success) return;

  const packages = result.data || [];

  list.innerHTML = packages.length
    ? packages.slice(0, 5).map(function (pkg) {
        return `
          <li>
            <strong>${pkg.title}</strong><br>
            <small>${pkg.destinationCity || ""}${pkg.destinationCountry ? ", " + pkg.destinationCountry : ""}</small>
          </li>
        `;
      }).join("")
    : "<li>No packages yet.</li>";
}

async function loadDashboardStats() {
  const packageCount = document.getElementById("packageCount");
  const bookingCount = document.getElementById("bookingCount");
  const groupTripCount = document.getElementById("groupTripCount");
  const componentCount = document.getElementById("componentCount");
  const revenueTotal = document.getElementById("stat-revenue");
  const avgRating = document.getElementById("stat-rating");

  if (!packageCount && !bookingCount && !groupTripCount && !componentCount && !revenueTotal && !avgRating) {
    return;
  }

  const results = await Promise.all([
    apiRequest(PACKAGE_CONTROLLER, "list_packages"),
    apiRequest(AGENCY_CONTROLLER, "list_bookings"),
    apiRequest(AGENCY_CONTROLLER, "list_group_trips"),
    apiRequest(AGENCY_CONTROLLER, "list_components"),
    apiRequest(AGENCY_CONTROLLER, "get_dashboard_stats")
  ]);

  const packagesResult = results[0];
  const bookingsResult = results[1];
  const tripsResult = results[2];
  const componentsResult = results[3];
  const statsResult = results[4];

  if (packageCount && packagesResult.success) {
    packageCount.textContent = packagesResult.data.length;
  }

  if (bookingCount && bookingsResult.success) {
    bookingCount.textContent = bookingsResult.data.length;
  }

  if (groupTripCount && tripsResult.success) {
    groupTripCount.textContent = tripsResult.data.length;
  }

  if (componentCount && componentsResult.success) {
    componentCount.textContent = componentsResult.data.length;
  }

  if (statsResult.success && statsResult.data) {
    if (revenueTotal) {
      const rev = parseFloat(statsResult.data.totalRevenue || 0);

      revenueTotal.textContent = rev > 0
        ? "R " + rev.toLocaleString("en-ZA", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })
        : "—";
    }

    if (avgRating) {
      const rating = parseFloat(statsResult.data.avgRating || 0);
      avgRating.textContent = rating > 0 ? rating.toFixed(1) + " / 5" : "—";
    }
  }
}

//bookings

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
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;color:var(--grey-text);">
          No bookings yet.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = bookings.map(function (b) {
    return `
      <tr>
        <td>${b.bookingID}</td>
        <td>${b.firstName || ""} ${b.lastName || ""}</td>
        <td>${b.title || ""}</td>
        <td>${b.bookedAt || ""}</td>
        <td>${b.totalPrice || ""}</td>
        <td>
          <span class="status-badge status-badge--${(b.status || "").toLowerCase()}">
            ${b.status || ""}
          </span>
        </td>
        <td>—</td>
      </tr>
    `;
  }).join("");
}

//reviews

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

  list.innerHTML = reviews.map(function (r) {
    const score = parseInt(r.overallScore || 0);

    return `
      <li style="margin-bottom:10px;">
        <strong>${r.travellerName || "Traveller"}</strong>
        <span style="float:right;color:#f59e0b;">
          ${"★".repeat(score)}${"☆".repeat(5 - score)}
        </span><br>
        <small style="color:var(--grey-text);">${r.packageTitle || ""}</small><br>
        <span style="font-size:0.85rem;">${r.comment || ""}</span>
      </li>
    `;
  }).join("");
}

//group trips

async function loadGroupTrips() {
  if (typeof loadGroupTripsPage === "function") {
    return loadGroupTripsPage();
  }

  const table = document.getElementById("groupTripsTableBody");
  const grid = document.getElementById("trips-grid");

  if (!table && !grid) return;

  const result = await apiRequest(AGENCY_CONTROLLER, "list_group_trips");

  if (!result.success) {
    showMessage(result.message || "Could not load group trips.", "error");
    return;
  }

  const trips = result.data || [];

  if (table) {
    table.innerHTML = trips.length
      ? trips.map(function (trip) {
          return `
            <tr>
              <td>${trip.groupTripID}</td>
              <td>${trip.groupName}</td>
              <td>${trip.packageTitle || trip.title || trip.packageID}</td>
              <td>${trip.destinationCity || ""}</td>
              <td>${trip.destinationCountry || ""}</td>
              <td>${trip.currentMembers}</td>
              <td>
                <button onclick="openEnrolleesModal(${trip.groupTripID})">View Enrollees</button>
                <button class="danger-btn" onclick="deleteGroupTrip(${trip.groupTripID})">Delete</button>
              </td>
            </tr>
          `;
        }).join("")
      : `<tr><td colspan="7" style="text-align:center;">No group trips yet.</td></tr>`;
  }

  if (grid) {
    grid.innerHTML = trips.length
      ? trips.map(function (trip) {
          return `
            <div class="trip-card">
              <div class="trip-card-top">
                <div>
                  <h3>${trip.groupName}</h3>
                  <small>${trip.packageTitle || trip.title || "Package #" + trip.packageID}</small>
                </div>
              </div>

              <div class="trip-info">
                <p><strong>Members:</strong> ${trip.currentMembers}</p>
              </div>

              <div class="trip-actions">
                <button onclick="openEnrolleesModal(${trip.groupTripID})">View Enrollees</button>
                <button class="danger-btn" onclick="deleteGroupTrip(${trip.groupTripID})">Delete</button>
              </div>
            </div>
          `;
        }).join("")
      : `<p class="empty-state">No group trips yet.</p>`;
  }
}

async function createGroupTrip(event) {
  event.preventDefault();

  const form = event.target;

  const data = {
    groupName: form.groupName.value,
    currentMembers: form.currentMembers.value,
    packageID: form.packageID.value
  };

  const result = await apiRequest(
    AGENCY_CONTROLLER,
    "create_group_trip",
    "POST",
    data,
    true
  );

  if (result.success) {
    showMessage("Group trip created successfully.");
    form.reset();
    loadGroupTrips();
    loadDashboardStats();
  } else {
    showMessage(result.message || "Could not create group trip.", "error");
  }
}

async function deleteGroupTrip(groupTripID) {
  if (!confirm("Are you sure you want to delete this group trip?")) return;

  const result = await apiRequest(
    AGENCY_CONTROLLER,
    "delete_group_trip",
    "POST",
    { groupTripID: groupTripID },
    true
  );

  if (result.success) {
    showMessage("Group trip deleted successfully.");
    loadGroupTrips();
    loadDashboardStats();
  } else {
    showMessage(result.message || "Could not delete group trip.", "error");
  }
}

async function openEnrolleesModal(groupTripID) {
  const modal = document.getElementById("enrollees-modal");
  const list = document.getElementById("enrollees-list");
  const title = document.getElementById("enrollees-title");

  if (!modal || !list) return;

  modal.style.display = "flex";
  list.innerHTML = "Loading...";

  const result = await apiRequest(
    AGENCY_CONTROLLER,
    `get_group_trip_enrollees&groupTripID=${groupTripID}`
  );

  if (!result.success) {
    list.innerHTML = "<p>Failed to load enrollees.</p>";
    return;
  }

  const travellers = result.data || [];

  if (title) {
    title.textContent = `Enrolled Travellers (${travellers.length})`;
  }

  list.innerHTML = travellers.length
    ? travellers.map(function (t) {
        return `
          <div class="enrollee-card">
            <strong>${t.firstName} ${t.lastName}</strong><br>
            <small>${t.emailAddress}</small>
          </div>
        `;
      }).join("")
    : "<p>No travellers enrolled yet.</p>";
}

//components

async function loadComponents() {
  const table = document.getElementById("componentsTableBody");

  if (!table) return;

  const result = await apiRequest(AGENCY_CONTROLLER, "list_components");

  if (!result.success) {
    showMessage(result.message || "Could not load components.", "error");
    return;
  }

  const components = result.data || [];

  table.innerHTML = components.length
    ? components.map(function (component) {
        return `
          <tr>
            <td>${component.componentID}</td>
            <td>${component.packageTitle}</td>
            <td>${component.componentType}</td>
            <td>${component.name}</td>
            <td>${component.city || ""}</td>
            <td>${component.country || ""}</td>
            <td>
              <button class="danger-btn" onclick="deleteComponent(${component.componentID})">Delete</button>
            </td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="7" style="text-align:center;">No components found.</td></tr>`;
}

async function createComponent(event) {
  event.preventDefault();

  const form = event.target;

  const data = {
    packageID: form.packageID.value,
    componentType: form.componentType.value,
    name: form.name.value,
    city: form.city.value,
    country: form.country.value,
    description: form.description.value,

    propertyType: form.propertyType ? form.propertyType.value : "",
    starRating: form.starRating ? form.starRating.value : "",
    amenities: form.amenities ? form.amenities.value : "",

    cuisineType: form.cuisineType ? form.cuisineType.value : "",
    priceTier: form.priceTier ? form.priceTier.value : "",

    duration: form.duration ? form.duration.value : "",
    difficulty: form.difficulty ? form.difficulty.value : "",
    meetingPoint: form.meetingPoint ? form.meetingPoint.value : "",
    maxGroupSize: form.maxGroupSize ? form.maxGroupSize.value : "",

    address: form.address ? form.address.value : ""
  };

  const result = await apiRequest(
    AGENCY_CONTROLLER,
    "create_component",
    "POST",
    data,
    true
  );

  if (result.success) {
    showMessage("Component created successfully.");
    form.reset();
    loadComponents();
    loadDashboardStats();
  } else {
    showMessage(result.message || "Could not create component.", "error");
  }
}

async function deleteComponent(componentID) {
  if (!confirm("Are you sure you want to delete this component?")) return;

  const result = await apiRequest(
    AGENCY_CONTROLLER,
    "delete_component",
    "POST",
    { componentID: componentID },
    true
  );

  if (result.success) {
    showMessage("Component deleted successfully.");
    loadComponents();
    loadDashboardStats();
  } else {
    showMessage(result.message || "Could not delete component.", "error");
  }
}

//logout

function setupLogout() {
  const logoutBtn = document.getElementById("logout-btn");

  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async function (event) {
    event.preventDefault();

    try {
      await fetch("logout.php");
    } catch (error) {
      console.warn("Logout request failed:", error.message);
    }

    window.location.href = "Simple_Agent_Login.html";
  });
}

//filters

function setupBookingStatusFilter() {
  const bookingFilter = document.getElementById("booking-status-filter");

  if (!bookingFilter) return;

  bookingFilter.addEventListener("change", function () {
    const status = this.value.toLowerCase();

    document.querySelectorAll("#bookings-tbody tr").forEach(function (row) {
      const rowStatus = (row.querySelector(".status-badge")?.textContent || "").toLowerCase();

      row.style.display = !status || rowStatus === status ? "" : "none";
    });
  });
}

//form listeners

function setupForms() {
  const createPackageForm = document.getElementById("createPackageForm");
  const editPackageForm = document.getElementById("editPackageForm");
  const createGroupTripForm = document.getElementById("createGroupTripForm");
  const createComponentForm = document.getElementById("createComponentForm");

  if (createPackageForm) {
    createPackageForm.addEventListener("submit", createPackage);
  }

  if (editPackageForm) {
    editPackageForm.addEventListener("submit", updatePackage);
  }

  if (createGroupTripForm) {
    createGroupTripForm.addEventListener("submit", createGroupTrip);
  }

  if (createComponentForm) {
    createComponentForm.addEventListener("submit", createComponent);
  }
}

//page start up

document.addEventListener("DOMContentLoaded", function () {
  loadCsrfToken(PACKAGE_CONTROLLER);
  loadCsrfToken(AGENCY_CONTROLLER);

  setupLogout();
  setupForms();
  setupBookingStatusFilter();

  loadPackageOptions();

  loadAgencyPackages();
  loadEditPackage();

  loadGroupTrips();
  loadComponents();

  loadDashboardStats();
  loadPackagesSummary();
  loadBookings();
  loadReviewsSnapshot();
});
