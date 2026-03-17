const express = require("express");
const router = express.Router();

// Create reservation
router.post("/", (req, res) => {
  res.json({ message: "Create reservation" });
});

// View reservations
router.get("/", (req, res) => {
  res.json({ message: "Get reservations" });
});

// Cancel reservation
router.delete("/:id", (req, res) => {
  res.json({ message: "Delete reservation" });
});

module.exports = router;