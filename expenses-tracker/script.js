// ================== API ==================
const API_EXPENSES = "https://unilife-backend.onrender.com/expenses/";
const API_RESET = "https://unilife-backend.onrender.com/expenses/reset/";

// ================== DOM ==================
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const addExpenseBtn = document.getElementById("addExpense");
const expenseList = document.getElementById("expenseList");
const totalAmount = document.getElementById("totalAmount");
const userEmail = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");

function getToken() {
  return localStorage.getItem("token");
}

function getApiBase() {
  return localStorage.getItem("apiBase") || "https://unilife-backend.onrender.com";
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

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function requireToken() {
  const token = getToken();
  if (!token) {
    window.location.href = "../auth/index.html";
    return false;
  }
  if (isTokenExpired(token)) {
    localStorage.removeItem("token");
    window.location.href = "../auth/index.html?reason=expired";
    return false;
  }
  return true;
}

function addActivity(message) {
  const items = JSON.parse(localStorage.getItem("activity") || "[]");
  items.unshift({ message, ts: Date.now() });
  localStorage.setItem("activity", JSON.stringify(items.slice(0, 50)));
}

async function loadMe() {
  const token = getToken();
  if (!token) return;
  try {
    const res = await fetch(`${getApiBase()}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed");
    const me = await res.json();
    userEmail.textContent = me.email || "Logged in";
  } catch {
    userEmail.textContent = "Logged in";
  }
}

// ================== LOAD ==================
async function loadExpenses() {
  try {
    if (!requireToken()) return;
    const res = await fetch(API_EXPENSES, {
      headers: { ...authHeaders() }
    });
    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "../auth/index.html?reason=expired";
      return;
    }
    if (!res.ok) throw new Error("Fetch failed");

    const expenses = await res.json();

    expenseList.innerHTML = "";
    let total = 0;

    expenses.forEach(exp => {
      total += exp.amount;

      const li = document.createElement("li");
      li.innerHTML = `
        <span><strong>${exp.category}</strong> — ₦${exp.amount}</span>
        <button class="delete-btn">❌</button>
      `;

      li.querySelector(".delete-btn").addEventListener("click", () => {
        deleteExpense(exp.id);
      });

      expenseList.appendChild(li);
    });

    totalAmount.textContent = `₦${total}`;
  } catch (err) {
    console.error(err);
    alert("Failed to load expenses");
  }
}

// ================== ADD ==================
addExpenseBtn.addEventListener("click", async () => {
  const amount = Number(amountInput.value);
  const category = categoryInput.value.trim();

  if (!amount || !category) {
    alert("Enter valid expense details");
    return;
  }

  try {
    if (!requireToken()) return;
    const res = await fetch(API_EXPENSES, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ amount, category })
    });
    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "../auth/index.html?reason=expired";
      return;
    }

    if (!res.ok) throw new Error("Save failed");

    amountInput.value = "";
    categoryInput.value = "";
    addActivity(`Added expense: ${category} (₦${amount})`);
    loadExpenses();
  } catch (err) {
    console.error(err);
    alert("Failed to save expense");
  }
});

// ================== DELETE ==================
async function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;

  try {
    if (!requireToken()) return;
    const res = await fetch(`${API_EXPENSES}${id}`, {
      method: "DELETE",
      headers: { ...authHeaders() }
    });
    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "../auth/index.html?reason=expired";
      return;
    }

    if (!res.ok) throw new Error("Delete failed");

    loadExpenses();
    addActivity("Deleted an expense");
  } catch (err) {
    console.error(err);
    alert("Failed to delete expense");
  }
}

// ================== RESET ==================
async function resetExpenses() {
  if (!confirm("Reset ALL expenses?")) return;

  try {
    if (!requireToken()) return;
    const res = await fetch(API_RESET, {
      method: "POST",
      headers: { ...authHeaders() }
    });
    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "../auth/index.html?reason=expired";
      return;
    }

    if (!res.ok) throw new Error("Reset failed");

    loadExpenses();
    addActivity("Reset all expenses");
  } catch (err) {
    console.error(err);
    alert("Failed to reset expenses");
  }
}

// ================== INIT ==================
loadExpenses();
loadMe();

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "../auth/index.html";
});
