async function loadPackagesFromBackend(options = {}) {
    const sortMap = {
      rating: "rating_desc",
      "price-asc": "price_asc",
      "price-desc": "price_desc",
      "duration-asc": "duration_asc",
      newest: "newest"
    };
  
    const json = await apiGet("get_packages.php", {
      destination: options.destination || options.search || "",
      sort: sortMap[options.sort] || options.sort || "rating_desc",
      maxPrice: options.maxPrice || 0,
      minRating: options.minRating || 0
    });
  
    if (!json.success) {
      throw new Error(json.message || "Could not load packages");
    }
  
    return (json.data || []).map(normalisePackage);
  }
  
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
  
  function getCompareList() {
    return JSON.parse(localStorage.getItem("tripistryCompare") || "[]");
  }
  
  function setCompareList(list) {
    localStorage.setItem(
      "tripistryCompare",
      JSON.stringify([...new Set(list.map(Number))].slice(0, 4))
    );
  }
  
  function addToCompare(id) {
    const list = getCompareList();
  
    if (!list.includes(Number(id))) {
      list.push(Number(id));
    }
  
    setCompareList(list);
  }