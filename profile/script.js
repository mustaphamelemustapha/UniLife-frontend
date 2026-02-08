const API_BASE = localStorage.getItem("apiBase") || "https://unilife-backend.onrender.com";
const token = localStorage.getItem("token");

const emailEl = document.getElementById("profileEmail");
const nameEl = document.getElementById("profileName");
const displayName = document.getElementById("displayName");
const avatarFile = document.getElementById("avatarFile");
const avatarPreview = document.getElementById("avatarPreview");
const darkMode = document.getElementById("darkMode");
const saveBtn = document.getElementById("saveProfile");
const messageEl = document.getElementById("profileMessage");
let avatarDataUrl = null;

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
  nameEl.textContent = data.display_name || "No display name";
  avatarDataUrl = data.avatar_url || null;
  if (avatarDataUrl) {
    avatarPreview.src = avatarDataUrl;
  } else {
    const fallbackName = (data.display_name || "UniLife").replace(/\\s+/g, "+");
    avatarPreview.src = `https://ui-avatars.com/api/?name=${fallbackName}&background=2563eb&color=fff`;
  }
  darkMode.checked = !!data.dark_mode;
}

avatarFile.addEventListener("change", () => {
  const file = avatarFile.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    avatarDataUrl = reader.result;
    avatarPreview.src = avatarDataUrl;
  };
  reader.readAsDataURL(file);
});

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
      avatar_url: avatarDataUrl,
      dark_mode: darkMode.checked ? 1 : 0
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    messageEl.textContent = err.detail || "Save failed";
    return;
  }
  messageEl.textContent = "Saved";
  localStorage.setItem("dark_mode", darkMode.checked ? "1" : "0");
  document.body.classList.toggle("dark", darkMode.checked);
  nameEl.textContent = displayName.value.trim() || "No display name";
  await loadProfile();
});

loadProfile();
