const STORAGE_KEY = "minhas-tarefas";

const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const taskSummary = document.querySelector("#task-summary");
const installButton = document.querySelector("#install-button");

let tasks = loadTasks();
let installPrompt = null;

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(savedTasks) ? savedTasks : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createTaskElement(task) {
  const item = document.createElement("li");
  item.className = `task-item${task.completed ? " completed" : ""}`;
  item.dataset.id = task.id;
  item.tabIndex = 0;
  item.setAttribute("role", "checkbox");
  item.setAttribute("aria-checked", String(task.completed));
  item.setAttribute("aria-label", `${task.text}. ${task.completed ? "Concluída" : "Pendente"}`);

  const toggleButton = document.createElement("button");
  toggleButton.className = "task-toggle";
  toggleButton.type = "button";
  toggleButton.dataset.action = "toggle";
  toggleButton.setAttribute("aria-label", task.completed ? "Marcar como pendente" : "Marcar como concluída");
  toggleButton.setAttribute("aria-pressed", String(task.completed));
  toggleButton.textContent = "✓";

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.text;

  const deleteButton = document.createElement("button");
  deleteButton.className = "task-delete";
  deleteButton.type = "button";
  deleteButton.dataset.action = "delete";
  deleteButton.setAttribute("aria-label", `Excluir tarefa: ${task.text}`);
  deleteButton.innerHTML = "&times;";

  item.append(toggleButton, text, deleteButton);
  return item;
}

function renderTasks() {
  taskList.replaceChildren(...tasks.map(createTaskElement));

  const pendingCount = tasks.filter((task) => !task.completed).length;
  emptyState.hidden = tasks.length > 0;

  if (tasks.length === 0) {
    taskSummary.textContent = "Nenhuma tarefa por enquanto";
  } else if (pendingCount === 0) {
    taskSummary.textContent = "Você concluiu todas as tarefas";
  } else {
    taskSummary.textContent = `${pendingCount} ${pendingCount === 1 ? "tarefa pendente" : "tarefas pendentes"}`;
  }
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = taskInput.value.trim();
  if (!text) return;

  tasks.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    text,
    completed: false,
  });

  saveTasks();
  renderTasks();
  taskForm.reset();
  taskInput.focus();
});

taskList.addEventListener("click", (event) => {
  const item = event.target.closest(".task-item");
  if (!item) return;

  const button = event.target.closest("button[data-action]");
  const taskId = item.dataset.id;

  if (button?.dataset.action === "delete") {
    tasks = tasks.filter((task) => task.id !== taskId);
  } else {
    tasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
  }

  saveTasks();
  renderTasks();
});

taskList.addEventListener("keydown", (event) => {
  const item = event.target.closest(".task-item");
  if (!item || event.target !== item || !["Enter", " "].includes(event.key)) return;

  event.preventDefault();
  const taskId = item.dataset.id;
  tasks = tasks.map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
  if (!installPrompt) return;

  installButton.hidden = true;
  await installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
});

window.addEventListener("appinstalled", () => {
  installPrompt = null;
  installButton.hidden = true;
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.error("Não foi possível registrar o service worker:", error);
    });
  });
}

renderTasks();
