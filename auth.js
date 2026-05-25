// auth.js

function getCurrentUser() {
  const user = localStorage.getItem("currentUser");
  return user ? JSON.parse(user) : null;
}

function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

function logoutUser() {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

function updateAuthButtons() {
  const user = getCurrentUser();

  if (user) {
    const navActions = document.querySelector(".nav-actions");

    if (!navActions) return;

    navActions.innerHTML = "";

    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "Log Out";
    logoutBtn.className = "btn btn-primary btn-sm";
    logoutBtn.type = "button";

    logoutBtn.addEventListener("click", logoutUser);

    navActions.appendChild(logoutBtn);
  }
}

async function postJSON(url, data) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("PHP did not return JSON. It returned:", text);
    throw new Error("Server returned HTML instead of JSON. Check that " + url + " exists and has no PHP errors.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateAuthButtons();

  const form = document.querySelector("form.auth-card");
  if (!form) return;

  const message = document.createElement("p");
  message.id = "auth-message";
  message.style.marginTop = "12px";
  form.appendChild(message);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    message.textContent = "Processing...";
    message.style.color = "black";

    const inputs = form.querySelectorAll("input");
    const isLogin = location.pathname.toLowerCase().includes("login");

    try {
      if (isLogin) {
        const email = inputs[0].value.trim();
        const password = inputs[1].value;

        const json = await postJSON("LogIn.php", {
          email: email,
          password: password
        });

        if (!json.success) {
          throw new Error(json.message || "Login failed");
        }

        setCurrentUser(json.user);

        if (json.user.userType === "Agent") {
          window.location.href = "agency.html";
        } else {
          window.location.href = "browse.html";
        }
      } else {
        // SIGNUP PAGE

const passwordInputs = form.querySelectorAll('input[type="password"]');

const fullName = form.querySelector('input[type="text"]').value.trim();
const email = form.querySelector('input[type="email"]').value.trim();
const password = passwordInputs[0].value.trim();
const confirm = passwordInputs[1].value.trim();

if (password !== confirm) {
  throw new Error("Passwords do not match");
}

const [name, ...rest] = fullName.split(" ");
const surname = rest.join(" ") || "Traveller";

const json = await apiPost("../COS221_PA5_DB_Destinations-authorisation/SignUp.php", {
  name,
  surname,
  email,
  password,
  userType: "Traveller"
});

        if (password !== confirm) {
          throw new Error("Passwords do not match");
        }

        const parts = fullName.split(" ");
        const name = parts[0];
        const surname = parts.slice(1).join(" ") || "Traveller";

        const json = await postJSON("SignUp.php", {
          name: name,
          surname: surname,
          email: email,
          password: password,
          userType: "Traveller"
        });

        if (!json.success) {
          throw new Error(json.message || "Signup failed");
        }

        setCurrentUser(json.user);
        window.location.href = "browse.html";
      }
    } catch (err) {
      message.textContent = err.message;
      message.style.color = "crimson";
    }
  });
});
