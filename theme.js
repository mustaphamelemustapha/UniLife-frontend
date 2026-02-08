(function () {
  const token = localStorage.getItem("token");
  const API_BASE = localStorage.getItem("apiBase") || "https://unilife-backend.onrender.com";

  const apply = (enabled) => {
    document.body.classList.toggle("dark", enabled);
  };

  const local = localStorage.getItem("dark_mode");
  if (local) {
    apply(local === "1");
  }

  if (token) {
    fetch(`${API_BASE}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const enabled = !!data.dark_mode;
        localStorage.setItem("dark_mode", enabled ? "1" : "0");
        apply(enabled);
      })
      .catch(() => {});
  }
})();
