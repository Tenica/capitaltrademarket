const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const Schema = mongoose.Schema;

const pendingConfirmationSchema = new Schema(
  {
    
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invoice",
      },
      withdrawals: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Withdrawals",
      },
      status: {
         type: Boolean,
         
      }
  },
  
  {
    timestamps: true,
    get: (time) => time.toDateString(),
  }
);

const pendingConfirmation = mongoose.model(
  "pendingConfirmation",
  pendingConfirmationSchema
);
module.exports = pendingConfirmation;
