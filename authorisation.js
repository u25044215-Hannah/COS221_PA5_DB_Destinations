document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");

  if (!loginForm) return;

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    const response = await fetch("login.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    const result = await response.json();

    if (!result.success) {
      alert(result.message || "Login failed");
      return;
    }

    localStorage.setItem("user", JSON.stringify(result.data));

    if (result.data.userType === "Agent") {
      window.location.href = "agency-dashboard.html";
    } else if (result.data.userType === "Traveller") {
      window.location.href = "traveller-dashboard.html";
    } else {
      alert("Unknown user type");
    }
  });
});
