const express = require('express');
const cors = require('cors');
app.use(cors({
  origin: "neu-hall-events-system.vercel.app", // Your Vercel URL
  credentials: true
}));
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

const createDefaultAdmin = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@neu.edu.ph').trim().toLowerCase();

    if (!process.env.ADMIN_PASSWORD) {
      throw new Error('ADMIN_PASSWORD env variable is required');
    }
    const adminPassword = process.env.ADMIN_PASSWORD;

    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log(`Admin user exists: ${adminEmail}`);
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await User.create({
      fullName: 'NEU Administrator',
      email: adminEmail,
      passwordHash,
      role: 'Admin',
      organization: '',
    });

    console.log(`Created default admin: ${adminEmail}`);
  } catch (err) {
    console.error('Failed to create default admin:', err.message);
  }
};

const app = express();

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Middleware
app.use(express.json());

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

// Test route
app.get('/', (req, res) => {
  res.send('NEU Hall Events API Running');
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler — must be last
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

// Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await createDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();