const mongoose = require("mongoose");
const User = require("../model/user");
const pendingConfirmation = require("../model/pending-confirmation.js");
const Wallet = require("../model/wallet");
const Withdrawal = require("../model/withdrawals");
const { createTransaction } = require("./transactions.js");
const { walletOperation } = require("./wallet.js");

//user
exports.createWithdrawalRequest = async (req, res, next) => {
  const userId = req.user?._id;
  const { amount, cryptoAmount, sentAmount, transactionId, networkFee } = req.body;
  
  const getWalletId = await Wallet.findOne({ owner: userId });

  if (getWalletId === null) {
    return res.status(404).json({ message: "Wallet not found!" });
  }

  if (Number(getWalletId.currencyAmount) && amount <= 0) {
    return res.status(400).json({ message: `Kindly enter a valid amount, greater than ${amount}.` });
  }

  if (Number(getWalletId.currencyAmount) < amount) {
    return res.status(400).json({ message: `${amount} is greater than your current wallet balance of ${getWalletId.currencyAmount}` });
  }

  const checkUser = await User.findOne({ _id: userId });
  if (checkUser === null) {
    return res.status(404).json({ message: "User doesn't exist" });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 1. Deduct from wallet immediately
    await walletOperation({ owner: userId }, '-', amount, session);

    // 2. Create the withdrawal request
    const withdrawal = new Withdrawal({
      amount: amount,
      cryptoAmount: cryptoAmount,
      sentAmount: sentAmount,
      transactionId: transactionId,
      networkFee: networkFee,
      walletId: getWalletId._id
    });

    const saveWithdrawal = await withdrawal.save({ session });

    // 3. Create the pending confirmation for admins to review
    if (saveWithdrawal) {
      const pendingTransaction = new pendingConfirmation({
        withdrawals: saveWithdrawal._id,
        status: false,
      });
      await pendingTransaction.save({ session });
    }

    await session.commitTransaction();

    res.status(200).json({
      message: `Dear ${checkUser.firstName}, your withdrawal request has been sent for confirmation.`,
    });
  } catch (error) {
    await session.abortTransaction();
    console.log(error);
    res.status(500).json({ message: "Error processing withdrawal request." });
  } finally {
    session.endSession();
  }
};


exports.viewAllWithdrawalRequest = async (req, res, next) => {
  const adminAccess = req.user.isAdmin;

  try {
    if (adminAccess) {
      const getAllWithdrawalRequest = await Withdrawal.find().populate("walletId");

      if (getAllWithdrawalRequest) {
        const result = getAllWithdrawalRequest;
        const filterRequest = result.filter(
          (res) => res.cancelled !== true && res.paid === false
        );
        res.status(200).json({
          message: filterRequest.length <= 0 ? "No withdrawal requests made yet!" : filterRequest
        });
      }
    } else {
      res.status(401).json({ message: "Unauthorized Access" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "An error occurred!" });
  }
};

exports.viewSingleWithdrawalRequest = async (req, res, next) => {
  const adminAccess = req.user.isAdmin;
  const id = req.params.id;

  try {
    if (adminAccess) {
      const getSingleWithdrawalRequest = await Withdrawal.find({ _id: id }).populate("walletId");

      const filterSingleWithdrawalRequest = getSingleWithdrawalRequest.filter(
        (res) => res.cancelled !== true && res.paid === false
      );
      const response = filterSingleWithdrawalRequest.length > 0 ? res.status(200).json({ message: filterSingleWithdrawalRequest }) : res.status(404).json({ message: "No Request!" });

    } else {
      res.status(401).json({ message: "Unauthorized Access" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "An error occurred!" });
  }
};

exports.confirmWithdrawalRequest = async (req, res, next) => {
  const adminAccess = req.user.isAdmin;
  const id = req.params.id;
  const filter = { withdrawals: id };
  const update = { status: true };
  const updatePaid = { paid: true };

  try {
    if (adminAccess) {
      const checkStatus = await pendingConfirmation.findOne(filter);
      
      if (!checkStatus) {
        return res.status(404).json({ message: "Not found" });
      }

      if (checkStatus.status !== false) {
        return res.status(403).json({ message: "Already Approved or Handled!" });
      }

      // We do not need a transaction session here as strongly since the wallet was already deducted,
      // but it's best practice. For simplicity, we just mark as paid and create a transaction.
      const getSinglePendingConfirmation = await pendingConfirmation.findOneAndUpdate(filter, update, { new: true });

      if (getSinglePendingConfirmation !== null) {
        const updateWithdrawalStatus = await Withdrawal.findOneAndUpdate(
          { _id: id },
          updatePaid,
          { new: true }
        );

        const { amount, walletId } = updateWithdrawalStatus;
        const description = "Withdrawal";
        const type = 'admin';

        if (updateWithdrawalStatus) {
          const findWallet = await Wallet.findOne({ _id: walletId }).populate("owner");
          const userId = findWallet.owner._id;
          const numberFormat = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(amount);

          if (findWallet) {
            // Note: We NO LONGER deduct the wallet here because it was already deducted in createWithdrawalRequest!
            // We just create the receipt / transaction record
            const updateTransaction = await createTransaction(amount, description, type, userId);
            res.status(200).json({ message: `Withdrawal of ${numberFormat} has been confirmed and paid.` });
          }
        }
      } else {
        res.status(400).json({ message: "Bad Request!" });
      }
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error" });
    console.log(error);
  }
};

exports.declineWithdrawalRequest = async (req, res) => {
  if (!req.user?.isAdmin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const id = req.params.id; // Withdrawal ID
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    
    // 1. Find Pending Confirmation
    const pending = await pendingConfirmation.findOne({ withdrawals: id }).session(session);
    if (!pending) {
      throw new Error("Withdrawal request not found");
    }

    if (pending.status === true) {
      throw new Error("Withdrawal already handled");
    }

    // 2. Mark handled
    pending.status = true; 
    await pending.save({ session });

    // 3. Mark withdrawal as cancelled
    const withdrawal = await Withdrawal.findByIdAndUpdate(id, { cancelled: true }, { new: true, session });
    
    // 4. Refund the wallet
    const findWallet = await Wallet.findById(withdrawal.walletId).session(session);
    await walletOperation({ owner: findWallet.owner }, '+', withdrawal.amount, session);

    await session.commitTransaction();
    res.status(200).json({ message: "Withdrawal request declined. Funds returned to user wallet." });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).json({ message: error.message || "Decline failed" });
  } finally {
    session.endSession();
  }
};