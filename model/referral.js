const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const referralSchema = new Schema({
  affiliateEmail: {
    type: String,
    required: [true, "Enter affiliate Email"],
  },
  affiliateId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  }, 
  userEmail: {
    type: String,
    required: [true, "Enter owner email"]
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  }
}, {
    timestamps: true,
    get: (time) => time.toDateString(),
  });



const referral = mongoose.model("Referral", referralSchema);
module.exports = referral;
