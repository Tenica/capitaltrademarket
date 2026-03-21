const mongoose = require("mongoose");
const validator = require("validator");
const Schema = mongoose.Schema;

const withdrawalsSchema = new Schema({
  amount: {
    type: String,
    required: true,
    validate(value) {
      if (!validator.isCurrency(value)) {
        throw new Error("Enter a valid currency");
      }
    },
  },
  paid: {
    type: Boolean,
    default: false,
  },
  cancelled: {
    type: Boolean,
  },
  transactionId: {
    type: String,
    required: true
  },
  cryptoAmount: {
    type: String,
    required: true
  },
  networkFee: {
    type: String,
    required: true
  },
  sentAmount: {
    type: String,
    required: true
  },
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Wallet",
  }
},  {
    timestamps: true,
    get: (time) => time.toDateString(),
  });

const Withdrawals = mongoose.model("Withdrawals", withdrawalsSchema);
module.exports = Withdrawals;
