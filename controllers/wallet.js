const Wallet = require("../model/wallet");
const mongoose = require("mongoose");
const { createTransaction } = require("./transactions");
//user
exports.getUserWallet = async (req, res, next) => {
   const id = req.user._id;

   try {
      const wallet = await Wallet.findOne({owner: id});

      if (!wallet) {
        return res.status(200).json({message: "$0.00", wallet: null});
      }

      const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(parseFloat(wallet.currencyAmount) || 0);

      return res.status(200).json({
        message: formattedAmount,
        wallet: {
          _id: wallet._id,
          currencyType: wallet.currencyType,
          currencyAmount: wallet.currencyAmount,
          formattedAmount: formattedAmount,
        }
      });
   } catch (error) {
    console.log(error);
    return res.status(500).json({message: "$0.00", error: error.message});
   }
}

//admin - view another user's wallet
exports.getAdminUserWallet = async (req, res) => {
  if (!req.user?.isAdmin) return res.status(403).json({ message: "Access Denied: Admin required" });
  const { userId } = req.params;
  try {
    const wallet = await Wallet.findOne({ owner: userId });
    if (!wallet) return res.status(200).json({ message: "$0.00", wallet: null });
    const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(wallet.currencyAmount) || 0);
    return res.status(200).json({ message: formattedAmount, wallet: { _id: wallet._id, currencyType: wallet.currencyType, currencyAmount: wallet.currencyAmount, formattedAmount } });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching wallet" });
  }
};

exports.getAllWallets = async (req, res) => {
  if (!req.user?.isAdmin) return res.status(403).json({ message: "Access Denied: Admin required" });
  try {
    const wallets = await Wallet.find().populate('owner', 'firstName lastName email');
    return res.status(200).json({ wallets });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching wallets" });
  }
};

//admin
exports.walletOperation = async ({ owner: userId }, operator, amount, session = null) => {
    let findWallet = await Wallet.findOne({ owner: userId }).session(session);

    if (!findWallet) {
      const newWallet = new Wallet({ owner: userId, currencyAmount: 0, currencyType: "USD" });
      findWallet = await newWallet.save({ session });
    }

    const walletAmountToNumber = parseFloat(findWallet.currencyAmount) || 0;
    const amountToNumber = parseFloat(amount) || 0;

    switch (operator) {
      case '+': {
        const newAmount = parseFloat((walletAmountToNumber + amountToNumber).toFixed(2));
        const updated = await Wallet.findOneAndUpdate(
            { owner: userId },
            { currencyAmount: newAmount },
            { new: true, session }
          );
        return updated;
      }

      case '-': {
        if (walletAmountToNumber < amountToNumber) {
          throw new Error('Insufficient fund!');
        }
        const newAmount = parseFloat((walletAmountToNumber - amountToNumber).toFixed(2));
        const updated = await Wallet.findOneAndUpdate(
            { owner: userId },
            { currencyAmount: newAmount },
            { new: true, session }
          );
        return updated;
      }

      default:
        throw new Error(`Unsupported wallet operator: ${operator}`);
    }
}

exports.adminTopUpWallet = async (req, res) => {
  if (!req.user?.isAdmin) return res.status(403).json({ message: "Access Denied: Admin required" });
  
  const { userId } = req.params;
  const { amount, description = "Admin Manual Wallet Top-Up" } = req.body;
  const amountToNumber = parseFloat(amount);

  if (isNaN(amountToNumber) || amountToNumber <= 0) {
    return res.status(400).json({ message: "Please provide a valid positive amount." });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1. Add funds to wallet
    const updatedWallet = await exports.walletOperation({ owner: userId }, '+', amountToNumber, session);

    // 2. Log transaction
    await createTransaction(amountToNumber, description, "admin", userId, session);

    await session.commitTransaction();

    const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(updatedWallet.currencyAmount);
    
    res.status(200).json({ 
      message: `Successfully added $${amountToNumber} to user wallet.`,
      newBalance: formattedAmount
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("Top up error:", error);
    res.status(500).json({ message: error.message || "Failed to top up wallet." });
  } finally {
    session.endSession();
  }
};
