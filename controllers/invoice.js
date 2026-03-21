const mongoose = require("mongoose");
const User = require("../model/user");
const Invoice = require("../model/invoice");
const pendingConfirmation = require("../model/pending-confirmation.js");
const Referral = require("../model/referral.js");
const Transactions = require("../model/transactions.js");
const Wallet = require("../model/wallet");
const Plan = require("../model/plan.js")
const isAuth = require("../middleware/is-auth");
const {
  generateRandomInvoiceNumber, convertISODate
} = require("../util/helper-functions");
const { checkPlan } = require("./plan.js");
const { walletOperation } = require("./wallet.js");
const { createTransaction } = require("./transactions.js");
const { addReferral } = require("./affiliate.js");
const { createInvestment } = require("./investments.js");





//user
exports.createInvoice = async (req, res, next) => {
  const userId = req.user?._id;
  const email = req.user?.email;
  const { amount, cryptoAmount, systemAddress, transactionId} = req.body;
  console.log(amount, "amount")
  const getPlanId = await checkPlan(+amount)

  const invoice = new Invoice({
    invoiceNumber: generateRandomInvoiceNumber(),
    amount: amount,
    cryptoAmount: cryptoAmount,
    systemAddress: systemAddress,
    transactionId: transactionId,
    status: false,
    user: userId,
    plan: getPlanId,
  });
  try {
    const checkUser = await User.findOne({ _id: userId });
    if (checkUser === null) {
      return res.status(401).json({
        message: "User doesn't exist",
      });
    }

  


    const saveInvoice = await invoice.save();
    console.log(saveInvoice, "saveInvoice")
    if (saveInvoice) {
      const pendingTransaction = new pendingConfirmation({
        invoice: saveInvoice._id,
        status: false,
      });
      const savePendingConfirmation = await pendingTransaction.save();
      console.log(savePendingConfirmation, "savePendingConfirmation")
      res
        .status(200)
        .json({
          message: `Dear ${checkUser.firstName}, your payment has been sent for confirmation.`,
        });
    }
  } catch (error) {
    console.log(error);
  }
};



//admin


//admin
exports.cancelSingleInvoice = async (req, res, next) => {
const adminAccess = req.user.isAdmin;
const pendingConfirmationId = req.params.id;
const filter = {_id: pendingConfirmationId};
const update = {status: true};
try {
  if (adminAccess) {
    const updatePendingConfirmation = await pendingConfirmation.findOneAndUpdate(filter, update, {
      new: true,
    });

    if (updatePendingConfirmation !== null) {

      const {invoice} = updatePendingConfirmation;
      const filter = {_id: invoice};
      const updates = {
        $set: {
          cancelled: true,
          status: true
        
        }
      };

      const cancelPendingInvoice = await Invoice.findOneAndUpdate(filter, updates, {
        new: true
      })
      console.log(cancelPendingInvoice, "cancelblablaba")
      if (cancelPendingInvoice !== null) {
        res.status(201).json({message: 'Cancelled!'})
      }
    }
  } else {
    res.status(401).json({message: 'Unauthorized User'})
  }
} catch (error) {
    res.status(400).json({message: error})
}
}







//admin defunct
exports.viewAllInvoice = async (req, res, next) => {
  const adminAccess = req.user.isAdmin;

  try {
    if (adminAccess) {
      const getAllPendingConfirmation = await Invoice.find().populate("user");

      if (getAllPendingConfirmation) {
        const result = getAllPendingConfirmation;
        res
          .status(200)
          .json({
            message: result.filter(
              (res) => res.cancelled !== true && res.status === false
            ),
          });
      } else if (getAllPendingConfirmation === null) {
        return res
          .status(201)
          .json({ message: "No pending Confirmation yet!" });
      }
    } else {
      res.status(401).json({ message: "Unauthorized Access" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "An error occurred!" });
  }
};

//admin defunct
exports.viewSingleInvoice = async (req, res, next) => {
  const adminAccess = req.user.isAdmin;
  const id = req.params.id;

  try {
    if (adminAccess) {
      const getSingleInvoice = await Invoice.find({ _id: id }).populate("user");
      if (getSingleInvoice[0]?._id.toString() === id) {
        return res
          .status(200)
          .json({
            message: getSingleInvoice.filter(
              (res) => res.cancelled !== true && res.status === false
            ),
          });
      } else {
        return res.status(404).json({ message: "No Invoice!" });
      }
    } else {
      res.status(401).json({ message: "Unauthorized Access" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "An error occurred!" });
  }
};




