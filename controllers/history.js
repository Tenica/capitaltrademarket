const Transactions = require("../model/transactions");
const User = require("../model/user");
const Wallet = require("../model/wallet");
const Investments = require("../model/investments");

/**
 * Calculates historical growth data for a user or admin
 * Returns an array of { name: 'Month/Day', value: totalEquity }
 */
exports.getHistoryData = async (req, res) => {
  const isAdmin = req.user.isAdmin;
  const userId = req.user._id;

  try {
    const daysToLookBack = 30;
    const history = [];
    const now = new Date();
    
    // Generate dates for the last 30 days
    for (let i = daysToLookBack; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      history.push({ 
        date: d, 
        name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: 0 
      });
    }

    if (isAdmin) {
      // ADMIN: Show platform-wide AUM (Total Deposits - Total Withdrawals)
      const allTransactions = await Transactions.find({}).sort({ createdAt: 1 });
      
      let runningTotal = 0;
      let historyIndex = 0;

      for (const tx of allTransactions) {
        const txAmount = parseFloat(tx.amount) || 0;
        const desc = tx.description.toLowerCase();
        
        // Inflow vs Outflow logic
        if (desc.includes('deposit') || desc.includes('credit') || desc.includes('roi')) {
          runningTotal += txAmount;
        } else if (desc.includes('withdrawal')) {
          runningTotal -= txAmount;
        }

        // Update history points that occur after this transaction
        while (historyIndex < history.length && tx.createdAt >= history[historyIndex].date) {
            history[historyIndex].value = runningTotal;
            historyIndex++;
        }
      }
      
      // Fill remaining days with last known total
      while (historyIndex < history.length) {
        history[historyIndex].value = runningTotal;
        historyIndex++;
      }

    } else {
      // USER: Show individual Portfolio Growth (Balance + Active Investments)
      const userTransactions = await Transactions.find({ user: userId }).sort({ createdAt: 1 });
      
      let runningTotal = 0;
      let historyIndex = 0;

      for (const tx of userTransactions) {
        const txAmount = parseFloat(tx.amount) || 0;
        const desc = tx.description.toLowerCase();

        // For a user, we track their "Total Equity"
        // Most transaction records are "Inflows" (Deposits, ROI)
        // Only "Withdrawal" records are "Outflows"
        if (desc.includes('withdrawal')) {
          runningTotal -= txAmount;
        } else {
          runningTotal += txAmount;
        }

        while (historyIndex < history.length && tx.createdAt >= history[historyIndex].date) {
            history[historyIndex].value = parseFloat(runningTotal.toFixed(2));
            historyIndex++;
        }
      }

      while (historyIndex < history.length) {
        history[historyIndex].value = parseFloat(runningTotal.toFixed(2));
        historyIndex++;
      }
    }

    // Format for Recharts
    const chartData = history.map(h => ({
      name: h.name,
      value: h.value
    }));

    res.status(200).json({ chartData });
  } catch (error) {
    console.error("History data error:", error);
    res.status(500).json({ message: "Error calculating growth history" });
  }
};
