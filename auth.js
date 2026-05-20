// js/auth.js

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form.auth-card");
    if (!form) return;
  
    const message = document.createElement("p");
    message.id = "auth-message";
    message.style.marginTop = "12px";
    form.appendChild(message);
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      message.textContent = "Processing...";
      const inputs = form.querySelectorAll("input");
      const isLogin = location.pathname.toLowerCase().includes("login");
  
      try {
        if (isLogin) {
          const email = inputs[0].value.trim();
          const password = inputs[1].value;
  
          const json = await apiPost("LogIn.php", { email, password });
  
          if (!json.success) throw new Error(json.message || "Login failed");
  
          setCurrentUser(json.user);
          location.href = json.user.userType === "Agent" ? "agency.html" : "browse.html";
        } else {
          const fullName = inputs[0].value.trim();
          const email = inputs[1].value.trim();
          const password = inputs[2].value;
          const confirm = inputs[3].value;
  
          if (password !== confirm) throw new Error("Passwords do not match");
  
          const [name, ...rest] = fullName.split(" ");
          const surname = rest.join(" ") || "Traveller";
  
          const json = await apiPost("SignUp.php", {
            name,
            surname,
            email,
            password,
            userType: "Traveller"
          });
  
          if (!json.success) throw new Error(json.message || "Signup failed");
  
          setCurrentUser(json.user);
          location.href = "browse.html";
        }
      } catch (err) {
        message.textContent = err.message;
        message.style.color = "crimson";
      }
    });
  });