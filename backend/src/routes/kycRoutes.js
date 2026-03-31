const express = require("express");
const {
  getMyKyc,
  saveMyKyc,
  startMyKyc,
  submitMyKyc
} = require("../controllers/kycController");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/me", auth, getMyKyc);
router.put("/me", auth, saveMyKyc);
router.post("/start", auth, startMyKyc);
router.post("/submit", auth, submitMyKyc);

module.exports = router;
