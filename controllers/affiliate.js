const Plan = require("../model/plan");
const Referral = require("../model/referral");
const Wallet = require("../model/wallet");
const { checkPlan } = require("./plan");
const { walletOperation } = require("./wallet");

exports.addReferral = async (email, userId, amount, session = null) => {
  const referral = await Referral.findOne({ userEmail: email }).session(session);

  const id = userId;

  if (referral !== null) {
    const getUserAffiliate = referral.affiliateId;

    const filter = { owner: getUserAffiliate };

    const getAffiliateWallet = await Wallet.findOne(filter).session(session);
    const checkPlanId = await checkPlan(amount);
    console.log(checkPlanId, "CheckPlan Id");
    const getPlanId = await Plan.findOne({ _id: checkPlanId }).session(session);
    const referralBonus = getPlanId.referralBonus;

    const convertReferralBonus = parseInt(referralBonus);
    const convertAmount = parseInt(amount);
    const getPercentage = convertReferralBonus / 100;
    const getResult = convertAmount * getPercentage;
    const convertResultToString = getResult.toString();

    const update = { currencyAmount: convertResultToString };
    const addAffiliateWallet = await walletOperation(
      { owner: getUserAffiliate },
      "+",
      convertResultToString,
      session
    );

    const result = {
      amount: convertResultToString,
      user: addAffiliateWallet.owner,
      description: "Referral Bonus Added",
      type: "user",
    };

    return result;
  }
};
