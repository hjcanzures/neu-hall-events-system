const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

const app = express();

// CORS Configuration — must be before express.json()
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://neu-hall-events-system.vercel.app',
  'https://neu-hall-events-system-57ui2bs3l-jedh-anzures-projects.vercel.app',
  'https://neuhall-events.vercel.app',
  'neu-hall-events-management-system-98ynuoyze.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn("Blocked by CORS Policy:", origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}));

// Handle preflight requests for all routes
app.options('/{*path}', cors());

// Body parser — after CORS
app.use(express.json());

let adminEnsured = false;

const createDefaultAdmin = async () => {
  if (adminEnsured) return; // only do this once per warm instance
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@neu-hall.edu.ph').trim().toLowerCase();

    if (!process.env.ADMIN_PASSWORD) {
      console.warn('Warning: ADMIN_PASSWORD env variable is not set. Admin creation skipped.');
      adminEnsured = true;
      return;
    }
    const adminPassword = process.env.ADMIN_PASSWORD;

    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log(`Admin user exists: ${adminEmail}`);
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await User.create({
        fullName: 'NEU Administrator',
        email: adminEmail,
        passwordHash,
        role: 'Admin',
        organization: '',
      });
      console.log(`Created default admin: ${adminEmail}`);
    }
    adminEnsured = true;
  } catch (err) {
    console.error('Failed to create default admin:', err.message);
  }
};

// Make sure the DB is connected (and the default admin exists) before any
// route runs. connectDB() and createDefaultAdmin() are both cached, so this
// is cheap on every request after the first on a given warm instance.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    await createDefaultAdmin();
    next();
  } catch (err) {
    next(err);
  }
});

// Routes
const authRoutes = require('./routes/authRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const hallRoutes = require('./routes/hallRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const eventRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoutes');
const studentRoutes = require('./routes/studentRoutes');

// Route Middleware
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/halls', hallRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);

app.get('/', (req, res) => {
  res.send('NEU Hall Events API Running');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;