const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const JWT_EXPIRES_IN = '7d';

const inferProfileFromEmail = () => ({ role: 'Student', organization: '' });

const normalizeRole = (role) => (role === 'Student Org' ? 'Student' : role);

const serializeUser = (user) => {
  const role = normalizeRole(user.role);
  return {
    fullName: user.fullName,
    email: user.email,
    role,
    organization: role === 'Student' ? '' : user.organization,
  };
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

    const profile = inferProfileFromEmail();
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: profile.role,
      organization: profile.organization,
    });

    return res.status(201).json({ token: generateToken(user), user: serializeUser(user) });
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

    return res.json({ token: generateToken(user), user: serializeUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Unable to authenticate user.' });
  }
};

const getCurrentUser = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  return res.json({ user: serializeUser(req.user) });
};

module.exports = {
  register,
  login,
  getCurrentUser,
};
