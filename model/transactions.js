const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const Schema = mongoose.Schema;

const transactionsSchema = new Schema(
  {
    amount: {
      type: String,
      required: [true, " Amount must not be empty"],
    },
    description: {
      type: String,
      required: [true, "Description must not be empty"],
    },
    type: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },

  {
    timestamps: true,
    get: (time) => time.toDateString(),
  }
);

const transactions = mongoose.model("transactions", transactionsSchema);
module.exports = transactions;
