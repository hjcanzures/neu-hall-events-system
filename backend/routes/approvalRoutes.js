const express = require("express");
const router = express.Router();

// Approve reservation
router.put("/:id/approve", (req, res) => {
  res.json({ message: "Reservation approved" });
});

// Reject reservation
router.put("/:id/reject", (req, res) => {
  res.json({ message: "Reservation rejected" });
});

module.exports = router;