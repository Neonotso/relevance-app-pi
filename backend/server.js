const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = 5173;
const DATA_FILE = path.join(__dirname, 'tasks.json');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// Helper functions
const loadTasks = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading tasks:', e);
    return [];
  }
};

const saveTasks = (tasks) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
    return true;
  } catch (e) {
    console.error('Error saving tasks:', e);
    return false;
  }
};

// API Routes

// Get all tasks
app.get('/api/tasks', (req, res) => {
  const tasks = loadTasks();
  res.json(tasks);
});

// Add a new task
app.post('/api/tasks', (req, res) => {
  const { title, notes = '', project_tag = null } = req.body;
  const t = Date.now();
  const task = {
    id: generateId(),
    title,
    notes,
    status: 'vault',
    created_at: t,
    updated_at: t,
    last_reviewed_at: null,
    last_marked_relevant_at: null,
    last_marked_irrelevant_at: null,
    due_date: null,
    snooze_until: null,
    relevance_score: 1,
    project_tag,
  };

  const tasks = loadTasks();
  tasks.unshift(task);
  saveTasks(tasks);
  res.json(task);
});

// Update a task
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const tasks = loadTasks();
  
  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  tasks[taskIndex] = { ...tasks[taskIndex], ...updates, updated_at: Date.now() };
  saveTasks(tasks);
  res.json(tasks[taskIndex]);
});

// Delete a task
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const tasks = loadTasks();
  
  const filtered = tasks.filter(t => t.id !== id);
  if (filtered.length === tasks.length) {
    return res.status(404).json({ error: 'Task not found' });
  }

  saveTasks(filtered);
  res.json({ success: true });
});

// Utility
function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

// Start server
app.listen(PORT, () => {
  console.log(`Relevance Backend API running on port ${PORT}`);
  console.log(`Data file: ${DATA_FILE}`);
});
