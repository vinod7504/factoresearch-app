const express = require("express");
const {
  getDashboard,
  getNews,
  getQuote,
  getChart,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist
} = require("../controllers/marketController");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/dashboard", auth, getDashboard);
router.get("/news", auth, getNews);
router.get("/watchlist", auth, getWatchlist);
router.post("/watchlist", auth, addToWatchlist);
router.delete("/watchlist/:symbol", auth, removeFromWatchlist);
router.get("/quote/:symbol", auth, getQuote);
router.get("/chart/:symbol", auth, getChart);

module.exports = router;
