// packages_api.js
// This file loads packages from the backend and renders package cards.

// Loads packages using filter/sort options.
async function loadPackagesFromBackend(options = {}) {
  // Converts frontend sort names into backend sort names.
  const sortMap = {
    rating: "rating_desc",
    "price-asc": "price_asc",
    "price-desc": "price_desc",
    "duration-asc": "duration_asc",
    newest: "newest"
  };

  // Ask get_packages.php for package data.
  const json = await apiGet("get_packages.php", {
    destination: options.destination || options.search || "",
    sort: sortMap[options.sort] || options.sort || "rating_desc",
    maxPrice: options.maxPrice || 0,
    minRating: options.minRating || 0
  });

  if (!json.success) {
    throw new Error(json.message || "Could not load packages");
  }

  // Convert every package into frontend-friendly format.
  return (json.data || []).map(normalisePackage);
}

// Creates the HTML for one package card.
function renderPackageCard(pkg) {
  return `
    <article class="package-card">
      <div class="package-card-body">
        <span class="eyebrow">${pkg.destination}</span>
        <h3>${pkg.name}</h3>
        <p>${pkg.description || "No description available."}</p>

        <div class="package-meta">
          <span>${pkg.duration || "—"} days</span>
          <span>${pkg.rating.toFixed(1)} ★</span>
          <span>${pkg.agency}</span>
        </div>

        <div class="package-card-footer">
          <strong>${money(pkg.price, pkg.currency)}</strong>

          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <a class="btn btn-outline btn-sm" href="package-detail.html?packageID=${pkg.id}">View</a>
            <button class="btn btn-ghost btn-sm compare-add" data-id="${pkg.id}">Compare</button>
          </div>
        </div>
      </div>
    </article>
  `;
}