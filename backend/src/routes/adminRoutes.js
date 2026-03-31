const express = require("express");
const {
  getAdminSuggestions,
  createSuggestion,
  updateSuggestion,
  deleteSuggestion
} = require("../controllers/suggestionController");
const {
  getAdminKycSubmissions,
  reviewKycSubmission
} = require("../controllers/kycController");
const { broadcastNotification } = require("../controllers/notificationController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

const router = express.Router();

router.get("/suggestions", auth, adminOnly, getAdminSuggestions);
router.post("/suggestions", auth, adminOnly, createSuggestion);
router.patch("/suggestions/:id", auth, adminOnly, updateSuggestion);
router.delete("/suggestions/:id", auth, adminOnly, deleteSuggestion);
router.get("/kyc", auth, adminOnly, getAdminKycSubmissions);
router.patch("/kyc/:userId", auth, adminOnly, reviewKycSubmission);
router.post("/notifications/broadcast", auth, adminOnly, broadcastNotification);

module.exports = router;
