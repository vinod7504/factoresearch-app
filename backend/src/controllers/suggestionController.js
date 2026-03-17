const Suggestion = require("../models/Suggestion");

const normalizeSymbol = (symbol) => String(symbol || "").trim().toUpperCase();

const formatSuggestion = (item) => ({
  id: item._id,
  symbol: item.symbol,
  recommendation: item.recommendation,
  note: item.note,
  targetPrice: item.targetPrice,
  stopLoss: item.stopLoss,
  active: item.active,
  createdBy: item.createdBy?.email || item.createdBy?._id,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt
});

const getSuggestions = async (_req, res) => {
  try {
    const items = await Suggestion.find({ active: true })
      .populate("createdBy", "email")
      .sort({ createdAt: -1 })
      .limit(30);

    return res.json({
      suggestions: items.map(formatSuggestion)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch suggestions" });
  }
};

const getAdminSuggestions = async (_req, res) => {
  try {
    const items = await Suggestion.find({})
      .populate("createdBy", "email")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      suggestions: items.map(formatSuggestion)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch admin suggestions" });
  }
};

const createSuggestion = async (req, res) => {
  try {
    const symbol = normalizeSymbol(req.body.symbol);
    const recommendation = String(req.body.recommendation || "BUY").trim().toUpperCase();
    const note = String(req.body.note || "").trim();
    const targetPrice = req.body.targetPrice !== undefined && req.body.targetPrice !== "" ? Number(req.body.targetPrice) : null;
    const stopLoss = req.body.stopLoss !== undefined && req.body.stopLoss !== "" ? Number(req.body.stopLoss) : null;

    if (!symbol) {
      return res.status(400).json({ message: "symbol is required" });
    }

    if (!note) {
      return res.status(400).json({ message: "note is required" });
    }

    if (!["BUY", "HOLD", "SELL"].includes(recommendation)) {
      return res.status(400).json({ message: "recommendation must be BUY, HOLD, or SELL" });
    }

    const item = await Suggestion.create({
      symbol,
      recommendation,
      note,
      targetPrice: Number.isNaN(targetPrice) ? null : targetPrice,
      stopLoss: Number.isNaN(stopLoss) ? null : stopLoss,
      createdBy: req.user.id,
      active: true
    });

    const populated = await Suggestion.findById(item._id).populate("createdBy", "email");

    return res.status(201).json({
      message: "Suggestion added",
      suggestion: formatSuggestion(populated)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to add suggestion" });
  }
};

const updateSuggestion = async (req, res) => {
  try {
    const id = req.params.id;
    const payload = {};

    if (req.body.symbol !== undefined) {
      const symbol = normalizeSymbol(req.body.symbol);
      if (!symbol) {
        return res.status(400).json({ message: "symbol cannot be empty" });
      }
      payload.symbol = symbol;
    }

    if (req.body.note !== undefined) {
      const note = String(req.body.note).trim();
      if (!note) {
        return res.status(400).json({ message: "note cannot be empty" });
      }
      payload.note = note;
    }

    if (req.body.recommendation !== undefined) {
      const recommendation = String(req.body.recommendation).trim().toUpperCase();
      if (!["BUY", "HOLD", "SELL"].includes(recommendation)) {
        return res.status(400).json({ message: "recommendation must be BUY, HOLD, or SELL" });
      }
      payload.recommendation = recommendation;
    }

    if (req.body.targetPrice !== undefined) {
      if (req.body.targetPrice === "" || req.body.targetPrice === null) {
        payload.targetPrice = null;
      } else {
        const value = Number(req.body.targetPrice);
        payload.targetPrice = Number.isNaN(value) ? null : value;
      }
    }

    if (req.body.stopLoss !== undefined) {
      if (req.body.stopLoss === "" || req.body.stopLoss === null) {
        payload.stopLoss = null;
      } else {
        const value = Number(req.body.stopLoss);
        payload.stopLoss = Number.isNaN(value) ? null : value;
      }
    }

    if (req.body.active !== undefined) {
      payload.active = Boolean(req.body.active);
    }

    const updated = await Suggestion.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true
    }).populate("createdBy", "email");

    if (!updated) {
      return res.status(404).json({ message: "Suggestion not found" });
    }

    return res.json({
      message: "Suggestion updated",
      suggestion: formatSuggestion(updated)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to update suggestion" });
  }
};

const deleteSuggestion = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Suggestion.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Suggestion not found" });
    }

    return res.json({ message: "Suggestion deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to delete suggestion" });
  }
};

module.exports = {
  getSuggestions,
  getAdminSuggestions,
  createSuggestion,
  updateSuggestion,
  deleteSuggestion
};
