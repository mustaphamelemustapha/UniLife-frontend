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
const activityList = document.getElementById("activityList");
const onboarding = document.getElementById("onboarding");
const tourTitle = document.getElementById("tourTitle");
const tourBody = document.getElementById("tourBody");
const tourNext = document.getElementById("tourNext");
const tourSkip = document.getElementById("tourSkip");

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
    localStorage.setItem("current_user_email", me.email || "");
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
  localStorage.removeItem("current_user_email");
  window.location.href = "../auth/index.html";
});

async function loadAnalytics() {
  if (!token) return;
  const API_BASE = localStorage.getItem("apiBase") || "https://unilife-backend.onrender.com";
  try {
    const res = await fetch(`${API_BASE}/analytics/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json();

    const weeklyLabels = data.weekly.map(d => d.label);
    const weeklyValues = data.weekly.map(d => d.value);
    const monthlyLabels = data.monthly.map(d => d.label);
    const monthlyValues = data.monthly.map(d => d.value);
    const categoryLabels = data.categories.map(d => d.label);
    const categoryValues = data.categories.map(d => d.value);

    new Chart(document.getElementById("weeklyChart"), {
      type: "bar",
      data: {
        labels: weeklyLabels,
        datasets: [{
          label: "₦",
          data: weeklyValues,
          backgroundColor: "#2563eb"
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });

    new Chart(document.getElementById("monthlyChart"), {
      type: "line",
      data: {
        labels: monthlyLabels,
        datasets: [{
          label: "₦",
          data: monthlyValues,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37,99,235,0.15)",
          fill: true,
          tension: 0.3
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });

    new Chart(document.getElementById("categoryChart"), {
      type: "doughnut",
      data: {
        labels: categoryLabels,
        datasets: [{
          data: categoryValues,
          backgroundColor: ["#2563eb", "#60a5fa", "#34d399", "#fbbf24", "#f97316", "#a78bfa"]
        }]
      },
      options: { responsive: true, plugins: { legend: { position: "bottom" } } }
    });
  } catch {
    // ignore for now
  }
}

loadAnalytics();

function getActivityKey() {
  const email = localStorage.getItem("current_user_email") || "anon";
  return `activity:${email}`;
}

function renderActivity() {
  if (!activityList) return;
  const items = JSON.parse(localStorage.getItem(getActivityKey()) || "[]");
  if (items.length === 0) {
    activityList.innerHTML = "<div class='activity-item'>No recent activity yet.</div>";
    return;
  }
  activityList.innerHTML = "";
  items.slice(0, 10).forEach(item => {
    const div = document.createElement("div");
    const date = new Date(item.ts);
    div.className = "activity-item";
    div.innerHTML = `<span>${item.message}</span><span>${date.toLocaleString()}</span>`;
    activityList.appendChild(div);
  });
}

renderActivity();

function startOnboarding() {
  if (!onboarding) return;
  const seen = localStorage.getItem("onboarding_seen");
  if (seen === "1") return;

  const steps = [
    { title: "Welcome to UniLife", body: "Your dashboard is your home base." },
    { title: "Track Expenses", body: "Add spending and watch your trends." },
    { title: "Plan Studies", body: "Set weekly tasks and priorities." },
    { title: "Stay Consistent", body: "Use analytics to keep momentum." }
  ];

  let idx = 0;
  onboarding.classList.add("active");
  tourTitle.textContent = steps[idx].title;
  tourBody.textContent = steps[idx].body;

  tourNext.onclick = () => {
    idx += 1;
    if (idx >= steps.length) {
      onboarding.classList.remove("active");
      localStorage.setItem("onboarding_seen", "1");
      return;
    }
    tourTitle.textContent = steps[idx].title;
    tourBody.textContent = steps[idx].body;
  };

  tourSkip.onclick = () => {
    onboarding.classList.remove("active");
    localStorage.setItem("onboarding_seen", "1");
  };
}

startOnboarding();
