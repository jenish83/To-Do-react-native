const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true, // no two accounts with the same email
      lowercase: true,
      trim: true,
    },
    // Stores the HASHED password, never the plain text.
    // select:false means queries do not return it unless asked.
    password: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
