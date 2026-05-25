// index.js
// Loads live homepage statistics from api.php

document.addEventListener("DOMContentLoaded", function () {
    loadAgencyStats();
  });
  
  async function loadAgencyStats() {
    try {
      const response = await fetch("api.php?action=getAgencyStats");
      const json = await response.json();
  
      if (!json.success) {
        console.error("Agency stats error:", json.message);
        return;
      }
  
      const stats = json.data;
  
      const agencyCount = document.getElementById("agency-count");
      const bookingCount = document.getElementById("booking-count");
      const avgPackages = document.getElementById("avg-packages");
  
      if (agencyCount) {
        agencyCount.textContent = Number(stats.totalAgencies || 0);
      }
  
      if (bookingCount) {
        bookingCount.textContent = Number(stats.totalBookings || 0);
      }
  
      if (avgPackages) {
        avgPackages.textContent = Number(stats.avgPackagesPerAgency || 0).toFixed(1);
      }
    } catch (error) {
      console.error("Could not load agency stats:", error);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadAgencyStats();
  
    // ADD THIS
    loadPopularDestinations();
  });
  
  // existing functions above...
  
  async function loadPopularDestinations() {
    const grid = document.getElementById("destinations-grid");
    if (!grid) return;
  
    try {
      const response = await fetch("api.php?action=getPopularDestinations");
      const json = await response.json();
  
      if (!json.success) {
        console.error(json.message);
        return;
      }
  
      grid.innerHTML = json.data.map(dest => {
        const city = dest.destinationCity || "";
        const country = dest.destinationCountry || "";
        const count = Number(dest.packageCount || 0);
  
        return `
          <div class="dest-card"
               onclick="window.location='browse.html?destination=${encodeURIComponent(city)}'">
  
            <div class="dest-overlay"></div>
  
            <div class="dest-info">
              <span class="dest-tag">${count} packages</span>
  
              <h3>${city}</h3>
  
              <p>${country}</p>
  
              <a href="browse.html?destination=${encodeURIComponent(city)}"
                 class="btn btn-sky btn-sm">
                Explore
              </a>
            </div>
          </div>
        `;
      }).join("");
  
    } catch (error) {
      console.error("Could not load destinations:", error);
    }
  }
