const API_BASE = localStorage.getItem("apiBase") || "https://unilife-backend.onrender.com";
const token = localStorage.getItem("token");

const adminStatus = document.getElementById("adminStatus");
const logoutBtn = document.getElementById("logoutBtn");

const usersCount = document.getElementById("usersCount");
const expensesCount = document.getElementById("expensesCount");
const studyCount = document.getElementById("studyCount");

const usersTable = document.getElementById("usersTable");
const expensesTable = document.getElementById("expensesTable");
const studyTable = document.getElementById("studyTable");

function redirectLogin() {
  window.location.href = "../auth/index.html";
}

if (!token) {
  redirectLogin();
}

async function fetchAdmin(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    redirectLogin();
    return null;
  }
  if (res.status === 403) {
    adminStatus.textContent = "Access denied. Admins only.";
    return null;
  }
  if (!res.ok) {
    adminStatus.textContent = "Failed to load admin data.";
    return null;
  }
  return res.json();
}

function renderTable(container, rows, formatter) {
  container.innerHTML = "";
  rows.forEach(row => {
    const div = document.createElement("div");
    div.className = "table-row";
    div.innerHTML = formatter(row);
    container.appendChild(div);
  });
}

async function loadAll() {
  const users = await fetchAdmin("/admin/users");
  if (users) {
    usersCount.textContent = users.length;
    renderTable(usersTable, users.slice(0, 8), (u) => `
      <strong>${u.email}</strong>
      <span>ID: ${u.id}</span>
    `);
  }

  const expenses = await fetchAdmin("/admin/expenses");
  if (expenses) {
    expensesCount.textContent = expenses.length;
    renderTable(expensesTable, expenses.slice(0, 8), (e) => `
      <strong>${e.category} — ₦${e.amount}</strong>
      <span>${e.user_email}</span>
    `);
  }

  const study = await fetchAdmin("/admin/study");
  if (study) {
    studyCount.textContent = study.length;
    renderTable(studyTable, study.slice(0, 8), (s) => `
      <strong>${s.task} (${s.priority})</strong>
      <span>${s.user_email}</span>
    `);
  }
}

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "../auth/index.html?reason=logout";
});

loadAll();
