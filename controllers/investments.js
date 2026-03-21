const Investments = require("../model/investments");
const Invoice = require("../model/invoice");
const Wallet = require("../model/wallet");
const PendingConfirmation = require("../model/pending-confirmation");
const User = require("../model/user");
const Plan = require("../model/plan");
const mongoose = require("mongoose");
const { createTransaction } = require("./transactions");

const {
  extractNumber,
  todayPercentage,
} = require("../util/helper-functions");

exports.createInvestment = async (pId, getUpdatedTime, planEndDate, session = null) => {
  const getNumber = extractNumber(planEndDate);
  const investmentDate = new Date(getUpdatedTime);
  const pendingConfirmation = pId;
  const nextPayDate = new Date(investmentDate);
  nextPayDate.setHours(0, 0, 0, 0); // Start at midnight
  nextPayDate.setDate(nextPayDate.getDate() + 1); // For the next day
  const investmentEndDate = new Date(nextPayDate);
  investmentEndDate.setDate(investmentEndDate.getDate() + getNumber);

  const investment = new Investments({
    nextPayDate: nextPayDate,
    investmentDate: investmentDate,
    investmentEndDate: investmentEndDate,
    pendingConfirmation: pendingConfirmation,
    status: "active"
  });

  const saveInvestment = await investment.save({ session });

  return saveInvestment;
};

exports.viewAllInvestments = async (req, res) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Unauthorized Access" });
  }
  try {
    const investments = await Investments.find().populate({
      path: 'pendingConfirmation',
      populate: { path: 'invoice', populate: ['user', 'plan'] }
    });
    res.status(200).json({ message: investments });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching investments" });
  }
};

exports.viewUserInvestments = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Find all invoices for this user
    const userInvoices = await Invoice.find({ user: userId }).select('_id');
    const invoiceIds = userInvoices.map(inv => inv._id);

    // 2. Find all pending confirmations for those invoices
    const userPendingConfirmations = await PendingConfirmation.find({ 
      invoice: { $in: invoiceIds } 
    }).select('_id');
    const pcIds = userPendingConfirmations.map(pc => pc._id);

    // 3. Find investments for those pending confirmations (Database-level filtering)
    const userInvestments = await Investments.find({ 
      pendingConfirmation: { $in: pcIds } 
    }).populate({
      path: 'pendingConfirmation',
      populate: { path: 'invoice', populate: ['user', 'plan'] }
    });

    const totalProfit = userInvestments.reduce((sum, inv) => sum + (inv.totalProfit || 0), 0);
    const activeCount = userInvestments.filter(inv => !inv.completed).length;

    res.status(200).json({ message: userInvestments, totalProfit, activeCount });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching user investments" });
  }
};

// Internal function to be called by both Cron and Admin Route
exports.processDailyProfitsInternal = async (targetUserId = null, force = false) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  console.log(`\n[Cron/Admin] === PROCESSING ${targetUserId ? `USER ${targetUserId}` : 'ALL'} DAILY PROFITS ${force ? '(FORCED)' : ''} ===`);
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Build Query
    const query = { completed: false };
    
    if (!force) {
      query.nextPayDate = { $lte: today };
      query.$or = [
        { lastProcessedDate: { $ne: today } },
        { lastProcessedDate: { $exists: false } }
      ];
    }

    // 2. If targetUserId is provided, filter query to only this user's investments
    if (targetUserId) {
      const userInvoices = await Invoice.find({ user: targetUserId }).select('_id').session(session);
      const invoiceIds = userInvoices.map(inv => inv._id);
      
      const userPendingConfirmations = await PendingConfirmation.find({ 
        invoice: { $in: invoiceIds } 
      }).select('_id').session(session);
      const pcIds = userPendingConfirmations.map(pc => pc._id);
      
      query.pendingConfirmation = { $in: pcIds };
    }

    // 3. Fetch investments based on optimized query
    const listToProcess = await Investments.find(query)
      .populate({
        path: 'pendingConfirmation',
        populate: { path: 'invoice' }
      })
      .session(session);

    if (!listToProcess.length) {
      console.log("  No investments met the criteria.");
      await session.commitTransaction();
      session.endSession();
      return { processedCount: 0 };
    }

    let processedCount = 0;

    for (const invest of listToProcess) {
      const invoice = await Invoice.findById(invest.pendingConfirmation.invoice)
        .populate("plan")
        .populate("user")
        .session(session);

      if (!invoice || !invoice.user || !invoice.plan) {
        console.log(`  ERROR: Missing relations for investment ${invest._id} - skipping`);
        continue;
      }

      const wallet = await Wallet.findOne({ owner: invoice.user._id }).session(session);
      if (!wallet) {
        console.log(`  ERROR: Wallet not found for user ${invoice.user._id} - skipping`);
        continue;
      }

      const percentage = todayPercentage(
        invoice.plan.dailyProfitMin,
        invoice.plan.dailyProfitMax
      );

      const invoiceAmount = parseFloat(invoice.amount);
      const dailyProfit = parseFloat(((invoiceAmount * percentage) / 100).toFixed(2));

      invest.previousPercentage = invest.currentPercentage;
      invest.currentPercentage = percentage;
      invest.totalProfit += dailyProfit;
      invest.received += dailyProfit;
      invest.lastProcessedDate = today;

      if (invest.currentPercentage === invest.previousPercentage) {
        invest.profitTrend = "flat";
      } else if (invest.currentPercentage < invest.previousPercentage) {
        invest.profitTrend = "loss";
      } else {
        invest.profitTrend = "gain";
      }

      wallet.currencyAmount = parseFloat((wallet.currencyAmount + dailyProfit).toFixed(2));

      if (today >= invest.investmentEndDate) {
        invest.completed = true;
        invest.status = "completed";
      } else {
        const nextPay = new Date(today);
        nextPay.setDate(nextPay.getDate() + 1);
        invest.nextPayDate = nextPay;
      }

      await createTransaction(
        dailyProfit,
        `Daily ROI: ${percentage}% on ${invoice.plan.name} Plan`,
        "user",
        invoice.user._id,
        session
      );

      await invest.save({ session });
      await wallet.save({ session });
      processedCount++;
    }

    await session.commitTransaction();
    session.endSession();
    console.log(`  Successfully processed ${processedCount} investments.`);
    return { processedCount };

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error("  PROCESS FAILED:", error);
    throw error;
  }
};

exports.updateAllUserInvestments = async (req, res) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  try {
    const { userId } = req.params;
    const force = req.query.force === 'true';
    
    const result = await this.processDailyProfitsInternal(userId, force);
    
    res.status(200).json({ 
      processedCount: result.processedCount,
      message: result.processedCount > 0 
        ? `Successfully processed ${result.processedCount} investments` 
        : "No investments due today (or user already paid)" 
    });
  } catch (error) {
    res.status(500).json({ message: "Profit update failed", error: error.message });
  }
};

exports.cronUpdateAll = async (req, res) => {
  // Security check: Only allow if a secret header matches (or if it's Vercel's Cron request)
  // Vercel adds a special header: Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn("Unauthorized Cron Attempt blocked.");
    return res.status(401).json({ message: "Unauthorized Cron Access" });
  }

  try {
    console.log("[Vercel Cron] Starting automated daily payout...");
    const result = await this.processDailyProfitsInternal();
    res.status(200).json({ 
      success: true, 
      processed: result.processedCount,
      message: `Cron job finished. Processed ${result.processedCount} investments.`
    });
  } catch (error) {
    console.error("[Vercel Cron] Failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
