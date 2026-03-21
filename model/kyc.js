const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const kycSchema = new Schema({
  ownerName: {
    type: String,
    required: [true, "Enter a valid kyc level"],
  },
 portrait: {
    type: String,
    required: true,
  }, 
 identityCard: {
    type: String,
    required: true,
  }, 
 utilityBill: {
    type: String,
    required: true,
  }, 
  status: {
    type: Boolean,
    required: true,
  }, 
}, {
    timestamps: true,
    get: (time) => time.toDateString(),
  });



const kyc = mongoose.model("kyc", kycSchema);
module.exports = kyc;
