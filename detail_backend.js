document.addEventListener("DOMContentLoaded", async () => {
    const id = new URLSearchParams(location.search).get("packageID");
  
    if (!id) {
      document.getElementById("detail-title").textContent = "No package selected";
      return;
    }
  
    const json = await apiGet("get_package_details.php", { packageID: id });
  
    if (!json.success) {
      document.getElementById("detail-title").textContent = json.message || "Package not found";
      return;
    }
  
    const p = normalisePackage(json.package);
    const components = json.components || [];
  
    document.getElementById("detail-title").textContent = p.name;
    document.getElementById("detail-hero-meta").textContent =
      `${p.destination} • ${p.duration} days • ${p.rating.toFixed(1)} ★`;
  
    document.getElementById("detail-description").textContent =
      p.description || "No description available.";
  
    document.getElementById("sidebar-price").textContent = money(p.price, p.currency) + " pp";
    document.getElementById("sidebar-rating").textContent = `${p.rating.toFixed(1)} ★`;
    document.getElementById("sidebar-dates").textContent = `${p.startDate} to ${p.endDate}`;
    document.getElementById("sidebar-duration").textContent = `${p.duration} days`;
    document.getElementById("sidebar-capacity").textContent = p.maxCapacity || "—";
    document.getElementById("sidebar-agency").textContent = p.agency;
  
    const accom = components.find(c => c.componentType === "Accommodation");
  
    document.getElementById("sidebar-accomm").textContent = accom ? accom.name : "—";
    document.getElementById("sidebar-flight").textContent = "Check with agency";
  
    document.getElementById("detail-accomm").innerHTML = accom
      ? `<h3>${accom.name}</h3><p>${accom.description || ""}</p>`
      : "<p>No accommodation listed.</p>";
  
    document.getElementById("detail-restaurants").innerHTML =
      components
        .filter(c => c.componentType === "Restaurant")
        .map(c => `<div class="detail-card"><h3>${c.name}</h3><p>${c.description || ""}</p></div>`)
        .join("") || "<p>No restaurants listed.</p>";
  
    document.getElementById("detail-excursions").innerHTML =
      components
        .filter(c => c.componentType === "Excursion")
        .map(c => `<div class="detail-card"><h3>${c.name}</h3><p>${c.description || ""}</p></div>`)
        .join("") || "<p>No excursions listed.</p>";
  
    document.getElementById("detail-itinerary").innerHTML =
      components.map((c, i) => `
        <div class="itinerary-item">
          <strong>Day ${i + 1}</strong>
          <p>${c.name}: ${c.description || ""}</p>
        </div>
      `).join("");
  
    document.getElementById("reviews-summary").innerHTML =
      `<strong>${p.rating.toFixed(1)} ★ average rating</strong>`;
  
    document.getElementById("detail-reviews").innerHTML =
      (json.reviews || []).map(r => `
        <div class="review-item">
          <strong>${r.travellerName || "Traveller"}</strong> — ${r.overallScore} ★
          <p>${r.comment || ""}</p>
        </div>
      `).join("") || "<p>No reviews yet.</p>";
  
    function updateTotal() {
      const guests = Number(document.getElementById("guest-count-sidebar").value || 1);
      document.getElementById("booking-total-sidebar").innerHTML =
        `Total: <strong>${money(guests * p.price, p.currency)}</strong>`;
    }
  
    document.getElementById("guest-count-sidebar").addEventListener("input", updateTotal);
  
    document.getElementById("guest-minus").addEventListener("click", () => {
      const input = document.getElementById("guest-count-sidebar");
      input.value = Math.max(1, Number(input.value) - 1);
      updateTotal();
    });
  
    document.getElementById("guest-plus").addEventListener("click", () => {
      const input = document.getElementById("guest-count-sidebar");
      input.value = Number(input.value) + 1;
      updateTotal();
    });
  
    updateTotal();
  
    document.getElementById("compare-sidebar-btn").addEventListener("click", () => {
      addToCompare(p.id);
      alert("Package added to compare.");
    });
  
    document.getElementById("book-now-btn").addEventListener("click", async e => {
      e.preventDefault();
  
      const user = requireLogin();
      if (!user) return;
  
      const guests = Number(document.getElementById("guest-count-sidebar").value || 1);
  
      const result = await apiPost("book_package.php", {
        userID: user.userID,
        packageID: p.id,
        numGuests: guests
      });
  
      if (!result.success) {
        alert(result.message || "Booking failed");
        return;
      }
  
      alert("Booking successful!");
      window.location.href = "bookings.html";
    });
  });