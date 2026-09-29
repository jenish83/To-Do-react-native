const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    // Owner of the task. Every query filters by this so users only see their own tasks.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 100 },
    description: { type: String, trim: true, default: '', maxlength: 500 },
    dateTime: { type: Date, default: Date.now }, // when the task is planned
    deadline: { type: Date, required: [true, 'Deadline is required'] },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true } // adds createdAt / updatedAt automatically
);

module.exports = mongoose.model('Task', taskSchema);
