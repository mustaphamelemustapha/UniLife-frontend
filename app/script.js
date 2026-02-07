const statusEl = document.getElementById("status");
const token = localStorage.getItem("token");

if (token) {
  statusEl.textContent = "Session found. Opening your dashboard...";
  setTimeout(() => {
    window.location.href = "../dashboard/index.html";
  }, 600);
} else {
  statusEl.textContent = "No session found. Redirecting to login...";
  setTimeout(() => {
    window.location.href = "../auth/index.html";
  }, 600);
}
