function getToken() {
  return localStorage.getItem("token");
}

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

function requireLogin() {
  const token = getToken();
  if (!token) {
    window.location.href = "../auth/index.html";
    return null;
  }
  if (isTokenExpired(token)) {
    localStorage.removeItem("token");
    window.location.href = "../auth/index.html?reason=expired";
    return null;
  }
  return token;
}

const token = requireLogin();
const userEmail = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");
const adminLink = document.getElementById("adminLink");

async function loadMe() {
  if (!token) return;
  const API_BASE = localStorage.getItem("apiBase") || "https://unilife-backend.onrender.com";
  try {
    const res = await fetch(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "../auth/index.html?reason=expired";
      return;
    }
    if (!res.ok) throw new Error("Failed");
    const me = await res.json();
    userEmail.textContent = `Logged in as ${me.email}`;
  } catch {
    userEmail.textContent = "Logged in";
  }
}

loadMe();

async function checkAdmin() {
  if (!token) return;
  const API_BASE = localStorage.getItem("apiBase") || "https://unilife-backend.onrender.com";
  try {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      adminLink.style.display = "inline-block";
    }
  } catch {
    // ignore
  }
}

checkAdmin();

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "../auth/index.html";
});
