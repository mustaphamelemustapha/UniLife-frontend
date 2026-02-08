const API_BASE = localStorage.getItem("apiBase") || "https://unilife-backend.onrender.com";
const token = localStorage.getItem("token");

const emailEl = document.getElementById("profileEmail");
const displayName = document.getElementById("displayName");
const avatarUrl = document.getElementById("avatarUrl");
const darkMode = document.getElementById("darkMode");
const saveBtn = document.getElementById("saveProfile");
const messageEl = document.getElementById("profileMessage");

function requireLogin() {
  if (!token) {
    window.location.href = "../auth/index.html";
    return false;
  }
  return true;
}

async function loadProfile() {
  if (!requireLogin()) return;
  const res = await fetch(`${API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return;
  const data = await res.json();
  emailEl.textContent = data.email;
  displayName.value = data.display_name || "";
  avatarUrl.value = data.avatar_url || "";
  darkMode.checked = !!data.dark_mode;
}

saveBtn.addEventListener("click", async () => {
  if (!requireLogin()) return;
  messageEl.textContent = "Saving...";
  const res = await fetch(`${API_BASE}/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      display_name: displayName.value.trim() || null,
      avatar_url: avatarUrl.value.trim() || null,
      dark_mode: darkMode.checked ? 1 : 0
    })
  });
  if (!res.ok) {
    messageEl.textContent = "Save failed";
    return;
  }
  messageEl.textContent = "Saved";
  localStorage.setItem("dark_mode", darkMode.checked ? "1" : "0");
  document.body.classList.toggle("dark", darkMode.checked);
});

loadProfile();
