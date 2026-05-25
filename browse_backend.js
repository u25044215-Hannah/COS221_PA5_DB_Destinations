// browse_backend.js
// Pulls package data + dropdown filter data from the database through api.php

document.addEventListener("DOMContentLoaded", async function () {
  const grid = document.getElementById("browse-grid");
  if (!grid) return;

  const count = document.getElementById("results-count");
  const total = document.getElementById("total-count");
  const empty = document.getElementById("empty-state");

  const searchInput = document.getElementById("filter-search");
  const destinationSelect = document.getElementById("filter-destination");
  const priceInput = document.getElementById("filter-price-max");
  const priceDisplay = document.getElementById("price-display");
  const sortSelect = document.getElementById("sort-select");
  const agencySelect = document.getElementById("filter-agency");
  const accommodationSelect = document.getElementById("filter-accommodation");

  const groupOnly = document.getElementById("filter-group");
  const flightIncluded = document.getElementById("filter-flight");
  const excursionsIncluded = document.getElementById("filter-excursions");
  const restaurantsIncluded = document.getElementById("filter-restaurants");
  const accommodationIncluded = document.getElementById("filter-accommodation-included");

  const applyBtn = document.getElementById("apply-filters-btn");
  const clearBtn = document.getElementById("clear-filters-btn");
  const ratingButtons = document.querySelectorAll(".rating-filter-btn");

  let allPackages = [];
  let minRating = 0;

  const params = new URLSearchParams(window.location.search);
  if (params.get("destination") && searchInput) {
    searchInput.value = params.get("destination");
  }

  function normalise(value) {
    return String(value || "").toLowerCase().trim();
  }

  async function fetchJSON(url) {
    const response = await fetch(url);

    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch (err) {
      console.error("Backend returned non-JSON:", text);
      throw new Error("Backend did not return valid JSON.");
    }
  }

  function unwrapData(json) {
    if (Array.isArray(json)) return json;
    if (json.data && Array.isArray(json.data)) return json.data;
    if (json.packages && Array.isArray(json.packages)) return json.packages;
    if (json.results && Array.isArray(json.results)) return json.results;
    return [];
  }

  async function loadPackagesFromBackend() {
    const json = await fetchJSON("api.php?action=getPackages");
    return unwrapData(json);
  }

  async function loadBrowseFilters() {
    try {
      const json = await fetchJSON("api.php?action=getBrowseFilters");

      const data = json.data || json;

      populateDestinationDropdown(data.destinations || []);
      populateAgencyDropdown(data.agencies || []);
      populateAccommodationDropdown(data.accommodationTypes || []);
    } catch (err) {
      console.error("Filter loading failed:", err);

      // Backup: build dropdowns from the package data if getBrowseFilters does not exist yet.
      populateDropdownsFromPackages();
    }
  }

  function clearSelect(select, defaultText) {
    if (!select) return;

    select.innerHTML = "";

    const option = document.createElement("option");
    option.value = "";
    option.textContent = defaultText;
    select.appendChild(option);
  }

  function populateDestinationDropdown(destinations) {
    clearSelect(destinationSelect, "All Destinations");
  
    destinations.forEach(dest => {
      const city = dest.destinationCity || "";
      const country = dest.destinationCountry || "";
  
      if (!city && !country) return;
  
      const label = [city, country].filter(Boolean).join(", ");
  
      const option = document.createElement("option");
  
      // This value must match what we filter against later
      option.value = label.toLowerCase();
  
      option.textContent = label;
  
      destinationSelect.appendChild(option);
    });
  }

  function populateAgencyDropdown(agencies) {
    clearSelect(agencySelect, "All Agencies");
  
    agencies.forEach(agency => {
      const name = agency.agencyName || agency.companyName || "";
  
      if (!name) return;
  
      const option = document.createElement("option");
  
      // Use agency name instead of ID because package cards filter by agencyName
      option.value = name.toLowerCase();
  
      option.textContent = name;
  
      agencySelect.appendChild(option);
    });
  }

  function populateAccommodationDropdown(types) {
    clearSelect(accommodationSelect, "All Accommodation");
  
    types.forEach(item => {
      const type = item.propertyType || item.accommodationType || item;
  
      if (!type) return;
  
      const option = document.createElement("option");
  
      option.value = type.toLowerCase();
      option.textContent = type;
  
      accommodationSelect.appendChild(option);
    });
  }

  function populateDropdownsFromPackages() {
    const destinations = [];
    const agencies = [];
    const accommodationTypes = [];

    allPackages.forEach(pkg => {
      const city = pkg.destinationCity || pkg.city;
      const country = pkg.destinationCountry || pkg.country;

      if (city || country) {
        destinations.push({
          destinationID: pkg.destinationID,
          destinationCity: city,
          destinationCountry: country
        });
      }

      if (pkg.agencyName || pkg.companyName || pkg.agentID || pkg.agencyID) {
        agencies.push({
          agentID: pkg.agentID || pkg.agencyID,
          agencyName: pkg.agencyName || pkg.companyName
        });
      }

      if (pkg.propertyType || pkg.accommodationType) {
        accommodationTypes.push(pkg.propertyType || pkg.accommodationType);
      }
    });

    populateDestinationDropdown(uniqueByLabel(destinations, d =>
      `${d.destinationCity || ""}-${d.destinationCountry || ""}`
    ));

    populateAgencyDropdown(uniqueByLabel(agencies, a =>
      `${a.agentID || ""}-${a.agencyName || ""}`
    ));

    populateAccommodationDropdown([...new Set(accommodationTypes)]);
  }

  function uniqueByLabel(items, getKey) {
    const seen = new Set();

    return items.filter(item => {
      const key = normalise(getKey(item));
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function getPackagePrice(pkg) {
    return Number(pkg.pricePerPerson || pkg.price || pkg.packagePrice || 0);
  }

  function getPackageRating(pkg) {
    return Number(pkg.averageRating || pkg.rating || pkg.overallScore || 0);
  }

  function getPackageDuration(pkg) {
    if (pkg.durationDays) return Number(pkg.durationDays);

    if (pkg.startDate && pkg.endDate) {
      const start = new Date(pkg.startDate);
      const end = new Date(pkg.endDate);
      const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    }

    return 0;
  }

  function packageText(pkg) {
    return normalise([
      pkg.title,
      pkg.packageName,
      pkg.description,
      pkg.destinationCity,
      pkg.destinationCountry,
      pkg.city,
      pkg.country,
      pkg.agencyName,
      pkg.companyName,
      pkg.propertyType,
      pkg.accommodationType
    ].join(" "));
  }

  function packageMatchesDuration(pkg) {
    const checked = Array.from(document.querySelectorAll('input[name="duration"]:checked'))
      .map(input => input.value);

    if (checked.length === 0) return true;

    const days = getPackageDuration(pkg);

    return checked.some(range => {
      if (range === "1-7") return days >= 1 && days <= 7;
      if (range === "8-14") return days >= 8 && days <= 14;
      if (range === "15+") return days >= 15;
      return true;
    });
  }

  function packageHasComponent(pkg, type) {
    const text = packageText(pkg);

    if (type === "accommodation") {
      return Boolean(pkg.accommodationID || pkg.accommodationName || pkg.propertyType || pkg.accommodationType);
    }

    if (type === "restaurant") {
      return Boolean(pkg.restaurantID || pkg.restaurantName || pkg.cuisineType) ||
        text.includes("restaurant");
    }

    if (type === "excursion") {
      return Boolean(pkg.excursionID || pkg.excursionName || pkg.activityName) ||
        text.includes("tour") ||
        text.includes("excursion") ||
        text.includes("activity");
    }

    if (type === "flight") {
      return Boolean(pkg.flightID || pkg.flightIncluded) ||
        text.includes("flight");
    }

    return true;
  }

  function applyFilters() {
    const searchValue = normalise(searchInput ? searchInput.value : "");
    const destinationValue = normalise(destinationSelect ? destinationSelect.value : "");
    const maxPrice = Number(priceInput ? priceInput.value : Infinity);
    const agencyValue = normalise(agencySelect ? agencySelect.value : "");
    const accommodationValue = normalise(accommodationSelect ? accommodationSelect.value : "");

    let filtered = allPackages.filter(pkg => {
      const text = packageText(pkg);
      const price = getPackagePrice(pkg);
      const rating = getPackageRating(pkg);

      const matchesSearch = !searchValue || text.includes(searchValue);

      const matchesDestination = !destinationValue ||
            normalise(`${pkg.destinationCity || ""}, ${pkg.destinationCountry || ""}`) === destinationValue ||
            normalise(pkg.destinationCity).includes(destinationValue) ||
            normalise(pkg.destinationCountry).includes(destinationValue);

      const matchesPrice = !maxPrice || price <= maxPrice;
      const matchesRating = rating >= minRating;

      const matchesAgency = !agencyValue ||
            normalise(pkg.agencyName).includes(agencyValue) ||
            normalise(pkg.companyName).includes(agencyValue);

      const matchesAccommodation =!accommodationValue ||
            normalise(pkg.propertyType).includes(accommodationValue) ||
            normalise(pkg.accommodationType).includes(accommodationValue);

      const matchesDuration = packageMatchesDuration(pkg);

      const matchesGroup =
        !groupOnly ||
        !groupOnly.checked ||
        Boolean(pkg.groupTripID || pkg.groupName || pkg.isGroupTrip || Number(pkg.maxGroupSize) > 1);

      const matchesFlight =
        !flightIncluded || !flightIncluded.checked || packageHasComponent(pkg, "flight");

      const matchesExcursions =
        !excursionsIncluded || !excursionsIncluded.checked || packageHasComponent(pkg, "excursion");

      const matchesRestaurants =
        !restaurantsIncluded || !restaurantsIncluded.checked || packageHasComponent(pkg, "restaurant");

      const matchesAccommodationIncluded =
        !accommodationIncluded ||
        !accommodationIncluded.checked ||
        packageHasComponent(pkg, "accommodation");

      return (
        matchesSearch &&
        matchesDestination &&
        matchesPrice &&
        matchesRating &&
        matchesAgency &&
        matchesAccommodation &&
        matchesDuration &&
        matchesGroup &&
        matchesFlight &&
        matchesExcursions &&
        matchesRestaurants &&
        matchesAccommodationIncluded
      );
    });

    filtered = sortPackages(filtered);
    renderPackages(filtered);
  }

  function sortPackages(packages) {
    const sortValue = sortSelect ? sortSelect.value : "";

    return [...packages].sort((a, b) => {
      if (sortValue === "price-asc") return getPackagePrice(a) - getPackagePrice(b);
      if (sortValue === "price-desc") return getPackagePrice(b) - getPackagePrice(a);
      if (sortValue === "duration-asc") return getPackageDuration(a) - getPackageDuration(b);
      if (sortValue === "newest") return new Date(b.startDate || 0) - new Date(a.startDate || 0);

      return getPackageRating(b) - getPackageRating(a);
    });
  }

  function renderPackages(packages) {
    if (!packages.length) {
      grid.innerHTML = "";
      if (empty) empty.style.display = "block";
    } else {
      grid.innerHTML = packages.map(renderPackageCard).join("");
      if (empty) empty.style.display = "none";
    }

    if (count) count.textContent = `${packages.length} packages found`;
    if (total) total.textContent = packages.length;
  }

  function renderPackageCard(pkg) {
    const id = pkg.packageID || pkg.id || "";
    const title = pkg.title || pkg.packageName || "Travel Package";
    const destination = [pkg.destinationCity || pkg.city, pkg.destinationCountry || pkg.country]
      .filter(Boolean)
      .join(", ");

    const price = getPackagePrice(pkg);
    const rating = getPackageRating(pkg);
    const duration = getPackageDuration(pkg);
    const agency = pkg.agencyName || pkg.companyName || "Travel Agency";
    const image = pkg.imageURL || pkg.image || "images/package-placeholder.jpg";

    return `
      <article class="package-card">
        <img src="${image}" alt="${title}" class="package-img">

        <div class="package-content">
          <h3>${title}</h3>
          <p class="package-destination">${destination}</p>
          <p class="package-agency">${agency}</p>
          <p>${pkg.description || ""}</p>

          <div class="package-meta">
            <span>R ${price.toLocaleString()}</span>
            <span>${duration ? duration + " days" : ""}</span>
            <span>${rating ? rating.toFixed(1) + " ★" : "No rating"}</span>
          </div>

          <div class="package-actions">
            <a href="package-details.html?packageID=${id}" class="btn btn-primary">View Details</a>
            <button type="button" class="btn btn-secondary compare-add" data-id="${id}">
              Add to Compare
            </button>
          </div>
        </div>
      </article>
    `;
  }

  async function loadInitialPackages() {
    grid.innerHTML = "<p>Loading packages...</p>";

    try {
      allPackages = await loadPackagesFromBackend();

      await loadBrowseFilters();

      if (priceInput && allPackages.length > 0) {
        const max = Math.max(...allPackages.map(getPackagePrice));
        priceInput.max = max;
        priceInput.value = max;

        if (priceDisplay) {
          priceDisplay.textContent = `R ${Number(max).toLocaleString()}`;
        }
      }

      applyFilters();
    } catch (err) {
      console.error(err);
      grid.innerHTML = "<p>Could not load packages. Please check the backend/API connection.</p>";
    }
  }

  if (priceInput && priceDisplay) {
    priceInput.addEventListener("input", function () {
      priceDisplay.textContent = `R ${Number(priceInput.value).toLocaleString()}`;
      applyFilters();
    });
  }

  if (searchInput) searchInput.addEventListener("input", applyFilters);
  if (destinationSelect) destinationSelect.addEventListener("change", applyFilters);
  if (sortSelect) sortSelect.addEventListener("change", applyFilters);
  if (agencySelect) agencySelect.addEventListener("change", applyFilters);
  if (accommodationSelect) accommodationSelect.addEventListener("change", applyFilters);

  document.querySelectorAll('input[name="duration"]').forEach(input => {
    input.addEventListener("change", applyFilters);
  });

  [groupOnly, flightIncluded, excursionsIncluded, restaurantsIncluded, accommodationIncluded].forEach(input => {
    if (input) input.addEventListener("change", applyFilters);
  });

  ratingButtons.forEach(button => {
    button.addEventListener("click", function () {
      ratingButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      minRating = Number(button.dataset.rating || 0);
      applyFilters();
    });
  });

  if (applyBtn) applyBtn.addEventListener("click", applyFilters);

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      if (searchInput) searchInput.value = "";
      if (destinationSelect) destinationSelect.value = "";
      if (agencySelect) agencySelect.value = "";
      if (accommodationSelect) accommodationSelect.value = "";

      if (priceInput) priceInput.value = priceInput.max;
      if (priceDisplay && priceInput) {
        priceDisplay.textContent = `R ${Number(priceInput.value).toLocaleString()}`;
      }

      document.querySelectorAll('input[name="duration"]').forEach(input => {
        input.checked = false;
      });

      [groupOnly, flightIncluded, excursionsIncluded, restaurantsIncluded, accommodationIncluded].forEach(input => {
        if (input) input.checked = false;
      });

      minRating = 0;
      ratingButtons.forEach(btn => btn.classList.remove("active"));

      const allRatingBtn = document.querySelector('.rating-filter-btn[data-rating="0"]');
      if (allRatingBtn) allRatingBtn.classList.add("active");

      applyFilters();
    });
  }

  grid.addEventListener("click", function (e) {
    const btn = e.target.closest(".compare-add");
    if (!btn) return;

    if (typeof addToCompare === "function") {
      addToCompare(btn.dataset.id);
      alert("Package added to compare.");
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  const destinationFromURL = urlParams.get("destination");
  const typeFromURL = urlParams.get("type");
  const experienceFromURL = urlParams.get("experience");

  if (destinationFromURL && searchInput) {
    searchInput.value = destinationFromURL;
  }

  if (typeFromURL === "group" && groupOnly) {
    groupOnly.checked = true;
  }

  if (experienceFromURL === "restaurant" && restaurantsIncluded) {
    restaurantsIncluded.checked = true;
  }

  if (experienceFromURL === "excursion" && excursionsIncluded) {
    excursionsIncluded.checked = true;
  }

  if (experienceFromURL === "resort" && accommodationSelect) {
    setTimeout(() => {
      accommodationSelect.value = "resort";
      applyFilters();
    }, 500);
  } 

  loadInitialPackages();
});