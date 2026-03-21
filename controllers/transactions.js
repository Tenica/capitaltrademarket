const Transactions = require('../model/transactions')


exports.createTransaction = async (amount, description, type, user, session = null) => {
    const transaction = new Transactions({
        amount: amount,
        description: description,
        type: type,
        user: user,
      });
      const saveTransaction = await transaction.save({ session });  

      return saveTransaction;
}

exports.viewTransaction = async (req, res, next) => {
    const userId = req.params.id;

    try {
        const transactions = await Transactions.find({ user: userId }).sort({ createdAt: -1 });
        res.status(200).json({ message: transactions });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error fetching transactions" });
    }
}

//Admin Route
exports.viewAllUserTransactions = async (req, res, next) => {
    const adminAccess = req.user.isAdmin;

     try {
        if (adminAccess) {
           const transactions = await Transactions.find().sort({ createdAt: -1 }).populate("user");
            res.status(200).json({ message: transactions });
        }
        
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error fetching transactions" });
    }
}