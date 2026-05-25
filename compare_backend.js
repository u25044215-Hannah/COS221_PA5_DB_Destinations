// compare_backend.js
// This connects compare.html to the saved compare list and backend package details.

document.addEventListener("DOMContentLoaded", async () => {
  // Get package IDs saved from the Browse or Detail pages.
  const ids = getSavedCompareIDs();

  const empty = document.getElementById("compare-empty");
  const wrap = document.getElementById("compare-table-wrap");

  // If no packages were selected, keep the empty message visible.
  if (!ids.length) {
    empty.style.display = "block";
    wrap.style.display = "none";
    return;
  }

  const packages = [];

  // Load each selected package from the backend.
  for (const id of ids) {
    try {
      const json = await loadPackageDetails(id);

      if (json && json.success && json.package) {
        packages.push(safeNormalisePackage(json.package));
      } else if (json && json.package) {
        packages.push(safeNormalisePackage(json.package));
      } else if (json && json.data) {
        packages.push(safeNormalisePackage(json.data));
      }
    } catch (err) {
      console.error("Could not load package", id, err);
    }
  }

  // If the IDs exist in localStorage but the backend returns nothing.
  if (!packages.length) {
    empty.innerHTML = `
      <div class="compare-empty-icon"></div>
      <h2>Could not load selected packages</h2>
      <p>The compare list has package IDs, but the backend did not return package details.</p>
      <a href="browse.html" class="btn btn-primary btn-lg" style="margin-top:24px">Browse Packages</a>
    `;

    empty.style.display = "block";
    wrap.style.display = "none";
    return;
  }

  // Show compare table.
  empty.style.display = "none";
  wrap.style.display = "block";

  // Show selected package count.
  document.getElementById("compare-count-label").textContent =
    `${packages.length} package(s) selected`;

  // Build table header row.
  document.getElementById("compare-header-row").innerHTML =
    `<th class="compare-row-label">Package</th>` +
    packages.map(p => `<th>${p.name}</th>`).join("");

  // Rows that will be compared.
  const rows = [
    ["Destination", p => p.destination],
    ["Price", p => moneySafe(p.price, p.currency)],
    ["Duration", p => `${p.duration} days`],
    ["Rating", p => `${Number(p.rating || 0).toFixed(1)} ★`],
    ["Agency", p => p.agency]
  ];

  // Build compare table body.
  document.getElementById("compare-tbody").innerHTML = rows.map(([label, fn]) => `
    <tr>
      <td class="compare-row-label">${label}</td>
      ${packages.map(p => `<td>${fn(p)}</td>`).join("")}
    </tr>
  `).join("");

  // Add buttons to view each package.
  document.getElementById("compare-book-row").innerHTML =
    packages.map(p => `
      <a class="btn btn-primary btn-sm" href="package-detail.html?packageID=${p.id}">
        View ${p.name}
      </a>
    `).join(" ");

  // Clear all selected compare packages.
  document.getElementById("clear-compare-all")?.addEventListener("click", () => {
    localStorage.removeItem("comparePackages");

    if (typeof setCompareList === "function") {
      setCompareList([]);
    }

    location.reload();
  });
});

function getSavedCompareIDs() {
  let ids = JSON.parse(localStorage.getItem("comparePackages")) || [];

  return ids.map(id => String(id));
}

async function loadPackageDetails(id) {
  try {
    return await apiGet("get_package_details.php", { packageID: id });
  } catch (err) {
    console.warn("get_package_details.php failed, trying api.php instead.");

    return await apiGet("api.php", {
      action: "getPackageDetails",
      packageID: id
    });
  }
}

function safeNormalisePackage(pkg) {
  if (typeof normalisePackage === "function") {
    return normalisePackage(pkg);
  }

  return {
    id: pkg.packageID || pkg.PackageID || pkg.packageId || pkg.id || "",
    name: pkg.packageName || pkg.name || pkg.title || "Package",
    destination:
      pkg.destination ||
      pkg.destinationName ||
      [pkg.destinationCity, pkg.destinationCountry].filter(Boolean).join(", ") ||
      "—",
    price: Number(pkg.price || pkg.packagePrice || pkg.totalPrice || 0),
    currency: pkg.currency || "ZAR",
    duration: pkg.duration || pkg.durationDays || pkg.days || "—",
    rating: Number(pkg.rating || pkg.averageRating || 0),
    agency: pkg.agencyName || pkg.agency || pkg.companyName || "—"
  };
}

function moneySafe(amount, currency) {
  if (typeof money === "function") {
    return money(amount, currency);
  }

  return "R " + Number(amount || 0).toFixed(2);
}