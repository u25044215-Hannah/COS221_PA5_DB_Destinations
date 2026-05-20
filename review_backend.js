document.addEventListener("DOMContentLoaded", () => {
    const user = requireLogin();
    if (!user) return;
  
    const params = new URLSearchParams(location.search);
  
    document.querySelector("[name='bookingID']").value = params.get("bookingID") || "";
    document.querySelector("[name='packageID']").value = params.get("packageID") || "";
    document.getElementById("packageName").value = params.get("packageName") || "";
    document.getElementById("agencyName").value = params.get("agencyName") || "";
  
    const form = document.querySelector(".review-form");
  
    form.addEventListener("submit", async e => {
      e.preventDefault();
  
      const data = {
        userID: user.userID,
        bookingID: document.querySelector("[name='bookingID']").value,
        packageID: document.querySelector("[name='packageID']").value,
        comment: document.getElementById("comment").value,
        overallScore: document.getElementById("overallScore").value,
        serviceScore: document.getElementById("serviceScore").value,
        cleanlinessScore: document.getElementById("cleanlinessScore").value
      };
  
      const json = await apiPost("submit_review.php", data);
  
      if (!json.success) {
        alert(json.message || "Review failed.");
        return;
      }
  
      alert("Review submitted successfully.");
      window.location.href = "bookings.html";
    });
  });