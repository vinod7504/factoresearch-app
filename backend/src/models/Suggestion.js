const mongoose = require("mongoose");

const suggestionSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true
    },
    recommendation: {
      type: String,
      enum: ["BUY", "HOLD", "SELL"],
      default: "BUY"
    },
    note: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200
    },
    targetPrice: {
      type: Number,
      default: null
    },
    stopLoss: {
      type: Number,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Suggestion", suggestionSchema);
