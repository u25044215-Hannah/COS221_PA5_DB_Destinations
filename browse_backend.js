// browse_backend.js
// Connects browse.html to the backend and makes filtering/sorting work.

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
      pkg.description,
      pkg.destinationCity,
      pkg.destinationCountry,
      pkg.city,
      pkg.country,
      pkg.agencyName,
      pkg.companyName
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
      return Boolean(pkg.accommodation || pkg.accommodationName || pkg.propertyType) ||
        text.includes("hotel") ||
        text.includes("resort") ||
        text.includes("accommodation");
    }

    if (type === "restaurant") {
      return Boolean(pkg.restaurant || pkg.restaurantName || pkg.cuisineType) ||
        text.includes("restaurant") ||
        text.includes("dining") ||
        text.includes("food");
    }

    if (type === "excursion") {
      return Boolean(pkg.excursion || pkg.excursionName || pkg.activityName) ||
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

      const matchesDestination =
        !destinationValue ||
        normalise(pkg.destinationCity).includes(destinationValue) ||
        normalise(pkg.destinationCountry).includes(destinationValue) ||
        text.includes(destinationValue);

      const matchesPrice = !maxPrice || price <= maxPrice;

      const matchesRating = rating >= minRating;

      const matchesAgency =
        !agencyValue ||
        normalise(pkg.agentID) === agencyValue ||
        normalise(pkg.agencyID) === agencyValue ||
        normalise(pkg.companyName).includes(agencyValue) ||
        normalise(pkg.agencyName).includes(agencyValue);

      const matchesAccommodation =
        !accommodationValue ||
        normalise(pkg.propertyType).includes(accommodationValue) ||
        normalise(pkg.accommodationType).includes(accommodationValue) ||
        text.includes(accommodationValue);

      const matchesDuration = packageMatchesDuration(pkg);

      const matchesGroup = !groupOnly || !groupOnly.checked || Boolean(pkg.groupTripID || pkg.groupName || pkg.isGroupTrip);

      const matchesFlight = !flightIncluded || !flightIncluded.checked || packageHasComponent(pkg, "flight");

      const matchesExcursions = !excursionsIncluded || !excursionsIncluded.checked || packageHasComponent(pkg, "excursion");

      const matchesRestaurants = !restaurantsIncluded || !restaurantsIncluded.checked || packageHasComponent(pkg, "restaurant");

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
      if (sortValue === "price-asc") {
        return getPackagePrice(a) - getPackagePrice(b);
      }

      if (sortValue === "price-desc") {
        return getPackagePrice(b) - getPackagePrice(a);
      }

      if (sortValue === "duration-asc") {
        return getPackageDuration(a) - getPackageDuration(b);
      }

      if (sortValue === "newest") {
        return new Date(b.startDate || 0) - new Date(a.startDate || 0);
      }

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

  async function loadInitialPackages() {
    grid.innerHTML = "<p>Loading packages...</p>";

    try {
      allPackages = await loadPackagesFromBackend({});
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

  if (applyBtn) {
    applyBtn.addEventListener("click", applyFilters);
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      if (searchInput) searchInput.value = "";
      if (destinationSelect) destinationSelect.value = "";
      if (priceInput) priceInput.value = priceInput.max;
      if (priceDisplay && priceInput) {
        priceDisplay.textContent = `R ${Number(priceInput.value).toLocaleString()}`;
      }
      if (agencySelect) agencySelect.value = "";
      if (accommodationSelect) accommodationSelect.value = "";

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

  loadInitialPackages();
});