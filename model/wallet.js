const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const Schema = mongoose.Schema;

const walletSchema = new Schema({
  currencyType: {
    type: String,
    required: [true, "Enter a valid currency type"],
  },
  currencyAmount: {
    type: Number,
    required: true,
    default: 0,
  }, 
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  }
}, {
    timestamps: true,
    get: (time) => time.toDateString(),
  });



const Wallet = mongoose.model("Wallet", walletSchema);
module.exports = Wallet;
