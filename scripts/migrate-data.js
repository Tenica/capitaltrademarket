const dotenv = require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URL;

async function migrateData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Migrate wallet currencyAmount from string to number
    console.log('\n--- Migrating Wallet currencyAmount ---');
    const walletsCollection = db.collection('wallets');
    const wallets = await walletsCollection.find({
      currencyAmount: { $type: 'string' }
    }).toArray();

    console.log(`Found ${wallets.length} wallets with string currencyAmount`);

    for (const wallet of wallets) {
      const numericAmount = parseFloat(wallet.currencyAmount) || 0;
      await walletsCollection.updateOne(
        { _id: wallet._id },
        { $set: { currencyAmount: numericAmount } }
      );
      console.log(`  Wallet ${wallet._id}: "${wallet.currencyAmount}" -> ${numericAmount}`);
    }

    // Migrate investment dates from string (DD/MM/YYYY) to Date objects
    console.log('\n--- Migrating Investment dates ---');
    const investmentsCollection = db.collection('investments');
    const investments = await investmentsCollection.find({
      $or: [
        { nextPayDate: { $type: 'string' } },
        { investmentDate: { $type: 'string' } },
        { investmentEndDate: { $type: 'string' } }
      ]
    }).toArray();

    console.log(`Found ${investments.length} investments with string dates`);

    for (const investment of investments) {
      const updates = {};

      if (typeof investment.nextPayDate === 'string') {
        updates.nextPayDate = parseDate(investment.nextPayDate);
      }
      if (typeof investment.investmentDate === 'string') {
        updates.investmentDate = parseDate(investment.investmentDate);
      }
      if (typeof investment.investmentEndDate === 'string') {
        updates.investmentEndDate = parseDate(investment.investmentEndDate);
      }

      if (Object.keys(updates).length > 0) {
        await investmentsCollection.updateOne(
          { _id: investment._id },
          { $set: updates }
        );
        console.log(`  Investment ${investment._id}: updated date fields`);
      }
    }

    // Migrate investment field names: profit -> profitTrend, add totalProfit and previousPercentage
    console.log('\n--- Migrating Investment field names ---');
    const allInvestments = await investmentsCollection.find({}).toArray();

    console.log(`Found ${allInvestments.length} investments to check for field migration`);

    for (const investment of allInvestments) {
      const updates = {};
      const unsetFields = {};

      // Rename profit to profitTrend
      if (investment.profit !== undefined && investment.profitTrend === undefined) {
        updates.profitTrend = investment.profit;
        unsetFields.profit = "";
      }

      // Add totalProfit from received if not exists
      if (investment.totalProfit === undefined) {
        updates.totalProfit = investment.received || 0;
      }

      // Add previousPercentage if not exists
      if (investment.previousPercentage === undefined) {
        updates.previousPercentage = 0;
      }

      if (Object.keys(updates).length > 0 || Object.keys(unsetFields).length > 0) {
        const updateQuery = {};
        if (Object.keys(updates).length > 0) updateQuery.$set = updates;
        if (Object.keys(unsetFields).length > 0) updateQuery.$unset = unsetFields;

        await investmentsCollection.updateOne(
          { _id: investment._id },
          updateQuery
        );
        console.log(`  Investment ${investment._id}: migrated fields`);
      }
    }

    console.log('\n--- Migration complete ---');
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Parse DD/MM/YYYY string to Date object
function parseDate(dateString) {
  if (!dateString) return new Date();

  // Handle DD/MM/YYYY format
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }

  // Fallback: try parsing as ISO string or other format
  return new Date(dateString);
}

migrateData();
