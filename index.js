import express from "express";
import fs from "fs-extra";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const PORT = 3000;
const FILE_PATH = "./tasks.json";

app.use(cors());
app.use(bodyParser.json());

async function loadTasks() {
  try {
    const data = await fs.readFile(FILE_PATH, "utf-8");
    return JSON.parse(data || "[]");
  } catch {
    return [];
  }
}

async function saveTasks(tasks) {
  await fs.writeFile(FILE_PATH, JSON.stringify(tasks, null, 2));
}

app.post("/tasks", async (req, res) => {
  const { title, completed = false } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  const tasks = await loadTasks();
  const newTask = { id: Date.now(), title, completed };
  tasks.push(newTask);
  await saveTasks(tasks);

  res.status(201).json(newTask);
});

app.get("/tasks", async (req, res) => {
  const tasks = await loadTasks();
  res.json(tasks);
});

app.get("/tasks/:id", async (req, res) => {
  const tasks = await loadTasks();
  const task = tasks.find(t => t.id === Number(req.params.id));
  task ? res.json(task) : res.status(404).json({ error: "Task not found" });
});

app.put("/tasks/:id", async (req, res) => {
  const tasks = await loadTasks();
  const idx = tasks.findIndex(t => t.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Task not found" });

  const { title, completed } = req.body;
  if (title !== undefined) tasks[idx].title = title;
  if (completed !== undefined) tasks[idx].completed = completed;

  await saveTasks(tasks);
  res.json(tasks[idx]);
});

app.delete("/tasks/:id", async (req, res) => {
  const tasks = await loadTasks();
  const filtered = tasks.filter(t => t.id !== Number(req.params.id));
  if (filtered.length === tasks.length)
    return res.status(404).json({ error: "Task not found" });

  await saveTasks(filtered);
  res.json({ message: "Task deleted successfully" });
});

app.get("/tasks/filter/:status", async (req, res) => {
  const status = req.params.status === "completed";
  const tasks = await loadTasks();
  const filtered = tasks.filter(t => t.completed === status);
  res.json(filtered);
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
