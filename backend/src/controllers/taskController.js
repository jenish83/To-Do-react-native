const Task = require('../models/Task');

const PRIORITIES = ['low', 'medium', 'high'];

// Checks the request body. Returns an error message or null.
// partial=true is used for updates (only validate the fields that were sent).
function validateTask(body, { partial }) {
  const { title, dateTime, deadline, priority } = body;

  if (!partial || title !== undefined) {
    if (!title || !String(title).trim()) return 'Title is required';
  }
  if (!partial || deadline !== undefined) {
    if (!deadline || isNaN(new Date(deadline))) return 'A valid deadline is required';
  }
  if (dateTime !== undefined && isNaN(new Date(dateTime))) return 'Invalid date-time';
  if (priority !== undefined && !PRIORITIES.includes(priority)) {
    return 'Priority must be low, medium or high';
  }
  if (dateTime && deadline && new Date(deadline) < new Date(dateTime)) {
    return 'Deadline cannot be before the task date-time';
  }
  return null;
}

// GET /api/tasks  -> all tasks of the logged-in user
exports.getTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
};

// POST /api/tasks  -> create a task
exports.createTask = async (req, res, next) => {
  try {
    const error = validateTask(req.body, { partial: false });
    if (error) return res.status(400).json({ message: error });

    const { title, description, dateTime, deadline, priority } = req.body;
    const task = await Task.create({
      user: req.user.id, // taken from the token, not from the client
      title,
      description,
      dateTime,
      deadline,
      priority,
    });
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
};

// PUT /api/tasks/:id  -> update any fields (also used for completed true/false)
exports.updateTask = async (req, res, next) => {
  try {
    const error = validateTask(req.body, { partial: true });
    if (error) return res.status(400).json({ message: error });

    // Filter by user too, so nobody can edit someone else's task
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Only allow these fields to be changed
    const allowed = ['title', 'description', 'dateTime', 'deadline', 'priority', 'completed'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    const datesChanged = req.body.dateTime !== undefined || req.body.deadline !== undefined;
    if (datesChanged && new Date(task.deadline) < new Date(task.dateTime)) {
      return res.status(400).json({ message: 'Deadline cannot be before the task date-time' });
    }

    await task.save();
    res.json({ task });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted', id: task._id });
  } catch (err) {
    next(err);
  }
};
