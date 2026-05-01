const User = require('../models/User');

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ fullName: 1 });
    return res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Unable to load users.' });
  }
};

const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'Student' }).select('-passwordHash').sort({ fullName: 1 });
    return res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    return res.status(500).json({ error: 'Unable to load student users.' });
  }
};

module.exports = {
  getUsers,
  getStudents,
};