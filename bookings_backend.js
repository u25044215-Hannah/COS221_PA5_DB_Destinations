// bookings_backend.js
// This connects bookings.html to the user's bookings in the backend.

document.addEventListener("DOMContentLoaded", async () => {
  // User must be logged in to view bookings.
  const user = requireLogin();
  if (!user) return;

  const list = document.getElementById("bookings-list");

  // Ask backend for bookings belonging to this user.
  const json = await apiGet("get_bookings.php", {
    userID: user.userID
  });

  if (!json.success) {
    list.innerHTML = `<p>${json.message || "Could not load bookings."}</p>`;
    return;
  }

  const bookings = json.data || [];

  // Update summary numbers.
  document.getElementById("total-bookings").textContent = bookings.length;

  document.getElementById("upcoming-bookings").textContent =
    bookings.filter(b => new Date(b.startDate) >= new Date()).length;

  document.getElementById("pending-payments").textContent =
    bookings.filter(b => String(b.status).toLowerCase().includes("pending")).length;

  // Show empty state if the user has no bookings.
  if (!bookings.length) {
    list.innerHTML = `
      <div class="empty-bookings-state">
        <h3>No bookings to display yet</h3>
        <p>Your booked trips will appear here once you reserve a travel package.</p>
        <a href="browse.html" class="btn btn-primary btn-sm">Browse Packages</a>
      </div>
    `;
    return;
  }

  // Render every booking.
  list.innerHTML = bookings.map(b => `
    <article class="booking-card">
      <h3>${b.title}</h3>
      <p>${b.destinationCity}, ${b.destinationCountry}</p>
      <p>${b.startDate} to ${b.endDate}</p>
      <p><strong>${money(b.totalPrice)}</strong></p>
      <p>${b.numGuests} guest(s) • ${b.status}</p>

      <a class="btn btn-outline btn-sm"
         href="review.html?bookingID=${b.bookingID}&packageID=${b.packageID}&packageName=${encodeURIComponent(b.title)}&agencyName=${encodeURIComponent(b.agencyName)}">
         Leave Review
      </a>
    </article>
  `).join("");
});