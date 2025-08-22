document.addEventListener("DOMContentLoaded", function () {
  const API_URL = "https://todo-app-wa7a.onrender.com/api"; 

  // Auth elements
  const authSection = document.getElementById("authSection");
  const todoAppSection = document.getElementById("todoAppSection");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const showSignup = document.getElementById("showSignup");
  const showLogin = document.getElementById("showLogin");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // Todo app elements
  const taskList = document.getElementById("taskList");
  const newTaskInput = document.getElementById("newTaskInput");
  const addTaskBtn = document.getElementById("addTaskBtn");
  const prioritySelect = document.getElementById("prioritySelect");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const totalTasksEl = document.getElementById("totalTasks");
  const completedTasksEl = document.getElementById("completedTasks");
  const activeTasksEl = document.getElementById("activeTasks");
  const appContent = document.querySelector(".app-content");

  let tasks = [];
  let currentFilter = "all";
  let token = localStorage.getItem("token");

  // =====================
  // AUTH LOGIC
  // =====================

  // Show sign-up form
  showSignup.addEventListener("click", () => {
    loginForm.style.display = "none";
    signupForm.style.display = "block";
  });

  // Show login form
  showLogin.addEventListener("click", () => {
    signupForm.style.display = "none";
    loginForm.style.display = "block";
  });

  // Login
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) return alert("Please fill in all fields");

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      localStorage.setItem("token", data.token);
      token = data.token;

      authSection.style.display = "none";
      todoAppSection.style.display = "block";
      appContent.style.display = "block";

      await loadTasks();
    } catch (err) {
      alert(err.message || "Login failed");
    }
  });

  // Signup
  signupBtn.addEventListener("click", async () => {
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("signupConfirmPassword").value;

    if (!name || !email || !password || !confirmPassword) {
      return alert("Please fill in all fields");
    }
    if (password !== confirmPassword) return alert("Passwords do not match");

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      localStorage.setItem("token", data.token);
      token = data.token;

      authSection.style.display = "none";
      todoAppSection.style.display = "block";
      appContent.style.display = "block";

      await loadTasks();
    } catch (err) {
      alert(err.message || "Signup failed");
    }
  });

  // Logout
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    token = null;
    tasks = [];

    todoAppSection.style.display = "none";
    authSection.style.display = "block";
    loginForm.style.display = "block";
    signupForm.style.display = "none";

    document.getElementById("loginEmail").value = "";
    document.getElementById("loginPassword").value = "";
    document.getElementById("signupName").value = "";
    document.getElementById("signupEmail").value = "";
    document.getElementById("signupPassword").value = "";
    document.getElementById("signupConfirmPassword").value = "";
  });

  // =====================
  // TASKS
  // =====================

  // Load tasks from API
  async function loadTasks() {
    try {
      const res = await fetch(`${API_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      tasks = await res.json();
      renderTasks();
    } catch (err) {
      console.error("Load tasks error:", err);
    }
  }

  // Add task
  addTaskBtn.addEventListener("click", async () => {
    const text = newTaskInput.value.trim();
    const priority = prioritySelect.value;
    if (!text) return;

    try {
      const res = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, priority }),
      });

      const newTask = await res.json();
      tasks.unshift(newTask);
      newTaskInput.value = "";
      renderTasks();
    } catch (err) {
      console.error("Add task error:", err);
    }
  });

  // Render tasks
  function renderTasks() {
    taskList.innerHTML = "";

    const filteredTasks = tasks.filter((task) => {
      if (currentFilter === "all") return true;
      if (currentFilter === "completed") return task.completed;
      if (currentFilter === "active") return !task.completed;
    });

    if (filteredTasks.length === 0) {
      taskList.innerHTML = `<div class="no-tasks"><p>No tasks found</p></div>`;
      return;
    }

    filteredTasks.forEach((task) => {
      const taskItem = document.createElement("li");
      taskItem.className = `task-item ${task.priority} ${task.completed ? "completed" : ""}`;
      taskItem.dataset.id = task._id;

      taskItem.innerHTML = `
        <div class="task-checkbox ${task.completed ? "completed" : ""}"></div>
        <div class="task-text">${task.text}</div>
        <div class="task-actions">
          <button class="task-btn edit"><i class="fas fa-pencil-alt"></i></button>
          <button class="task-btn delete"><i class="fas fa-trash"></i></button>
        </div>
      `;

      taskList.appendChild(taskItem);
    });

    updateStats();
    addEventListeners();
  }

  // Update stats
  function updateStats() {
    totalTasksEl.textContent = tasks.length;
    completedTasksEl.textContent = tasks.filter((t) => t.completed).length;
    activeTasksEl.textContent = tasks.filter((t) => !t.completed).length;
  }

  // Event listeners for tasks
  function addEventListeners() {
    document.querySelectorAll(".task-checkbox").forEach((box) => {
      box.addEventListener("click", async function () {
        const taskId = this.closest(".task-item").dataset.id;
        const task = tasks.find((t) => t._id === taskId);

        try {
          const res = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ completed: !task.completed }),
          });

          const updated = await res.json();
          tasks = tasks.map((t) => (t._id === updated._id ? updated : t));
          renderTasks();
        } catch (err) {
          console.error("Toggle task error:", err);
        }
      });
    });

    document.querySelectorAll(".task-btn.delete").forEach((btn) => {
      btn.addEventListener("click", async function () {
        const taskId = this.closest(".task-item").dataset.id;
        try {
          await fetch(`${API_URL}/tasks/${taskId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          tasks = tasks.filter((t) => t._id !== taskId);
          renderTasks();
        } catch (err) {
          console.error("Delete task error:", err);
        }
      });
    });
  }

  // =====================
  // AUTO-LOGIN IF TOKEN
  // =====================
  if (token) {
    authSection.style.display = "none";
    todoAppSection.style.display = "block";
    appContent.style.display = "block";
    loadTasks();
  }
});
