const express = require("express");
const { getSuggestions } = require("../controllers/suggestionController");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, getSuggestions);

module.exports = router;
