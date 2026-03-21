const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const systemWalletSchema = new Schema({
  label: {
    type: String,
    required: [true, "Enter a label e.g. 'Main BTC Wallet'"],
    trim: true,
  },
  currency: {
    type: String,
    required: [true, "Enter a currency type"],
    enum: ["BTC", "ETH", "USDT", "USDC", "BNB"],
    uppercase: true,
    trim: true,
  },
  address: {
    type: String,
    required: [true, "Enter a valid wallet address"],
    trim: true,
  },
  network: {
    type: String,
    trim: true, // e.g. "ERC-20", "TRC-20", "BEP-20"
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

const SystemWallet = mongoose.model("SystemWallet", systemWalletSchema);
module.exports = SystemWallet;
