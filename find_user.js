const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./model/user');
const Wallet = require('./model/wallet');
const Investment = require('./model/investments');
const PendingConfirmation = require('./model/pending-confirmation');
const Invoice = require('./model/invoice');

const MONGODB_URI = process.env.MONGODB_URL;

async function findUser() {
  await mongoose.connect(MONGODB_URI);
  try {
    const user = await User.findOne({ 
      $or: [
        { firstName: /Georgios/i, lastName: /Drougkas/i },
        { email: /drougkas/i }
      ]
    });

    if (!user) {
      console.log("User not found.");
      return;
    }

    console.log("USER_ID:", user._id);
    console.log("USER_EMAIL:", user.email);
    console.log("USER_NAME:", `${user.firstName} ${user.lastName}`);

    const wallet = await Wallet.findOne({ owner: user._id });
    console.log("WALLET:", JSON.stringify(wallet, null, 2));

    const invoices = await Invoice.find({ user: user._id });
    const invoiceIds = invoices.map(inv => inv._id);
    console.log("INVOICE_COUNT:", invoices.length);

    const pendingConfirmations = await PendingConfirmation.find({ invoice: { $in: invoiceIds } });
    const pcIds = pendingConfirmations.map(pc => pc._id);
    console.log("PENDING_CONFIRMATION_COUNT:", pendingConfirmations.length);

    const investments = await Investment.find({ pendingConfirmation: { $in: pcIds } });
    console.log("INVESTMENT_COUNT:", investments.length);
    console.log("INVESTMENTS:", JSON.stringify(investments, null, 2));

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

findUser();
