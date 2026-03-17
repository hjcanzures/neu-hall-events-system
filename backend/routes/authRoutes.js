const express = require("express");
const router = express.Router();

// Register user
router.post("/register", (req, res) => {
  res.json({ message: "Register endpoint" });
});

// Login user
router.post("/login", (req, res) => {
  res.json({ message: "Login endpoint" });
});

module.exports = router;