const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Initializing SQLite database
const db = new sqlite3.Database(":memory:");

db.serialize(() => {
  db.run(`CREATE TABLE tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending'
    )`);
});

// create a task
app.post("/tasks", (req, res) => {
  const { title, description } = req.body;
  const status = "pending";

  db.run(
    `INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)`,
    [title, description, status],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID, title, description, status });
    }
  );
});

//  get all tasks
app.get("/tasks", (req, res) => {
  db.all(`SELECT * FROM tasks`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

//Fetch task by ID
app.get("/tasks/:id", (req, res) => {
  const id = req.params.id;
  db.get(`SELECT * FROM tasks WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(row);
  });
});

//Put to update task
app.put("/tasks/:id", (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  db.run(
    `UPDATE tasks SET status = ? WHERE id = ?`,
    [status, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json({ id, status });
    }
  );
});

//Delete task with ID
app.delete("/tasks/:id", (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM tasks WHERE id = ?`, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(204).send();
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
