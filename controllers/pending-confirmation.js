const pendingConfirmation = require('../model/pending-confirmation.js');
const Invoice = require('../model/invoice.js')
const mongoose = require("mongoose");
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

exports.viewAllPendingCreditConfirmation = async (req, res, next) => {
  const adminAccess = req.user?.isAdmin;

  try {
    if (adminAccess) {
      const getAllPendingConfirmation = await pendingConfirmation
        .find()
        .populate({
          path: "invoice",
          populate: [{ path: "plan" }, { path: "user" }],
        });

      // Filter for records with a valid invoice and status: false (not yet approved)
      const filterPendingConfirmation = getAllPendingConfirmation.filter(
        (p) => p.invoice && p.status === false
      );

      console.log(`[Admin] Found ${filterPendingConfirmation.length} pending credits`);

      if (filterPendingConfirmation.length > 0) {
        return res.status(200).json({ message: filterPendingConfirmation });
      } else {
        return res.status(200).json({ message: "No pending Invoice yet!", pendingConfirmations: [] });
      }
    } else {
      return res.status(403).json({ message: "Forbidden: Admin access only" });
    }
  } catch (error) {
    console.error("Error in viewAllPendingCreditConfirmation:", error);
    return res.status(500).json({ message: "An error occurred while fetching pending confirmations." });
  }
};

exports.viewAllPendingWithdrawalConfirmation = async (req, res, next) => {
    const adminAccess = req.user.isAdmin;
  
    try {
     if(adminAccess) {
         const getAllPendingConfirmation = await pendingConfirmation.find().populate('withdrawals')
         const filterPendingConfirmation = getAllPendingConfirmation.filter((p) => p.withdrawals && p.status === false);
         const response = filterPendingConfirmation.length > 0 ?  res.status(200).json({message: filterPendingConfirmation}) : res.status(201).json({message: "No withdrawals yet!"})
            
     }
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: "An error occurred!"})
    }
 }



exports.viewSinglePendingConfirmation = async (req, res, next) => {
    const adminAccess = req.user.isAdmin;
    const id = req.params.id;
    const filter = { $or: [{invoice: id}, {withdrawals: id}] }

    try {
     if(adminAccess) {
         const getSinglePendingConfirmation = await pendingConfirmation.find(filter).populate({path: 'invoice', populate: [{path: 'user'}, {path: 'plan'}]}).populate('withdrawals');
        const response = getSinglePendingConfirmation[0].status === false ? res.status(200).json({message: getSinglePendingConfirmation}) : res.status(201).json({message: "No pending Confirmation yet!"})
       
     }
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: "An error occurred!"})
    }
 }



 //User 

 exports.viewAllUserPendingCreditConfirmation = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const invoices = await Invoice.find({ user: userId });
    const invoiceIds = invoices.map(inv => inv._id);

    const pending = await pendingConfirmation
      .find({ invoice: { $in: invoiceIds }, status: false })
      .populate("invoice");
      console.log("pending", pending)
    if (pending.length === 0) {
      return res.status(200).json({ message: "No pending Invoice yet!" });
    }

    return res.status(200).json({ message: pending });
     
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred!" });
  }

};

 
 exports.viewAllUserPendingWithdrawalConfirmation = async (req, res, next) => {
     const id = req.user.id;
     const withdrawalsId = req.params.id;
     const filter = {withdrawals: withdrawalsId};
     try {
      if(id) {
          const getAllPendingConfirmation = await pendingConfirmation.find(filter).populate('withdrawals')
          const filterPendingConfirmation = getAllPendingConfirmation.filter((p) => p.withdrawals  && p.status === false);
          const response = filterPendingConfirmation.length > 0 ?  res.status(200).json({message: filterPendingConfirmation}) : res.status(201).json({message: "No withdrawals yet!"})
             
      }
     } catch (error) {
         console.log(error)
         return res.status(500).json({message: "An error occurred!"})
     }
  }




exports.confirmSinglePendingConfirmation = async (req, res) => {
  if (!req.user?.isAdmin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const invoiceId = req.params.id;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 1. Find pending confirmation
    const pending = await pendingConfirmation.findOne(
      { invoice: invoiceId },
      null,
      { session }
    );

    if (!pending) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Pending confirmation not found" });
    }
  
    if (pending.status === true) {
      await session.abortTransaction();
      return res.status(403).json({ message: "Invoice already approved" });
    }

    // 2. Approve pending confirmation
    pending.status = true;
    await pending.save({ session });

    // 3. Update invoice and populate relations (ONE query)
    const invoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      { status: true },
      { new: true, session }
    )
      .populate("user")
      .populate("plan");

    if (!invoice) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Invoice not found" });
    }

    const {
      amount,
      description = "Active Investment",
      type,
      user,
      plan,
    } = invoice;

    console.log("invoice1", invoice)

    // 4. Credit wallet
    const walletUpdated = await walletOperation(
      { owner: user._id },
      "+",
      amount,
      session
    );

    console.log("walletUpdated", walletUpdated)

    if (!walletUpdated) {
      throw new Error("Wallet update failed");
    }

    // 5. Referral bonus (optional)
    const referralBonus = await addReferral(
      user.email,
      user._id,
      amount,
      session
    );

    if (referralBonus) {
      await createTransaction(
        referralBonus.amount,
        "Referral Bonus Added",
        "user",
        referralBonus.user,
        session
      );
    }

    // 6. Create investment
    await createInvestment(
      pending._id,
      pending.updatedAt,
      plan.endDate,
      session
    );

    // 7. Main transaction record
    await createTransaction(
      amount,
      description,
      type,
      user._id,
      session
    );

    await session.commitTransaction();

    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

    res.status(200).json({
      message: `Credit of ${formattedAmount} for ${user.firstName} successful.`,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).json({ message: "Invoice confirmation failed" });
  } finally {
    session.endSession();
  }
};
