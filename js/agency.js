const PACKAGE_CONTROLLER = "packages.php";
const AGENCY_CONTROLLER = "agency.php";

let csrfToken = null;

async function apiRequest(file, action, method = "GET", data = null, needsCsrf = false) {
  const url = `${file}?action=${action}`;

  const options = {
    method: method,
    headers: {}
  };

  if (needsCsrf) {
    if (!csrfToken) {
      await loadCsrfToken(file);
    }

    options.headers["X-CSRF-Token"] = csrfToken;
  }

  if (data !== null) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(data);
  }

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
}

async function loadCsrfToken(file = PACKAGE_CONTROLLER) {
  const response = await fetch(`${file}?action=get_csrf_token`);
  const result = await response.json();

  if (result.success && result.data && result.data.csrf_token) {
    csrfToken = result.data.csrf_token;
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
  box.className = type === "success" ? "success-message" : "error-message";

  setTimeout(function () {
    box.textContent = "";
    box.className = "";
  }, 3000);
}

/* =========================
   PACKAGES
========================= */

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
    table.innerHTML = packages.map(function (pkg) {
      return `
        <tr>
          <td>${pkg.packageID}</td>
          <td>${pkg.title}</td>
          <td>${pkg.destinationCity || ""}</td>
          <td>${pkg.destinationCountry || ""}</td>
          <td>${pkg.currency} ${pkg.pricePerPerson}</td>
          <td>${pkg.maxCapacity}</td>
          <td>${pkg.status}</td>
          <td>
            <button onclick="editPackage(${pkg.packageID})">Edit</button>
            <button class="danger-btn" onclick="deletePackage(${pkg.packageID})">Delete</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  if (container) {
    container.innerHTML = packages.map(function (pkg) {
      return `
        <div class="agency-card">
          <h3>${pkg.title}</h3>
          <p>${pkg.description || ""}</p>
          <p><strong>Destination:</strong> ${pkg.destinationCity || ""}, ${pkg.destinationCountry || ""}</p>
          <p><strong>Dates:</strong> ${pkg.startDate || ""} to ${pkg.endDate || ""}</p>
          <p><strong>Price:</strong> ${pkg.currency} ${pkg.pricePerPerson}</p>
          <p><strong>Capacity:</strong> ${pkg.maxCapacity}</p>
          <p><strong>Status:</strong> ${pkg.status}</p>
          <button onclick="editPackage(${pkg.packageID})">Edit</button>
          <button class="danger-btn" onclick="deletePackage(${pkg.packageID})">Delete</button>
        </div>
      `;
    }).join("");
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
  if (!confirm("Are you sure you want to delete this package?")) return;

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
  } else {
    showMessage(result.message || "Could not delete package.", "error");
  }
}

/* =========================
   GROUP TRIPS
========================= */

async function loadGroupTrips() {
  const table = document.getElementById("groupTripsTableBody");
  if (!table) return;

  const result = await apiRequest(AGENCY_CONTROLLER, "list_group_trips");

  if (!result.success) {
    showMessage(result.message || "Could not load group trips.", "error");
    return;
  }

  const trips = result.data || [];

  table.innerHTML = trips.map(function (trip) {
    return `
      <tr>
        <td>${trip.groupTripID}</td>
        <td>${trip.groupName}</td>
        <td>${trip.packageTitle || trip.packageID}</td>
        <td>${trip.destinationCity || ""}</td>
        <td>${trip.destinationCountry || ""}</td>
        <td>${trip.currentMembers}</td>
        <td>
          <button onclick="deleteGroupTrip(${trip.groupTripID})">Delete</button>
        </td>
      </tr>
    `;
  }).join("");
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
  } else {
    showMessage(result.message || "Could not delete group trip.", "error");
  }
}

/* =========================
   COMPONENTS
========================= */

async function loadComponents() {
  const table = document.getElementById("componentsTableBody");
  if (!table) return;

  const result = await apiRequest(AGENCY_CONTROLLER, "list_components");

  if (!result.success) {
    showMessage(result.message || "Could not load components.", "error");
    return;
  }

  const components = result.data || [];

  table.innerHTML = components.map(function (component) {
    return `
      <tr>
        <td>${component.componentID}</td>
        <td>${component.packageTitle}</td>
        <td>${component.componentType}</td>
        <td>${component.name}</td>
        <td>${component.city || ""}</td>
        <td>${component.country || ""}</td>
        <td>
          <button onclick="deleteComponent(${component.componentID})">Delete</button>
        </td>
      </tr>
    `;
  }).join("");
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
  } else {
    showMessage(result.message || "Could not delete component.", "error");
  }
}

/* =========================
   DASHBOARD
========================= */

async function loadDashboardStats() {
  const packageCount = document.getElementById("packageCount");
  const groupTripCount = document.getElementById("groupTripCount");
  const componentCount = document.getElementById("componentCount");

  if (!packageCount && !groupTripCount && !componentCount) return;

  const packagesResult = await apiRequest(PACKAGE_CONTROLLER, "list_packages");
  const tripsResult = await apiRequest(AGENCY_CONTROLLER, "list_group_trips");
  const componentsResult = await apiRequest(AGENCY_CONTROLLER, "list_components");

  if (packageCount && packagesResult.success) {
    packageCount.textContent = packagesResult.data.length;
  }

  if (groupTripCount && tripsResult.success) {
    groupTripCount.textContent = tripsResult.data.length;
  }

  if (componentCount && componentsResult.success) {
    componentCount.textContent = componentsResult.data.length;
  }
}

/* =========================
   PAGE STARTUP
========================= */

document.addEventListener("DOMContentLoaded", function () {
  loadCsrfToken(PACKAGE_CONTROLLER);

  loadAgencyPackages();
  loadEditPackage();
  loadGroupTrips();
  loadComponents();
  loadDashboardStats();

  const createPackageForm = document.getElementById("createPackageForm");
  if (createPackageForm) {
    createPackageForm.addEventListener("submit", createPackage);
  }

  const editPackageForm = document.getElementById("editPackageForm");
  if (editPackageForm) {
    editPackageForm.addEventListener("submit", updatePackage);
  }

  const createGroupTripForm = document.getElementById("createGroupTripForm");
  if (createGroupTripForm) {
    createGroupTripForm.addEventListener("submit", createGroupTrip);
  }

  const createComponentForm = document.getElementById("createComponentForm");
  if (createComponentForm) {
    createComponentForm.addEventListener("submit", createComponent);
  }
});
