document.addEventListener("DOMContentLoaded", async () => {
    const grid = document.getElementById("browse-grid");
    if (!grid) return;
  
    const count = document.getElementById("results-count");
    const total = document.getElementById("total-count");
    const search = document.getElementById("filter-search");
    const dest = document.getElementById("filter-destination");
    const sort = document.getElementById("sort-select");
    const price = document.getElementById("filter-price-max");
    const ratingButtons = document.querySelectorAll(".rating-filter-btn");
  
    let minRating = 0;
  
    const params = new URLSearchParams(location.search);
    if (params.get("destination")) {
      search.value = params.get("destination");
    }
  
    async function refresh() {
      grid.innerHTML = "<p>Loading packages...</p>";
  
      const packages = await loadPackagesFromBackend({
        search: search.value || dest.value,
        sort: sort.value,
        maxPrice: price.value,
        minRating
      });
  
      grid.innerHTML = packages.map(renderPackageCard).join("");
  
      if (count) count.textContent = `${packages.length} packages found`;
      if (total) total.textContent = packages.length;
  
      const empty = document.getElementById("empty-state");
      if (empty) empty.style.display = packages.length ? "none" : "block";
    }
  
    document.getElementById("apply-filters-btn")?.addEventListener("click", refresh);
  
    document.getElementById("clear-filters-btn")?.addEventListener("click", () => {
      search.value = "";
      dest.value = "";
      price.value = price.max;
      minRating = 0;
      refresh();
    });
  
    sort?.addEventListener("change", refresh);
  
    price?.addEventListener("input", () => {
      document.getElementById("price-display").textContent =
        `R ${Number(price.value).toLocaleString()}`;
    });
  
    ratingButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        ratingButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        minRating = Number(btn.dataset.rating || 0);
        refresh();
      });
    });
  
    grid.addEventListener("click", e => {
      const btn = e.target.closest(".compare-add");
      if (!btn) return;
  
      addToCompare(btn.dataset.id);
      alert("Package added to compare.");
    });
  
    refresh();
  });