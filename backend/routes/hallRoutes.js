const express = require("express");
const router = express.Router();

// View halls
router.get("/", (req, res) => {
  res.json({ message: "Get halls" });
});

// Create hall
router.post("/", (req, res) => {
  res.json({ message: "Create hall" });
});

module.exports = router;