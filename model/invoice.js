const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const Schema = mongoose.Schema;

const invoiceSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      validate(value) {
        if (!validator.isNumeric(value)) {
          throw new Error("Enter a valid amount");
        }
      }
    },
    amount: {
        type: String,
        required: true,
      validate(value) {
        if (!validator.isNumeric(value)) {
          throw new Error("Enter a valid amount");
        }
      },
      },
    cryptoAmount: {
      type: String,
      required: true,
      validate(value) {
        if (!validator.isNumeric(value)) {
          throw new Error("Enter a valid crypto amount");
        }
      }
    },
    systemAddress: {
      type: String,
      required: [true, "system Address must not be empty"],
    },
    transactionId : {
        type: String,
        required: [true, "TransactionId must not be empty"]
    },
    status: {
        type: Boolean,
        default: false
    },
    cancelled: {
        type: Boolean,
        default: false
    },
    type: {
       type: String,
       default: "user"
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Plan",
    },
  },

  {
    timestamps: true,
    get: (time) => time.toDateString(),
  }
);

const invoice = mongoose.model("Invoice", invoiceSchema);
module.exports = invoice;


