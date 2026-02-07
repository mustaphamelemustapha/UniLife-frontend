const DEFAULT_API_BASE = "https://unilife-backend.onrender.com";
const API_BASE = localStorage.getItem("apiBase") || DEFAULT_API_BASE;
localStorage.setItem("apiBase", API_BASE);

const registerForm = document.getElementById("registerForm");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const registerPasswordConfirm = document.getElementById("registerPasswordConfirm");
const registerMessage = document.getElementById("registerMessage");

const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginMessage = document.getElementById("loginMessage");

function setMessage(el, msg, isError = false) {
  if (!el) return;
  el.textContent = msg;
  el.style.color = isError ? "#b91c1c" : "#2563eb";
}

function saveToken(token) {
  localStorage.setItem("token", token);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function readUrlMessage() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("reason") === "expired") {
    setMessage(loginMessage, "Session expired. Please log in again.", true);
  }
  if (params.get("reason") === "logout") {
    setMessage(loginMessage, "You have been logged out.", false);
  }
}

readUrlMessage();

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (registerPasswordConfirm && registerPassword.value !== registerPasswordConfirm.value) {
      setMessage(registerMessage, "Passwords do not match.", true);
      return;
    }

    setMessage(registerMessage, "Creating account...");

    try {
      const res = await fetchWithTimeout(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerEmail.value.trim(),
          password: registerPassword.value
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Registration failed");
      }

      const data = await res.json();
      saveToken(data.access_token);
      window.location.href = "../dashboard/index.html";
    } catch (err) {
      const msg = err.name === "AbortError" ? "Request timed out. Try again." : err.message;
      setMessage(registerMessage, msg, true);
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMessage(loginMessage, "Logging in...");

    try {
      const res = await fetchWithTimeout(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.value.trim(),
          password: loginPassword.value
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Login failed");
      }

      const data = await res.json();
      saveToken(data.access_token);
      window.location.href = "../dashboard/index.html";
    } catch (err) {
      const msg = err.name === "AbortError" ? "Request timed out. Try again." : err.message;
      setMessage(loginMessage, msg, true);
    }
  });
}
