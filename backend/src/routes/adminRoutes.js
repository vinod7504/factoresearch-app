const express = require("express");
const {
  getAdminSuggestions,
  createSuggestion,
  updateSuggestion,
  deleteSuggestion
} = require("../controllers/suggestionController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

const router = express.Router();

router.get("/suggestions", auth, adminOnly, getAdminSuggestions);
router.post("/suggestions", auth, adminOnly, createSuggestion);
router.patch("/suggestions/:id", auth, adminOnly, updateSuggestion);
router.delete("/suggestions/:id", auth, adminOnly, deleteSuggestion);

module.exports = router;
