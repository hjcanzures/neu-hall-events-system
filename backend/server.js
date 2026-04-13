const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

const createDefaultAdmin = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@neu.edu.ph').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234';

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

  console.log(`Created default admin user: ${adminEmail}`);
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
};

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const hallRoutes = require("./routes/hallRoutes");
const approvalRoutes = require("./routes/approvalRoutes");
const eventRoutes = require("./routes/eventRoutes");

// Route Middleware
app.use("/api/auth", authRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/halls", hallRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/events", eventRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("NEU Hall Events API Running");
});

// Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await createDefaultAdmin();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();