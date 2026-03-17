const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});