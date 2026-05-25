// index.js
// Loads live homepage statistics from api.php

document.addEventListener("DOMContentLoaded", function () {
    loadAgencyStats();
    loadPopularDestinations();
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

  
  async function loadPopularDestinations() {
    const grid = document.getElementById("destinations-grid");
    if (!grid) return;
  
    const destinationImages = [
      "images/signapore.jpg",
      "images/capeTown.jpg",
      "images/abudubi.jpg"
    ];
  
    try {
      const response = await fetch("api.php?action=getPopularDestinations");
      const json = await response.json();
  
      if (!json.success) {
        console.error(json.message);
        return;
      }
  
      grid.innerHTML = json.data.slice(0, 3).map((dest, index) => {
        const city = dest.destinationCity || "";
        const country = dest.destinationCountry || "";
        const count = Number(dest.packageCount || 0);
        const image = destinationImages[index];
  
        return `
          <div class="dest-card"
               style="background-image: url('${image}')"
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

  document.addEventListener("DOMContentLoaded", function () {
    loadHomeStats();
  });
  
  async function loadHomeStats() {
    try {
      const response = await fetch("api.php?action=getHomeStats");
      const json = await response.json();
  
      if (!json.success) {
        console.error(json.message);
        return;
      }
  
      const stats = json.data;
  
      document.getElementById("stat-packages").textContent =
        Number(stats.totalPackages || 0).toLocaleString();
  
      document.getElementById("stat-agencies").textContent =
        Number(stats.totalAgencies || 0).toLocaleString();
  
      document.getElementById("stat-reviews").textContent =
        Number(stats.totalReviews || 0).toLocaleString();
  
      document.getElementById("stat-rating").textContent =
        Number(stats.averageRating || 0).toFixed(1) + " ★";
  
      document.getElementById("stat-destinations").textContent =
        Number(stats.totalDestinations || 0).toLocaleString();
  
    } catch (error) {
      console.error("Could not load homepage stats:", error);
    }
  }

  function handleSearch() {
    const destination = document.getElementById("search-destination").value.trim();
    const date = document.getElementById("search-date").value;
    const guests = document.getElementById("search-guests").value;
  
    const params = new URLSearchParams();
  
    if (destination !== "") {
      params.set("destination", destination);
    }
  
    if (date !== "") {
      params.set("date", date);
    }
  
    if (guests !== "") {
      params.set("guests", guests);
    }
  
    window.location.href = "browse.html?" + params.toString();
  }
