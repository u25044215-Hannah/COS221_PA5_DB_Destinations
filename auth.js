// auth.js
// This handles both login.html and signup.html.

document.addEventListener("DOMContentLoaded", () => {
  // Find the login/signup form.
  const form = document.querySelector("form.auth-card");
  if (!form) return;

  // Create a message area under the form.
  const message = document.createElement("p");
  message.id = "auth-message";
  message.style.marginTop = "12px";
  form.appendChild(message);

  // Run this when the form is submitted.
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    message.textContent = "Processing...";

    const inputs = form.querySelectorAll("input");

    // Check whether the current page is login.html.
    const isLogin = location.pathname.toLowerCase().includes("login");

    try {
      if (isLogin) {
        // LOGIN PAGE

        const email = inputs[0].value.trim();
        const password = inputs[1].value;

        // Send login data to the PHP login file.
        const json = await apiPost("LogIn.php", { email, password });

        if (!json.success) {
          throw new Error(json.message || "Login failed");
        }

        // Save logged-in user in localStorage.
        setCurrentUser(json.user);

        // Send agents to agency page and travellers to browse page.
        location.href = json.user.userType === "Agent" ? "agency.html" : "browse.html";
      } else {
        // SIGNUP PAGE

        const fullName = inputs[0].value.trim();
        const email = inputs[1].value.trim();
        const password = inputs[2].value;
        const confirm = inputs[3].value;

        // Make sure both password fields match.
        if (password !== confirm) {
          throw new Error("Passwords do not match");
        }

        // Split full name into first name and surname.
        const [name, ...rest] = fullName.split(" ");
        const surname = rest.join(" ") || "Traveller";

        // Send signup data to the PHP signup file.
        const json = await apiPost("SignUp.php", {
          name,
          surname,
          email,
          password,
          userType: "Traveller"
        });

        if (!json.success) {
          throw new Error(json.message || "Signup failed");
        }

        // Save the new user and redirect.
        setCurrentUser(json.user);
        location.href = "browse.html";
      }
    } catch (err) {
      // Show any error message to the user.
      message.textContent = err.message;
      message.style.color = "crimson";
    }
  });
});