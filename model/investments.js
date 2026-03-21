const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const investmentsSchema = new Schema(
  {
    currentPercentage: {
      type: Number,
      default: 0
    },

    previousPercentage: {
      type: Number,
      default: 0
    },

    profitTrend: {
      type: String,
      enum: ["flat", "loss", "gain"],
      default: "flat"
    },

    totalProfit: {
      type: Number,
      default: 0
    },

    nextPayDate: {
      type: Date,
      required: true
    },

    investmentEndDate: {
      type: Date,
      required: true
    },

    received: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ["pending", "active", "completed"],
      default: "pending"
    },

    investmentDate: {
      type: Date,
      default: Date.now
    },

    completed: {
      type: Boolean,
      default: false
    },

    lastProcessedDate: {
      type: Date
    },

    pendingConfirmation: {
      type: Schema.Types.ObjectId,
      ref: "pendingConfirmation",
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Investments", investmentsSchema);
