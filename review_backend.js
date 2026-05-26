// review_backend.js
// This connects review.html to submit_review.php.

document.addEventListener("DOMContentLoaded", () => {
  // User must be logged in before reviewing.
  const user = requireLogin();
  if (!user) return;

  // Read booking/package information from the URL.
  const params = new URLSearchParams(location.search);

  // Fill hidden form fields from URL parameters.
  document.querySelector("[name='bookingID']").value = params.get("bookingID") || "";
  document.querySelector("[name='packageID']").value = params.get("packageID") || "";

  // Show selected package and agency names.
  document.getElementById("packageName").value = params.get("packageName") || "";
  document.getElementById("agencyName").value = params.get("agencyName") || "";

  const form = document.querySelector(".review-form");

  // Submit review to backend.
  form.addEventListener("submit", async e => {
    e.preventDefault();

    // Collect review data.
    const data = {
      userID: user.userID,
      bookingID: document.querySelector("[name='bookingID']").value,
      packageID: document.querySelector("[name='packageID']").value,
      comment: document.getElementById("comment").value,
      overallScore: document.getElementById("overallScore").value,
      serviceScore: document.getElementById("serviceScore").value,
      cleanlinessScore: document.getElementById("cleanlinessScore").value
    };

    // Send review to PHP backend.
    const json = await apiPost("submit_review.php", data);

    if (!json.success) {
      alert(json.message || "Review failed.");
      return;
    }

    alert("Review submitted successfully.");
    window.location.href = "bookings.html";
  });
});