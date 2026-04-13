const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const JWT_EXPIRES_IN = '7d';

const inferProfileFromEmail = (email) => {
  const normalized = (email || '').trim().toLowerCase();
  const localPart = normalized.split('@')[0] || '';

  if (localPart.includes('admin')) {
    return { role: 'Admin', organization: '' };
  }
  if (localPart.includes('staff')) {
    return { role: 'Staff', organization: '' };
  }
  if (localPart.includes('acss')) {
    return { role: 'Student Org', organization: 'ACSS' };
  }
  if (localPart.includes('paradigm')) {
    return { role: 'Student Org', organization: 'Paradigm' };
  }

  return { role: 'Student Org', organization: 'SITES' };
};

const generateToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const localPart = normalizedEmail.split('@')[0] || '';

    if (localPart.includes('admin')) {
      return res.status(400).json({ error: 'Admin accounts cannot be registered here.' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const profile = inferProfileFromEmail(normalizedEmail);
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: profile.role,
      organization: profile.organization,
    });

    const token = generateToken(user);

    return res.status(201).json({
      token,
      user: {
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        organization: user.organization,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Unable to register user.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        organization: user.organization,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Unable to authenticate user.' });
  }
};

const getCurrentUser = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  return res.json({
    user: {
      fullName: req.user.fullName,
      email: req.user.email,
      role: req.user.role,
      organization: req.user.organization,
    },
  });
};

module.exports = {
  register,
  login,
  getCurrentUser,
};
