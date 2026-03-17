const express = require("express");
const router = express.Router();

// Create event
router.post("/", (req, res) => {
  res.json({ message: "Create event" });
});

// Get events
router.get("/", (req, res) => {
  res.json({ message: "Get events" });
});

module.exports = router;