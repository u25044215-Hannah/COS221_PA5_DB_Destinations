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