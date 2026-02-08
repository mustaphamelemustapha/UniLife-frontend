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
const budgetCategory = document.getElementById("budgetCategory");
const budgetLimit = document.getElementById("budgetLimit");
const addBudgetBtn = document.getElementById("addBudget");
const budgetList = document.getElementById("budgetList");

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

function getActivityKey() {
  const email = localStorage.getItem("current_user_email") || "anon";
  return `activity:${email}`;
}

function addActivity(message) {
  const key = getActivityKey();
  const items = JSON.parse(localStorage.getItem(key) || "[]");
  items.unshift({ message, ts: Date.now() });
  localStorage.setItem(key, JSON.stringify(items.slice(0, 50)));
}

function getBudgetKey() {
  const email = localStorage.getItem("current_user_email") || "anon";
  return `budgets:${email}`;
}

function loadBudgets() {
  return JSON.parse(localStorage.getItem(getBudgetKey()) || "[]");
}

function saveBudgets(budgets) {
  localStorage.setItem(getBudgetKey(), JSON.stringify(budgets));
}

function renderBudgets(expenses) {
  const budgets = loadBudgets();
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const spentByCategory = {};
  expenses.forEach(exp => {
    const created = exp.created_at ? new Date(exp.created_at) : new Date();
    if (created.getMonth() === month && created.getFullYear() === year) {
      spentByCategory[exp.category] = (spentByCategory[exp.category] || 0) + exp.amount;
    }
  });

  budgetList.innerHTML = "";
  budgets.forEach(b => {
    const spent = spentByCategory[b.category] || 0;
    const pct = Math.min(100, Math.round((spent / b.limit) * 100));
    const div = document.createElement("div");
    div.className = "budget-item";
    div.innerHTML = `
      <h4>${b.category}</h4>
      <div class="budget-bar"><div style="width:${pct}%"></div></div>
      <div class="budget-meta">
        <span>₦${spent.toFixed(2)} spent</span>
        <span>₦${b.limit.toFixed(2)} limit</span>
      </div>
    `;
    budgetList.appendChild(div);
  });
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
    localStorage.setItem("current_user_email", me.email || "");
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
    renderBudgets(expenses);
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

addBudgetBtn.addEventListener("click", () => {
  const category = budgetCategory.value.trim();
  const limit = Number(budgetLimit.value);
  if (!category || !limit) {
    alert("Enter valid budget");
    return;
  }
  const budgets = loadBudgets();
  const existing = budgets.find(b => b.category.toLowerCase() === category.toLowerCase());
  if (existing) {
    existing.limit = limit;
  } else {
    budgets.push({ category, limit });
  }
  saveBudgets(budgets);
  budgetCategory.value = "";
  budgetLimit.value = "";
  loadExpenses();
  addActivity(`Set budget: ${category} (₦${limit})`);
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
  localStorage.removeItem("current_user_email");
  window.location.href = "../auth/index.html";
});
