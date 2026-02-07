const planInput = document.getElementById("planInput");
const daySelect = document.getElementById("daySelect");
const prioritySelect = document.getElementById("prioritySelect");
const addPlanBtn = document.getElementById("addPlanBtn");
const daySections = document.querySelectorAll(".day-section");
const userEmail = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");

const API_BASE = "https://unilife-backend.onrender.com/study";

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

/* ================= LOAD PLANS ================= */
async function loadPlans() {
  try {
    if (!requireToken()) return;
    const res = await fetch(`${API_BASE}/`, {
      headers: { ...authHeaders() }
    });
    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "../auth/index.html?reason=expired";
      return;
    }
    if (!res.ok) throw new Error("Failed to load");

    const plans = await res.json();

    // Clear UI
    daySections.forEach(section => {
      section.querySelector(".plans").innerHTML = "";
    });

    plans.forEach(plan => {
      const div = document.createElement("div");
      div.className = `plan ${plan.priority}`;
      div.dataset.id = plan.id;

      div.innerHTML = `
        <span class="task-text">${plan.task} (${plan.priority})</span>
        <button class="edit-btn">✏️</button>
        <button class="delete-btn">❌</button>
      `;

      const container = document.querySelector(
        `.day-section[data-day="${plan.day}"] .plans`
      );
      if (container) container.appendChild(div);

      // ================= DELETE =================
      div.querySelector(".delete-btn").addEventListener("click", () => {
        deletePlan(plan.id);
      });

      // ================= EDIT =================
      div.querySelector(".edit-btn").addEventListener("click", () => {
        editPlan(plan);
      });
    });

  } catch (err) {
    alert("Failed to load study plans");
    console.error(err);
  }
}

/* ================= ADD PLAN ================= */
addPlanBtn.addEventListener("click", async () => {
  const task = planInput.value.trim();
  const day = daySelect.value;
  const priority = prioritySelect.value;

  if (!task) {
    alert("Please enter a task");
    return;
  }

  try {
    if (!requireToken()) return;
    const res = await fetch(`${API_BASE}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ task, day, priority })
    });
    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "../auth/index.html?reason=expired";
      return;
    }

    if (!res.ok) throw new Error("Save failed");

    planInput.value = "";
    loadPlans();

  } catch (err) {
    alert("Failed to save study plan");
    console.error(err);
  }
});

/* ================= DELETE PLAN ================= */
async function deletePlan(planId) {
  if (!confirm("Delete this plan?")) return;

  try {
    if (!requireToken()) return;
    const res = await fetch(`${API_BASE}/${planId}`, {
      method: "DELETE",
      headers: { ...authHeaders() }
    });
    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "../auth/index.html?reason=expired";
      return;
    }
    if (!res.ok) throw new Error("Delete failed");

    loadPlans();

  } catch (err) {
    alert("Failed to delete plan");
    console.error(err);
  }
}

/* ================= EDIT PLAN ================= */
function editPlan(plan) {
  // Prefill input fields with plan data
  planInput.value = plan.task;
  daySelect.value = plan.day;
  prioritySelect.value = plan.priority;

  // Change Add button to Update button
  addPlanBtn.textContent = "Update Task";

  addPlanBtn.onclick = async () => {
    const updatedTask = planInput.value.trim();
    const updatedDay = daySelect.value;
    const updatedPriority = prioritySelect.value;

    if (!updatedTask) {
      alert("Please enter a task");
      return;
    }

    try {
      if (!requireToken()) return;
      const res = await fetch(`${API_BASE}/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ task: updatedTask, day: updatedDay, priority: updatedPriority })
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "../auth/index.html?reason=expired";
        return;
      }

      if (!res.ok) throw new Error("Update failed");

      // Reset button and input fields
      addPlanBtn.textContent = "Add Task";
      planInput.value = "";
      loadPlans();

      // Restore Add button click
      addPlanBtn.onclick = null;
      addPlanBtn.addEventListener("click", async () => {
        const task = planInput.value.trim();
        const day = daySelect.value;
        const priority = prioritySelect.value;

        if (!task) return alert("Please enter a task");

        try {
          if (!requireToken()) return;
          const res = await fetch(`${API_BASE}/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ task, day, priority })
          });
          if (res.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "../auth/index.html?reason=expired";
            return;
          }
          if (!res.ok) throw new Error("Save failed");
          planInput.value = "";
          loadPlans();
        } catch (err) {
          alert("Failed to save plan");
          console.error(err);
        }
      });

    } catch (err) {
      alert("Failed to update plan");
      console.error(err);
    }
  };
}

/* ================= INIT ================= */
loadPlans();
loadMe();

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "../auth/index.html";
});
