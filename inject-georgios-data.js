const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./model/user');
const Wallet = require('./model/wallet');
const Investment = require('./model/investments');
const PendingConfirmation = require('./model/pending-confirmation');
const Invoice = require('./model/invoice');
const Plan = require('./model/plan');

const MONGODB_URI = process.env.MONGODB_URL;

async function injectData() {
  await mongoose.connect(MONGODB_URI);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findOne({ 
      $or: [
        { firstName: /Georgios/i, lastName: /Drougkas/i },
        { email: /drougkas/i }
      ]
    }).session(session);

    if (!user) {
      console.log("User not found.");
      return;
    }

    console.log("Found User:", user.email);

    // 1. Update Wallet
    const wallet = await Wallet.findOne({ owner: user._id }).session(session);
    if (wallet) {
      wallet.currencyAmount = 24814.03;
      await wallet.save({ session });
      console.log("Wallet updated to $24,814.03");
    }

    // 2. Clear existing investments to avoid confusion (or just update the first one)
    // The user has 3 invoices, let's look at their investments.
    const invoices = await Invoice.find({ user: user._id }).session(session);
    const invoiceIds = invoices.map(inv => inv._id);
    const pcs = await PendingConfirmation.find({ invoice: { $in: invoiceIds } }).session(session);
    const pcIds = pcs.map(pc => pc._id);
    
    // We'll update the first investment to be the "Master" one
    let investment = await Investment.findOne({ pendingConfirmation: { $in: pcIds } }).session(session);
    
    if (!investment) {
      console.log("No investment found, creating one...");
      // Need a plan
      const plan = await Plan.findOne().session(session);
      const invoice = new Invoice({
        invoiceNumber: "999999",
        amount: "307.00",
        cryptoAmount: "307.00",
        systemAddress: "MANUAL_INJECTION",
        transactionId: "MANUAL_INJECTION_TX",
        status: true,
        user: user._id,
        plan: plan._id
      });
      await invoice.save({ session });

      const pc = new PendingConfirmation({
        invoice: invoice._id,
        status: true
      });
      await pc.save({ session });

      investment = new Investment({
        pendingConfirmation: pc._id,
        nextPayDate: new Date(),
        investmentEndDate: new Date("2030-01-01"),
        status: "active"
      });
    } else {
        // Update the linked invoice amount to $307
        const pc = await PendingConfirmation.findById(investment.pendingConfirmation).session(session);
        const invoice = await Invoice.findById(pc.invoice).session(session);
        invoice.amount = "307.00";
        await invoice.save({ session });
        console.log("Invoice amount updated to $307.00");
    }

    const startDate = new Date("2021-11-27T00:00:00Z");
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30); // 30-day plan duration

    investment.totalProfit = 24507.03;
    investment.received = 24507.03;
    investment.investmentDate = startDate;
    investment.investmentEndDate = endDate;
    investment.nextPayDate = endDate; // No more payouts
    investment.status = "completed";
    investment.completed = true;

    await investment.save({ session });
    console.log("Investment updated to COMPLETED (Principle $307, Profit $24,507.03, Start Nov 27 2021, End Dec 27 2021)");

    await session.commitTransaction();
    console.log("DATA INJECTION SUCCESSFUL");

  } catch (error) {
    await session.abortTransaction();
    console.error("FAILED:", error);
  } finally {
    session.endSession();
    await mongoose.disconnect();
  }
}

injectData();
