const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const Schema = mongoose.Schema;

const planSchema = new Schema({
  name: {
    type: String,
    required: [true, "Enter a valid plan name"],
  },
  minimum: {
    type: String,
    required: true,
  }, 
  maximum: {
    type: String,
    required: true,
  }, 
  dailyProfitMin: {
    type: String,
    required: true,
  }, 
  dailyProfitMax: {
    type: String,
    required: true,
  },
  referralBonus: {
    type: String,
    required: true,
  }, 
  endDate: {
    type: String
  },

}, {
    timestamps: true,
    get: (time) => time.toDateString(),
  });



const Plan = mongoose.model("Plan", planSchema);
module.exports = Plan;
