const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Creates a signed token that contains the user's id
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    // Hash the password before saving (10 = salt rounds)
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed });

    res.status(201).json({
      token: signToken(user._id),
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // password is select:false, so ask for it explicitly
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    const ok = user && (await bcrypt.compare(password, user.password));

    // Same message for both cases so attackers can't guess which emails exist
    if (!ok) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      token: signToken(user._id),
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me  (protected) - handy to check that a token still works
exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: { id: user._id, email: user.email } });
  } catch (err) {
    next(err);
  }
};
